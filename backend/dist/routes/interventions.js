"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../services/database");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    try {
        const { status, intervention_type, assigned_to, customer_id, page = '1', limit = '50' } = req.query;
        let interventions = [...database_1.database.interventions];
        if (status) {
            interventions = interventions.filter(i => i.status === status);
        }
        if (intervention_type) {
            interventions = interventions.filter(i => i.intervention_type === intervention_type);
        }
        if (assigned_to) {
            interventions = interventions.filter(i => i.assigned_to === assigned_to);
        }
        if (customer_id) {
            interventions = interventions.filter(i => i.customer_id === customer_id);
        }
        interventions.sort((a, b) => b.created_date.getTime() - a.created_date.getTime());
        const interventionsWithCustomers = interventions.map(intervention => {
            const customer = database_1.database.customers.find(c => c.id === intervention.customer_id);
            return {
                ...intervention,
                customer: customer ? {
                    id: customer.id,
                    company_name: customer.company_name,
                    industry: customer.industry,
                    health_score: customer.health_score,
                    churn_risk_level: customer.churn_risk_level
                } : null
            };
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedInterventions = interventionsWithCustomers.slice(startIndex, endIndex);
        res.json({
            interventions: paginatedInterventions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: interventions.length,
                totalPages: Math.ceil(interventions.length / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get interventions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', (req, res) => {
    try {
        const { customer_id, intervention_type, trigger_reason, assigned_to, notes } = req.body;
        if (!customer_id || !intervention_type || !trigger_reason) {
            return res.status(400).json({
                error: 'customer_id, intervention_type, and trigger_reason are required'
            });
        }
        const customer = database_1.database.customers.find(c => c.id === customer_id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const validTypes = ['call', 'email', 'meeting', 'training', 'discount', 'feature_demo'];
        if (!validTypes.includes(intervention_type)) {
            return res.status(400).json({
                error: 'Invalid intervention_type. Must be one of: ' + validTypes.join(', ')
            });
        }
        const newIntervention = {
            id: (0, uuid_1.v4)(),
            customer_id,
            intervention_type,
            trigger_reason,
            status: 'pending',
            assigned_to: assigned_to || req.user?.name || 'Unassigned',
            created_date: new Date(),
            notes: notes || ''
        };
        database_1.database.interventions.push(newIntervention);
        res.status(201).json({
            intervention: newIntervention,
            message: 'Intervention created successfully'
        });
    }
    catch (error) {
        console.error('Create intervention error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, outcome, notes, completed_date } = req.body;
        const intervention = database_1.database.interventions.find(i => i.id === id);
        if (!intervention) {
            return res.status(404).json({ error: 'Intervention not found' });
        }
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }
        const validOutcomes = ['successful', 'unsuccessful', 'partial'];
        if (outcome && !validOutcomes.includes(outcome)) {
            return res.status(400).json({
                error: 'Invalid outcome. Must be one of: ' + validOutcomes.join(', ')
            });
        }
        if (status)
            intervention.status = status;
        if (outcome)
            intervention.outcome = outcome;
        if (notes)
            intervention.notes = notes;
        if (completed_date)
            intervention.completed_date = new Date(completed_date);
        if (status === 'completed' && !intervention.completed_date) {
            intervention.completed_date = new Date();
        }
        res.json({
            intervention,
            message: 'Intervention updated successfully'
        });
    }
    catch (error) {
        console.error('Update intervention error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const intervention = database_1.database.interventions.find(i => i.id === id);
        if (!intervention) {
            return res.status(404).json({ error: 'Intervention not found' });
        }
        const customer = database_1.database.customers.find(c => c.id === intervention.customer_id);
        res.json({
            intervention,
            customer: customer ? {
                id: customer.id,
                company_name: customer.company_name,
                industry: customer.industry,
                mrr: customer.mrr,
                health_score: customer.health_score,
                churn_risk_level: customer.churn_risk_level,
                customer_success_manager: customer.customer_success_manager
            } : null
        });
    }
    catch (error) {
        console.error('Get intervention details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/alerts/recent', (req, res) => {
    try {
        const { limit = '20' } = req.query;
        const limitNum = parseInt(limit);
        const alerts = [];
        database_1.database.customers
            .filter(c => c.health_score < 30)
            .slice(0, 5)
            .forEach(customer => {
            alerts.push({
                id: (0, uuid_1.v4)(),
                type: 'health_score_drop',
                severity: customer.health_score < 20 ? 'critical' : 'high',
                title: `Health Score Critical: ${customer.company_name}`,
                message: `Health score dropped to ${customer.health_score}`,
                customer_id: customer.id,
                customer_name: customer.company_name,
                created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                read: Math.random() > 0.7
            });
        });
        database_1.database.churnPredictions
            .filter(p => p.churn_probability > 0.8)
            .slice(0, 3)
            .forEach(prediction => {
            const customer = database_1.database.customers.find(c => c.id === prediction.customer_id);
            if (customer) {
                alerts.push({
                    id: (0, uuid_1.v4)(),
                    type: 'high_churn_risk',
                    severity: 'critical',
                    title: `High Churn Risk: ${customer.company_name}`,
                    message: `${Math.round(prediction.churn_probability * 100)}% churn probability detected`,
                    customer_id: customer.id,
                    customer_name: customer.company_name,
                    created_at: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
                    read: Math.random() > 0.8
                });
            }
        });
        database_1.database.customers
            .filter(c => c.health_score < 40)
            .slice(0, 2)
            .forEach(customer => {
            alerts.push({
                id: (0, uuid_1.v4)(),
                type: 'payment_issue',
                severity: 'medium',
                title: `Payment Issue: ${customer.company_name}`,
                message: 'Payment failure detected, intervention recommended',
                customer_id: customer.id,
                customer_name: customer.company_name,
                created_at: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
                read: Math.random() > 0.6
            });
        });
        alerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const limitedAlerts = alerts.slice(0, limitNum);
        res.json({
            alerts: limitedAlerts,
            unread_count: limitedAlerts.filter(a => !a.read).length,
            total_count: alerts.length
        });
    }
    catch (error) {
        console.error('Get recent alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=interventions.js.map