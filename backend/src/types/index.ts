export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'executive' | 'csm' | 'readonly';
  name: string;
  created_at: Date;
}

export interface Customer {
  id: string;
  company_name: string;
  industry: string;
  mrr: number;
  contract_start_date: Date;
  contract_end_date: Date;
  customer_success_manager: string;
  health_score: number;
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical';
  total_users: number;
  active_users_last_30_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface UsageMetric {
  id: string;
  customer_id: string;
  date: Date;
  daily_active_users: number;
  feature_usage_count: number;
  session_duration_avg: number;
  api_calls_count: number;
  login_frequency: number;
  support_tickets_opened: number;
  payment_status: 'current' | 'overdue' | 'failed';
  created_at: Date;
}

export interface ChurnPrediction {
  id: string;
  customer_id: string;
  prediction_date: Date;
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
  created_at: Date;
}

export interface Intervention {
  id: string;
  customer_id: string;
  intervention_type: 'call' | 'email' | 'meeting' | 'training' | 'discount' | 'feature_demo';
  trigger_reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  created_date: Date;
  completed_date?: Date;
  outcome?: 'successful' | 'unsuccessful' | 'partial';
  notes?: string;
  success_probability?: number;
  estimated_time_hours?: number;
}

export interface Task {
  id: string;
  customer_id: string;
  assigned_to: string;
  title: string;
  description: string;
  task_type: 'executive_communication' | 'contract_management' | 'customer_training' | 'renewal_management' | 'expansion_management' | 'relationship_management' | 'success_story_development';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: Date;
  estimated_time_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface HealthScoreFactors {
  usage_frequency: number;
  feature_adoption: number;
  support_engagement: number;
  payment_history: number;
  contract_engagement: number;
}

export {};
