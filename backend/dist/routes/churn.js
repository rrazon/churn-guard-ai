"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../services/database");
const churnPrediction_1 = require("../services/churnPrediction");
const router = express_1.default.Router();
router.get('/predictions', (req, res) => {
    try {
        const { page = '1', limit = '50', risk_level } = req.query;
        let predictions = [...database_1.database.churnPredictions];
        if (risk_level) {
            predictions = predictions.filter(p => {
                if (p.churn_probability >= 0.8)
                    return risk_level === 'critical';
                if (p.churn_probability >= 0.6)
                    return risk_level === 'high';
                if (p.churn_probability >= 0.3)
                    return risk_level === 'medium';
                return risk_level === 'low';
            });
        }
        predictions.sort((a, b) => b.churn_probability - a.churn_probability);
        const predictionsWithCustomers = predictions.map(prediction => {
            const customer = database_1.database.customers.find(c => c.id === prediction.customer_id);
            return {
                ...prediction,
                customer: customer ? {
                    id: customer.id,
                    company_name: customer.company_name,
                    industry: customer.industry,
                    mrr: customer.mrr,
                    health_score: customer.health_score
                } : null
            };
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedPredictions = predictionsWithCustomers.slice(startIndex, endIndex);
        res.json({
            predictions: paginatedPredictions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: predictions.length,
                totalPages: Math.ceil(predictions.length / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/predict/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = database_1.database.customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const recentMetrics = database_1.database.usageMetrics
            .filter(m => m.customer_id === customerId)
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 30);
        if (recentMetrics.length === 0) {
            return res.status(400).json({ error: 'No usage data available for prediction' });
        }
        const newPrediction = (0, churnPrediction_1.calculateChurnProbability)(customer, recentMetrics);
        const existingIndex = database_1.database.churnPredictions.findIndex(p => p.customer_id === customerId);
        if (existingIndex >= 0) {
            database_1.database.churnPredictions[existingIndex] = newPrediction;
        }
        else {
            database_1.database.churnPredictions.push(newPrediction);
        }
        res.json({
            prediction: newPrediction,
            message: 'Churn prediction updated successfully'
        });
    }
    catch (error) {
        console.error('Generate prediction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/factors/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;
        const prediction = database_1.database.churnPredictions.find(p => p.customer_id === customerId);
        if (!prediction) {
            return res.status(404).json({ error: 'Prediction not found for customer' });
        }
        const customer = database_1.database.customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const factorAnalysis = {
            overall_risk: prediction.churn_probability,
            confidence: prediction.confidence_score,
            contributing_factors: prediction.contributing_factors,
            recommendations: generateRecommendations(prediction.contributing_factors),
            trend_analysis: {
                health_score_trend: 'declining', // This would be calculated from historical data
                usage_trend: 'stable',
                support_trend: 'increasing'
            }
        };
        res.json({
            customer_id: customerId,
            company_name: customer.company_name,
            analysis: factorAnalysis,
            last_updated: prediction.created_at
        });
    }
    catch (error) {
        console.error('Get risk factors error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/trends', (req, res) => {
    try {
        const { period = '12' } = req.query;
        const months = parseInt(period);
        const trends = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthPredictions = database_1.database.churnPredictions.filter(p => {
                const predictionMonth = p.prediction_date.getMonth();
                const predictionYear = p.prediction_date.getFullYear();
                return predictionMonth === date.getMonth() && predictionYear === date.getFullYear();
            });
            const highRiskCount = monthPredictions.filter(p => p.churn_probability >= 0.6).length;
            const totalCustomers = database_1.database.customers.length;
            trends.push({
                month: date.toISOString().slice(0, 7), // YYYY-MM format
                high_risk_customers: highRiskCount,
                total_customers: totalCustomers,
                churn_risk_percentage: totalCustomers > 0 ? (highRiskCount / totalCustomers) * 100 : 0,
                avg_churn_probability: monthPredictions.length > 0
                    ? monthPredictions.reduce((sum, p) => sum + p.churn_probability, 0) / monthPredictions.length
                    : 0
            });
        }
        res.json({ trends });
    }
    catch (error) {
        console.error('Get churn trends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
function generateRecommendations(factors) {
    const recommendations = [];
    if (factors.low_usage && factors.low_usage > 0.3) {
        recommendations.push('Schedule product training session to increase feature adoption');
        recommendations.push('Provide personalized onboarding to improve user engagement');
    }
    if (factors.support_issues && factors.support_issues > 0.3) {
        recommendations.push('Assign dedicated customer success manager for immediate support');
        recommendations.push('Review and resolve outstanding support tickets');
    }
    if (factors.payment_delays && factors.payment_delays > 0.3) {
        recommendations.push('Contact billing team to resolve payment issues');
        recommendations.push('Offer flexible payment terms or temporary discount');
    }
    if (factors.feature_adoption && factors.feature_adoption > 0.3) {
        recommendations.push('Demonstrate advanced features that align with customer goals');
        recommendations.push('Create custom feature adoption plan');
    }
    return recommendations.length > 0 ? recommendations : ['Monitor customer closely and maintain regular check-ins'];
}
exports.default = router;
//# sourceMappingURL=churn.js.map