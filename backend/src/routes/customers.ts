import express from 'express';
import { database } from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { calculateHealthScore } from '../services/healthScore';
import { validateRequest, sanitizeSearchQuery } from '../middleware/validation';
import { strictRateLimit } from '../middleware/security';
import { auditLogger } from '../services/auditLogger';

const router = express.Router();

router.get('/', validateRequest([
  { field: 'risk_level', type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
  { field: 'industry', type: 'string', maxLength: 100, sanitize: true },
  { field: 'mrr_min', type: 'number', min: 0 },
  { field: 'mrr_max', type: 'number', min: 0 },
  { field: 'search', type: 'string', maxLength: 100, sanitize: true },
  { field: 'page', type: 'number', min: 1, max: 1000 },
  { field: 'limit', type: 'number', min: 1, max: 100 }
]), (req: AuthRequest, res) => {
  try {
    const { 
      risk_level, 
      industry, 
      mrr_min, 
      mrr_max, 
      search, 
      page = '1', 
      limit = '50' 
    } = req.query;

    let customers = [...database.customers];

    if (risk_level) {
      customers = customers.filter(c => c.churn_risk_level === risk_level);
    }

    if (industry) {
      customers = customers.filter(c => c.industry === industry);
    }

    if (mrr_min) {
      customers = customers.filter(c => c.mrr >= parseInt(mrr_min as string));
    }

    if (mrr_max) {
      customers = customers.filter(c => c.mrr <= parseInt(mrr_max as string));
    }

    if (search) {
      const searchTerm = sanitizeSearchQuery(search as string).toLowerCase();
      if (searchTerm) {
        customers = customers.filter(c => 
          c.company_name.toLowerCase().includes(searchTerm) ||
          c.industry.toLowerCase().includes(searchTerm) ||
          c.customer_success_manager.toLowerCase().includes(searchTerm)
        );
      }
    }

    customers.sort((a, b) => a.health_score - b.health_score);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    res.json({
      customers: paginatedCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: customers.length,
        totalPages: Math.ceil(customers.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/at-risk', (req: AuthRequest, res) => {
  try {
    const atRiskCustomers = database.customers.filter(c => 
      c.churn_risk_level === 'high' || c.churn_risk_level === 'critical'
    );

    res.json({
      customers: atRiskCustomers,
      count: atRiskCustomers.length,
      total_arr_at_risk: atRiskCustomers.reduce((sum, c) => sum + c.mrr * 12, 0)
    });
  } catch (error) {
    console.error('Get at-risk customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const customer = database.customers.find(c => c.id === id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const recentMetrics = database.usageMetrics
      .filter(m => m.customer_id === id)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 30);

    const churnPrediction = database.churnPredictions.find(p => p.customer_id === id);

    const interventions = database.interventions
      .filter(i => i.customer_id === id)
      .sort((a, b) => b.created_date.getTime() - a.created_date.getTime());

    res.json({
      customer,
      recent_metrics: recentMetrics,
      churn_prediction: churnPrediction,
      interventions
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/health-history', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const customer = database.customers.find(c => c.id === id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const metrics = database.usageMetrics
      .filter(m => m.customer_id === id && m.date >= twelveMonthsAgo)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const healthHistory = metrics.map(metric => ({
      date: metric.date,
      health_score: calculateHealthScore(metric, customer),
      daily_active_users: metric.daily_active_users,
      feature_usage: metric.feature_usage_count,
      support_tickets: metric.support_tickets_opened
    }));

    res.json({ health_history: healthHistory });
  } catch (error) {
    console.error('Get health history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/health', strictRateLimit, validateRequest([
  { field: 'id', required: true, type: 'uuid' },
  { field: 'health_score', required: true, type: 'number', min: 0, max: 100 },
  { field: 'notes', type: 'string', maxLength: 1000, sanitize: true }
]), (req: AuthRequest, res) => {
  try {
    const { id } = req.validatedData;
    const { health_score, notes } = req.validatedData;

    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'csm')) {
      auditLogger.log({
        userId: req.user?.id,
        action: 'HEALTH_SCORE_UPDATE_DENIED',
        resource: `customer:${id}`,
        ip: req.ip,
        success: false,
        details: { reason: 'Insufficient permissions' }
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const customer = database.customers.find(c => c.id === id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const oldScore = customer.health_score;
    customer.health_score = health_score;
    customer.updated_at = new Date();

    if (health_score >= 80) customer.churn_risk_level = 'low';
    else if (health_score >= 50) customer.churn_risk_level = 'medium';
    else if (health_score >= 20) customer.churn_risk_level = 'high';
    else customer.churn_risk_level = 'critical';

    auditLogger.log({
      userId: req.user.id,
      action: 'HEALTH_SCORE_UPDATED',
      resource: `customer:${id}`,
      ip: req.ip,
      success: true,
      details: { 
        customerId: id,
        oldScore,
        newScore: health_score,
        notes 
      }
    });

    res.json({ 
      customer,
      message: 'Health score updated successfully',
      updated_by: req.user.name
    });
  } catch (error) {
    console.error('Update health score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
