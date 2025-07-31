import { Customer, UsageMetric, HealthScoreFactors } from '../types';
export declare function calculateHealthScore(metric: UsageMetric, customer: Customer): number;
export declare function calculateHealthScoreFactors(metric: UsageMetric, customer: Customer): HealthScoreFactors;
export declare function getHealthScoreBreakdown(customerId: string): HealthScoreFactors | null;
//# sourceMappingURL=healthScore.d.ts.map