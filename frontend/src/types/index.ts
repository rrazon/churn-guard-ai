export interface User {
  id: string;
  email: string;
  role: 'admin' | 'executive' | 'csm' | 'readonly';
  name: string;
}

export interface Customer {
  id: string;
  company_name: string;
  industry: string;
  mrr: number;
  contract_start_date: string;
  contract_end_date: string;
  customer_success_manager: string;
  health_score: number;
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical';
  total_users: number;
  active_users_last_30_days: number;
  created_at: string;
  updated_at: string;
}

export interface ChurnPrediction {
  id: string;
  customer_id: string;
  prediction_date: string;
  churn_probability: number;
  days_to_churn_estimate: number;
  confidence_score: number;
  contributing_factors: {
    low_usage?: number;
    support_issues?: number;
    payment_delays?: number;
    feature_adoption?: number;
    contract_engagement?: number;
  };
  model_version: string;
  created_at: string;
}

export interface Intervention {
  id: string;
  customer_id: string;
  intervention_type: 'call' | 'email' | 'meeting' | 'training' | 'discount' | 'feature_demo';
  trigger_reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  created_date: string;
  completed_date?: string;
  outcome?: 'successful' | 'unsuccessful' | 'partial';
  notes?: string;
}

export interface Alert {
  id: string;
  type: 'health_score_drop' | 'high_churn_risk' | 'payment_issue' | 'usage_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  customer_id: string;
  customer_name: string;
  created_at: string;
  read: boolean;
}

export interface DashboardMetrics {
  total_arr: number;
  total_customers: number;
  avg_health_score: number;
  churn_rate: number;
  revenue_at_risk: number;
  at_risk_customers: number;
  risk_level_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  intervention_success_rate: number;
  active_interventions: number;
}
