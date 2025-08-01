"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHealthScore = calculateHealthScore;
exports.calculateHealthScoreFactors = calculateHealthScoreFactors;
exports.getHealthScoreBreakdown = getHealthScoreBreakdown;
function calculateHealthScore(metric, customer) {
    const factors = calculateHealthScoreFactors(metric, customer);
    const score = (factors.usage_frequency * 0.30 +
        factors.feature_adoption * 0.25 +
        factors.support_engagement * 0.20 +
        factors.payment_history * 0.15 +
        factors.contract_engagement * 0.10) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
}
function calculateHealthScoreFactors(metric, customer) {
    const usageFrequency = Math.min(1, metric.daily_active_users / customer.total_users);
    const featureAdoption = Math.min(1, metric.feature_usage_count / 50); // Normalize to 50 features max
    const supportEngagement = Math.max(0, 1 - (metric.support_tickets_opened / 5)); // More tickets = lower score
    const paymentHistory = metric.payment_status === 'current' ? 1 :
        metric.payment_status === 'overdue' ? 0.5 : 0;
    const contractEngagement = Math.min(1, metric.login_frequency / 5); // Normalize to 5 logins per day max
    return {
        usage_frequency: usageFrequency,
        feature_adoption: featureAdoption,
        support_engagement: supportEngagement,
        payment_history: paymentHistory,
        contract_engagement: contractEngagement
    };
}
function getHealthScoreBreakdown(customerId) {
    return {
        usage_frequency: 0.75,
        feature_adoption: 0.60,
        support_engagement: 0.85,
        payment_history: 1.0,
        contract_engagement: 0.70
    };
}
//# sourceMappingURL=healthScore.js.map