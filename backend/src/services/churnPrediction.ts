import { Customer, UsageMetric, ChurnPrediction } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function calculateChurnProbability(customer: Customer, recentMetrics: UsageMetric[]): ChurnPrediction {
  if (recentMetrics.length === 0) {
    throw new Error('No usage metrics available for prediction');
  }

  const features = extractFeatures(customer, recentMetrics);
  
  const churnProbability = logisticRegression(features);
  
  const contributingFactors = calculateContributingFactors(features);
  
  const daysToChurn = estimateDaysToChurn(churnProbability, features);
  
  return {
    id: uuidv4(),
    customer_id: customer.id,
    prediction_date: new Date(),
    churn_probability: Math.max(0, Math.min(1, churnProbability)),
    days_to_churn_estimate: daysToChurn,
    confidence_score: calculateConfidenceScore(features),
    contributing_factors: contributingFactors,
    model_version: 'v2.1.0',
    created_at: new Date()
  };
}

interface MLFeatures {
  tenure_months: number;
  mrr: number;
  usage_trend: number;
  support_volume: number;
  payment_health: number;
  user_growth: number;
  feature_adoption: number;
  login_frequency: number;
}

function extractFeatures(customer: Customer, metrics: UsageMetric[]): MLFeatures {
  const latestMetric = metrics[0];
  const oldestMetric = metrics[metrics.length - 1];
  
  const tenureMs = Date.now() - customer.created_at.getTime();
  const tenureMonths = tenureMs / (1000 * 60 * 60 * 24 * 30);
  
  const usageTrend = metrics.length > 1 
    ? (latestMetric.daily_active_users - oldestMetric.daily_active_users) / oldestMetric.daily_active_users
    : 0;
  
  const avgSupportVolume = metrics.reduce((sum, m) => sum + m.support_tickets_opened, 0) / metrics.length;
  
  const currentPayments = metrics.filter(m => m.payment_status === 'current').length;
  const paymentHealth = currentPayments / metrics.length;
  
  const userGrowth = customer.active_users_last_30_days / customer.total_users;
  
  const avgFeatureUsage = metrics.reduce((sum, m) => sum + m.feature_usage_count, 0) / metrics.length;
  const featureAdoption = Math.min(1, avgFeatureUsage / 50); // Normalize to 50 features
  
  const avgLoginFreq = metrics.reduce((sum, m) => sum + m.login_frequency, 0) / metrics.length;
  
  return {
    tenure_months: tenureMonths,
    mrr: customer.mrr,
    usage_trend: usageTrend,
    support_volume: avgSupportVolume,
    payment_health: paymentHealth,
    user_growth: userGrowth,
    feature_adoption: featureAdoption,
    login_frequency: avgLoginFreq
  };
}

function logisticRegression(features: MLFeatures): number {
  const weights = {
    tenure_months: -0.02,    // Longer tenure = lower churn risk
    mrr: -0.00001,          // Higher MRR = lower churn risk
    usage_trend: -2.0,      // Positive usage trend = lower churn risk
    support_volume: 0.3,    // More support tickets = higher churn risk
    payment_health: -1.5,   // Better payment health = lower churn risk
    user_growth: -1.0,      // More user growth = lower churn risk
    feature_adoption: -1.2, // Better feature adoption = lower churn risk
    login_frequency: -0.1   // More logins = lower churn risk
  };
  
  const bias = 0.5; // Base churn probability
  
  let linearCombination = bias;
  linearCombination += weights.tenure_months * features.tenure_months;
  linearCombination += weights.mrr * features.mrr;
  linearCombination += weights.usage_trend * features.usage_trend;
  linearCombination += weights.support_volume * features.support_volume;
  linearCombination += weights.payment_health * features.payment_health;
  linearCombination += weights.user_growth * features.user_growth;
  linearCombination += weights.feature_adoption * features.feature_adoption;
  linearCombination += weights.login_frequency * features.login_frequency;
  
  return 1 / (1 + Math.exp(-linearCombination));
}

function calculateContributingFactors(features: MLFeatures): any {
  const factors: any = {};
  
  if (features.usage_trend < -0.2 || features.user_growth < 0.5) {
    factors.low_usage = Math.min(0.5, 0.2 + Math.abs(features.usage_trend) + (1 - features.user_growth) * 0.3);
  }
  
  if (features.support_volume > 1) {
    factors.support_issues = Math.min(0.4, features.support_volume * 0.2);
  }
  
  if (features.payment_health < 0.9) {
    factors.payment_delays = Math.min(0.4, (1 - features.payment_health) * 0.5);
  }
  
  if (features.feature_adoption < 0.5) {
    factors.feature_adoption = Math.min(0.3, (0.5 - features.feature_adoption) * 0.6);
  }
  
  if (features.login_frequency < 2) {
    factors.contract_engagement = Math.min(0.2, (2 - features.login_frequency) * 0.1);
  }
  
  return factors;
}

function estimateDaysToChurn(churnProbability: number, features: MLFeatures): number {
  let baseDays = 365 * (1 - churnProbability);
  
  if (features.usage_trend < -0.5) {
    baseDays *= 0.5; // Rapid decline = faster churn
  } else if (features.usage_trend > 0.2) {
    baseDays *= 1.5; // Growth = slower churn
  }
  
  if (features.support_volume > 2) {
    baseDays *= 0.7; // Many tickets = faster churn
  }
  
  return Math.max(7, Math.min(365, Math.round(baseDays)));
}

function calculateConfidenceScore(features: MLFeatures): number {
  let confidence = 0.7; // Base confidence
  
  confidence += Math.min(0.2, features.tenure_months * 0.01);
  
  if (Math.abs(features.usage_trend) > 0.3) {
    confidence += 0.1; // Clear trend
  }
  
  return Math.max(0.5, Math.min(1.0, confidence));
}
