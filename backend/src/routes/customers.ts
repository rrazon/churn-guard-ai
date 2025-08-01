import express from 'express';
import { database } from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { calculateHealthScore } from '../services/healthScore';

const router = express.Router();

router.get('/', (req: AuthRequest, res) => {
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
      const searchTerm = (search as string).toLowerCase();
      customers = customers.filter(c => 
        c.company_name.toLowerCase().includes(searchTerm) ||
        c.industry.toLowerCase().includes(searchTerm) ||
        c.customer_success_manager.toLowerCase().includes(searchTerm)
      );
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

router.put('/:id/health', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { health_score, notes } = req.body;

    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'csm')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const customer = database.customers.find(c => c.id === id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (health_score < 0 || health_score > 100) {
      return res.status(400).json({ error: 'Health score must be between 0 and 100' });
    }

    customer.health_score = health_score;
    customer.updated_at = new Date();

    if (health_score >= 80) customer.churn_risk_level = 'low';
    else if (health_score >= 50) customer.churn_risk_level = 'medium';
    else if (health_score >= 20) customer.churn_risk_level = 'high';
    else customer.churn_risk_level = 'critical';

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
