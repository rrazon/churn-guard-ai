"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../services/database");
const router = express_1.default.Router();
router.get('/overview', (req, res) => {
    try {
        const customers = database_1.database.customers;
        const predictions = database_1.database.churnPredictions;
        const interventions = database_1.database.interventions;
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
    }
    catch (error) {
        console.error('Get overview analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/cohorts', (req, res) => {
    try {
        const { period = '12' } = req.query;
        const months = parseInt(period);
        const cohorts = [];
        for (let i = months - 1; i >= 0; i--) {
            const cohortDate = new Date();
            cohortDate.setMonth(cohortDate.getMonth() - i);
            const cohortCustomers = database_1.database.customers.filter(c => {
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
    }
    catch (error) {
        console.error('Get cohort analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/revenue-at-risk', (req, res) => {
    try {
        const customers = database_1.database.customers;
        const predictions = database_1.database.churnPredictions;
        const revenueAnalysis = {
            by_risk_level: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            by_industry: {},
            by_churn_probability: {
                very_high: 0, // >80%
                high: 0, // 60-80%
                medium: 0, // 30-60%
                low: 0 // <30%
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
                }
                else if (prediction.churn_probability >= 0.6) {
                    revenueAnalysis.by_churn_probability.high += annualRevenue;
                }
                else if (prediction.churn_probability >= 0.3) {
                    revenueAnalysis.by_churn_probability.medium += annualRevenue;
                }
                else {
                    revenueAnalysis.by_churn_probability.low += annualRevenue;
                }
            }
            if (customer.churn_risk_level === 'high' || customer.churn_risk_level === 'critical') {
                revenueAnalysis.total_at_risk += annualRevenue;
            }
        });
        res.json(revenueAnalysis);
    }
    catch (error) {
        console.error('Get revenue at risk error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/intervention-effectiveness', (req, res) => {
    try {
        const interventions = database_1.database.interventions;
        const customers = database_1.database.customers;
        const effectiveness = {
            total_interventions: interventions.length,
            completed_interventions: interventions.filter(i => i.status === 'completed').length,
            successful_interventions: interventions.filter(i => i.outcome === 'successful').length,
            success_rate: 0,
            by_type: {},
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
    }
    catch (error) {
        console.error('Get intervention effectiveness error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map