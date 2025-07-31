"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
exports.initializeDatabase = initializeDatabase;
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.database = {
    users: [],
    customers: [],
    usageMetrics: [],
    churnPredictions: [],
    interventions: []
};
function initializeDatabase() {
    console.log('🗄️ Initializing in-memory database...');
    createDemoUsers();
    createDemoCustomers();
    generateUsageMetrics();
    generateChurnPredictions();
    createSampleInterventions();
    console.log(`✅ Database initialized with ${exports.database.customers.length} customers`);
}
async function createDemoUsers() {
    const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
    const users = [
        {
            id: (0, uuid_1.v4)(),
            email: 'admin@churnguard.ai',
            password: hashedPassword,
            role: 'admin',
            name: 'Admin User',
            created_at: new Date()
        },
        {
            id: (0, uuid_1.v4)(),
            email: 'executive@churnguard.ai',
            password: hashedPassword,
            role: 'executive',
            name: 'Executive User',
            created_at: new Date()
        },
        {
            id: (0, uuid_1.v4)(),
            email: 'csm@churnguard.ai',
            password: hashedPassword,
            role: 'csm',
            name: 'Customer Success Manager',
            created_at: new Date()
        },
        {
            id: (0, uuid_1.v4)(),
            email: 'readonly@churnguard.ai',
            password: hashedPassword,
            role: 'readonly',
            name: 'Read Only User',
            created_at: new Date()
        }
    ];
    exports.database.users.push(...users);
}
function createDemoCustomers() {
    const industries = ['CPG', 'Retail', 'Food & Beverage', 'Consumer Electronics', 'Fashion', 'Health & Beauty'];
    const csms = ['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson'];
    const keyCustomers = [
        {
            company_name: 'BrandFlow Analytics',
            industry: 'CPG',
            mrr: 15000,
            health_score: 25,
            churn_risk_level: 'critical',
            total_users: 45,
            active_users_last_30_days: 12,
            customer_success_manager: 'Sarah Johnson'
        },
        {
            company_name: 'ShelfSync Pro',
            industry: 'Retail',
            mrr: 8500,
            health_score: 92,
            churn_risk_level: 'low',
            total_users: 28,
            active_users_last_30_days: 26,
            customer_success_manager: 'Mike Chen'
        },
        {
            company_name: 'PromoTracker Solutions',
            industry: 'CPG',
            mrr: 12000,
            health_score: 75,
            churn_risk_level: 'low',
            total_users: 35,
            active_users_last_30_days: 32,
            customer_success_manager: 'Emily Rodriguez'
        },
        {
            company_name: 'RetailEdge Systems',
            industry: 'Retail',
            mrr: 22000,
            health_score: 18,
            churn_risk_level: 'critical',
            total_users: 67,
            active_users_last_30_days: 8,
            customer_success_manager: 'David Kim'
        },
        {
            company_name: 'CategoryMaster',
            industry: 'CPG',
            mrr: 9500,
            health_score: 58,
            churn_risk_level: 'medium',
            total_users: 22,
            active_users_last_30_days: 18,
            customer_success_manager: 'Lisa Thompson'
        },
        {
            company_name: 'FieldForce Mobile',
            industry: 'Retail',
            mrr: 18500,
            health_score: 88,
            churn_risk_level: 'low',
            total_users: 156,
            active_users_last_30_days: 142,
            customer_success_manager: 'Sarah Johnson'
        },
        {
            company_name: 'PlanogramPro',
            industry: 'Retail',
            mrr: 14000,
            health_score: 67,
            churn_risk_level: 'medium',
            total_users: 43,
            active_users_last_30_days: 35,
            customer_success_manager: 'Mike Chen'
        },
        {
            company_name: 'TradeSpend Optimizer',
            industry: 'CPG',
            mrr: 25000,
            health_score: 72,
            churn_risk_level: 'medium',
            total_users: 89,
            active_users_last_30_days: 76,
            customer_success_manager: 'Emily Rodriguez'
        }
    ];
    keyCustomers.forEach(customerData => {
        const customer = {
            id: (0, uuid_1.v4)(),
            company_name: customerData.company_name,
            industry: customerData.industry,
            mrr: customerData.mrr,
            contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
            customer_success_manager: customerData.customer_success_manager,
            health_score: customerData.health_score,
            churn_risk_level: customerData.churn_risk_level,
            total_users: customerData.total_users,
            active_users_last_30_days: customerData.active_users_last_30_days,
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
        };
        exports.database.customers.push(customer);
    });
    for (let i = 0; i < 492; i++) {
        const healthScore = Math.random() * 100;
        let churnRiskLevel;
        if (healthScore >= 80)
            churnRiskLevel = 'low';
        else if (healthScore >= 50)
            churnRiskLevel = 'medium';
        else if (healthScore >= 20)
            churnRiskLevel = 'high';
        else
            churnRiskLevel = 'critical';
        const totalUsers = Math.floor(Math.random() * 200) + 10;
        const activeUsers = Math.floor(totalUsers * (healthScore / 100) * (0.5 + Math.random() * 0.5));
        const customer = {
            id: (0, uuid_1.v4)(),
            company_name: `${generateCompanyName()} ${generateCompanySuffix()}`,
            industry: industries[Math.floor(Math.random() * industries.length)],
            mrr: Math.floor(Math.random() * 50000) + 1000,
            contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
            customer_success_manager: csms[Math.floor(Math.random() * csms.length)],
            health_score: Math.round(healthScore),
            churn_risk_level: churnRiskLevel,
            total_users: totalUsers,
            active_users_last_30_days: activeUsers,
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
        };
        exports.database.customers.push(customer);
    }
}
function generateUsageMetrics() {
    exports.database.customers.forEach(customer => {
        for (let days = 365; days >= 0; days--) {
            const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const healthFactor = customer.health_score / 100;
            const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
            const metric = {
                id: (0, uuid_1.v4)(),
                customer_id: customer.id,
                date,
                daily_active_users: Math.floor(customer.active_users_last_30_days * healthFactor * randomFactor),
                feature_usage_count: Math.floor((10 + Math.random() * 50) * healthFactor * randomFactor),
                session_duration_avg: Math.floor((15 + Math.random() * 45) * healthFactor * randomFactor),
                api_calls_count: Math.floor((100 + Math.random() * 1000) * healthFactor * randomFactor),
                login_frequency: Math.floor((1 + Math.random() * 5) * healthFactor * randomFactor),
                support_tickets_opened: Math.floor(Math.random() * 3 * (1 - healthFactor)),
                payment_status: customer.health_score > 30 && Math.random() > 0.1 ? 'current' :
                    Math.random() > 0.5 ? 'overdue' : 'failed',
                created_at: date
            };
            exports.database.usageMetrics.push(metric);
        }
    });
}
function generateChurnPredictions() {
    exports.database.customers.forEach(customer => {
        const churnProbability = Math.max(0, Math.min(1, (100 - customer.health_score) / 100 + (Math.random() - 0.5) * 0.3));
        const prediction = {
            id: (0, uuid_1.v4)(),
            customer_id: customer.id,
            prediction_date: new Date(),
            churn_probability: churnProbability,
            days_to_churn_estimate: Math.floor(30 + (customer.health_score / 100) * 300),
            confidence_score: 0.7 + Math.random() * 0.3,
            contributing_factors: {
                low_usage: customer.health_score < 50 ? 0.3 + Math.random() * 0.4 : Math.random() * 0.2,
                support_issues: Math.random() * 0.3,
                payment_delays: customer.health_score < 40 ? Math.random() * 0.4 : Math.random() * 0.1,
                feature_adoption: customer.health_score < 60 ? 0.2 + Math.random() * 0.3 : Math.random() * 0.2,
                contract_engagement: Math.random() * 0.2
            },
            model_version: 'v2.1.0',
            created_at: new Date()
        };
        exports.database.churnPredictions.push(prediction);
    });
}
function createSampleInterventions() {
    const interventionTypes = ['call', 'email', 'meeting', 'training', 'discount', 'feature_demo'];
    const triggerReasons = [
        'Health score dropped below 30',
        'Usage declined 50% in last 30 days',
        'Multiple support tickets opened',
        'Payment failure detected',
        'Contract renewal approaching',
        'Low feature adoption'
    ];
    exports.database.customers
        .filter(c => c.churn_risk_level === 'critical' || c.churn_risk_level === 'high')
        .forEach(customer => {
        const intervention = {
            id: (0, uuid_1.v4)(),
            customer_id: customer.id,
            intervention_type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
            trigger_reason: triggerReasons[Math.floor(Math.random() * triggerReasons.length)],
            status: Math.random() > 0.3 ? 'completed' : 'in_progress',
            assigned_to: customer.customer_success_manager,
            created_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            completed_date: Math.random() > 0.3 ? new Date() : undefined,
            outcome: Math.random() > 0.3 ? (Math.random() > 0.7 ? 'successful' : 'partial') : undefined,
            notes: 'Automated intervention based on health score decline'
        };
        exports.database.interventions.push(intervention);
    });
}
function generateCompanyName() {
    const prefixes = ['Smart', 'Pro', 'Elite', 'Prime', 'Max', 'Ultra', 'Super', 'Mega', 'Advanced', 'Premium'];
    const roots = ['Brand', 'Retail', 'Store', 'Shop', 'Market', 'Trade', 'Sales', 'Commerce', 'Business', 'Enterprise'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${roots[Math.floor(Math.random() * roots.length)]}`;
}
function generateCompanySuffix() {
    const suffixes = ['Systems', 'Solutions', 'Technologies', 'Analytics', 'Platform', 'Hub', 'Pro', 'Suite', 'Tools', 'Software'];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
}
//# sourceMappingURL=database.js.map