import express from 'express';
import { database } from '../services/database';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/overview', (req: AuthRequest, res) => {
  try {
    const customers = database.customers;
    const predictions = database.churnPredictions;
    const interventions = database.interventions;

    const totalARR = customers.reduce((sum, c) => sum + (c.mrr * 12), 0);
    const avgHealthScore = customers.reduce((sum, c) => sum + c.health_score, 0) / customers.length;
    
    const highRiskCustomers = customers.filter(c => c.churn_risk_level === 'high' || c.churn_risk_level === 'critical');
    const churnRate = (highRiskCustomers.length / customers.length) * 100;
    
    const revenueAtRisk = highRiskCustomers.reduce((sum, c) => sum + (c.mrr * 12), 0);
    
    const riskLevelCounts = {
      low: customers.filter(c => c.churn_risk_level === 'low').length,
      medium: customers.filter(c => c.churn_risk_level === 'medium').length,
      high: customers.filter(c => c.churn_risk_level === 'high').length,
      critical: customers.filter(c => c.churn_risk_level === 'critical').length
    };

    const completedInterventions = interventions.filter(i => i.status === 'completed');
    const successfulInterventions = completedInterventions.filter(i => i.outcome === 'successful');
    const interventionSuccessRate = completedInterventions.length > 0 
      ? (successfulInterventions.length / completedInterventions.length) * 100 
      : 0;

    res.json({
      total_arr: totalARR,
      total_customers: customers.length,
      avg_health_score: Math.round(avgHealthScore),
      churn_rate: Math.round(churnRate * 100) / 100,
      revenue_at_risk: revenueAtRisk,
      at_risk_customers: highRiskCustomers.length,
      risk_level_distribution: riskLevelCounts,
      intervention_success_rate: Math.round(interventionSuccessRate * 100) / 100,
      active_interventions: interventions.filter(i => i.status === 'in_progress').length
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cohorts', (req: AuthRequest, res) => {
  try {
    const { period = '12' } = req.query;
    const months = parseInt(period as string);

    const cohorts: any[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const cohortDate = new Date();
      cohortDate.setMonth(cohortDate.getMonth() - i);
      
      const cohortCustomers = database.customers.filter(c => {
        const customerMonth = c.created_at.getMonth();
        const customerYear = c.created_at.getFullYear();
        return customerMonth === cohortDate.getMonth() && customerYear === cohortDate.getFullYear();
      });

      if (cohortCustomers.length > 0) {
        const activeCustomers = cohortCustomers.filter(c => c.health_score > 30).length;
        const retentionRate = (activeCustomers / cohortCustomers.length) * 100;
        
        cohorts.push({
          cohort_month: cohortDate.toISOString().slice(0, 7),
          initial_customers: cohortCustomers.length,
          active_customers: activeCustomers,
          retention_rate: Math.round(retentionRate * 100) / 100,
          avg_health_score: Math.round(cohortCustomers.reduce((sum, c) => sum + c.health_score, 0) / cohortCustomers.length),
          total_mrr: cohortCustomers.reduce((sum, c) => sum + c.mrr, 0)
        });
      }
    }

    res.json({ cohorts });
  } catch (error) {
    console.error('Get cohort analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/revenue-at-risk', (req: AuthRequest, res) => {
  try {
    const customers = database.customers;
    const predictions = database.churnPredictions;

    const revenueAnalysis = {
      by_risk_level: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      by_industry: {} as any,
      by_churn_probability: {
        very_high: 0,  // >80%
        high: 0,       // 60-80%
        medium: 0,     // 30-60%
        low: 0         // <30%
      },
      total_at_risk: 0,
      total_arr: 0
    };

    customers.forEach(customer => {
      const annualRevenue = customer.mrr * 12;
      revenueAnalysis.total_arr += annualRevenue;

      revenueAnalysis.by_risk_level[customer.churn_risk_level] += annualRevenue;

      if (!revenueAnalysis.by_industry[customer.industry]) {
        revenueAnalysis.by_industry[customer.industry] = 0;
      }
      revenueAnalysis.by_industry[customer.industry] += annualRevenue;

      const prediction = predictions.find(p => p.customer_id === customer.id);
      if (prediction) {
        if (prediction.churn_probability >= 0.8) {
          revenueAnalysis.by_churn_probability.very_high += annualRevenue;
        } else if (prediction.churn_probability >= 0.6) {
          revenueAnalysis.by_churn_probability.high += annualRevenue;
        } else if (prediction.churn_probability >= 0.3) {
          revenueAnalysis.by_churn_probability.medium += annualRevenue;
        } else {
          revenueAnalysis.by_churn_probability.low += annualRevenue;
        }
      }

      if (customer.churn_risk_level === 'high' || customer.churn_risk_level === 'critical') {
        revenueAnalysis.total_at_risk += annualRevenue;
      }
    });

    res.json(revenueAnalysis);
  } catch (error) {
    console.error('Get revenue at risk error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/csm-metrics', (req: AuthRequest, res) => {
  try {
    const { csm_name } = req.query;
    const csmName = csm_name as string || 'Customer Success Manager';
    
    const assignedCustomers = database.customers.filter(c => c.customer_success_manager === csmName);
    const csmInterventions = database.interventions.filter(i => i.assigned_to === csmName);
    const csmTasks = database.tasks.filter(t => t.assigned_to === csmName);
    
    const totalARR = assignedCustomers.reduce((sum, c) => sum + c.mrr, 0) * 12;
    const atRiskARR = assignedCustomers
      .filter(c => c.churn_risk_level === 'high' || c.churn_risk_level === 'critical')
      .reduce((sum, c) => sum + c.mrr, 0) * 12;
    
    const completedInterventions = csmInterventions.filter(i => i.status === 'completed');
    const successfulInterventions = completedInterventions.filter(i => i.outcome === 'successful');
    const interventionSuccessRate = completedInterventions.length > 0 
      ? (successfulInterventions.length / completedInterventions.length) * 100 
      : 0;
    
    const completedTasks = csmTasks.filter(t => t.status === 'completed');
    const totalTasks = csmTasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    const activeInterventions = csmInterventions.filter(i => i.status === 'in_progress' || i.status === 'pending');
    const totalEstimatedHours = activeInterventions.reduce((sum, i) => sum + (i.estimated_time_hours || 0), 0) +
                               csmTasks.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.estimated_time_hours, 0);
    
    const capacityUtilization = Math.min((totalEstimatedHours / 40) * 100, 100);
    
    const avgHealthScore = assignedCustomers.length > 0 
      ? assignedCustomers.reduce((sum, c) => sum + c.health_score, 0) / assignedCustomers.length 
      : 0;
    
    res.json({
      customers_managed: assignedCustomers.length,
      total_arr_responsibility: totalARR,
      at_risk_arr: atRiskARR,
      active_interventions: activeInterventions.length,
      intervention_success_rate: Math.round(interventionSuccessRate),
      task_completion_rate: Math.round(taskCompletionRate),
      capacity_utilization: Math.round(capacityUtilization),
      average_customer_health: Math.round(avgHealthScore),
      tasks_pending: csmTasks.filter(t => t.status === 'pending').length,
      tasks_in_progress: csmTasks.filter(t => t.status === 'in_progress').length,
      tasks_completed_this_week: completedTasks.filter(t => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return t.updated_at >= weekAgo;
      }).length
    });
  } catch (error) {
    console.error('Error fetching CSM metrics:', error);
    res.status(500).json({ error: 'Failed to fetch CSM metrics' });
  }
});

router.get('/intervention-effectiveness', (req: AuthRequest, res) => {
  try {
    const interventions = database.interventions;
    const customers = database.customers;

    const effectiveness = {
      total_interventions: interventions.length,
      completed_interventions: interventions.filter(i => i.status === 'completed').length,
      successful_interventions: interventions.filter(i => i.outcome === 'successful').length,
      success_rate: 0,
      by_type: {} as any,
      avg_health_improvement: 0,
      estimated_revenue_saved: 0
    };

    const completedInterventions = interventions.filter(i => i.status === 'completed');
    effectiveness.success_rate = completedInterventions.length > 0 
      ? (effectiveness.successful_interventions / completedInterventions.length) * 100 
      : 0;

    const interventionTypes = ['call', 'email', 'meeting', 'training', 'discount', 'feature_demo'];
    interventionTypes.forEach(type => {
      const typeInterventions = completedInterventions.filter(i => i.intervention_type === type);
      const typeSuccessful = typeInterventions.filter(i => i.outcome === 'successful');
      
      effectiveness.by_type[type] = {
        total: typeInterventions.length,
        successful: typeSuccessful.length,
        success_rate: typeInterventions.length > 0 ? (typeSuccessful.length / typeInterventions.length) * 100 : 0
      };
    });

    const successfulInterventions = interventions.filter(i => i.outcome === 'successful');
    effectiveness.estimated_revenue_saved = successfulInterventions.reduce((total, intervention) => {
      const customer = customers.find(c => c.id === intervention.customer_id);
      return total + (customer ? customer.mrr * 12 * 0.8 : 0); // Assume 80% of ARR would have been lost
    }, 0);

    res.json(effectiveness);
  } catch (error) {
    console.error('Get intervention effectiveness error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
