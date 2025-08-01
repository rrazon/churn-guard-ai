import { Customer, User, UsageMetric, ChurnPrediction, Intervention, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const database = {
  users: [] as User[],
  customers: [] as Customer[],
  usageMetrics: [] as UsageMetric[],
  churnPredictions: [] as ChurnPrediction[],
  interventions: [] as Intervention[],
  tasks: [] as Task[]
};

export function initializeDatabase() {
  console.log('🗄️ Initializing in-memory database...');
  
  createDemoUsers();
  createDemoCustomers();
  generateUsageMetrics();
  generateChurnPredictions();
  createSampleInterventions();
  createCSMTasks();
  
  console.log(`✅ Database initialized with ${database.customers.length} customers`);
}

async function createDemoUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users: User[] = [
    {
      id: uuidv4(),
      email: 'admin@teamcore.net',
      password: hashedPassword,
      role: 'admin',
      name: 'Admin User',
      created_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'executive@teamcore.net',
      password: hashedPassword,
      role: 'executive',
      name: 'Executive User',
      created_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'csm@teamcore.net',
      password: hashedPassword,
      role: 'csm',
      name: 'Customer Success Manager',
      created_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'readonly@teamcore.net',
      password: hashedPassword,
      role: 'readonly',
      name: 'Read Only User',
      created_at: new Date()
    }
  ];
  
  database.users.push(...users);
}

function createDemoCustomers() {
  const industries = ['CPG', 'Retail', 'Food & Beverage', 'Consumer Electronics', 'Fashion', 'Health & Beauty'];
  const csms = ['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson'];
  
  const keyCustomers: Partial<Customer>[] = [
    {
      company_name: 'BrandFlow Analytics',
      industry: 'CPG',
      mrr: 15000,
      health_score: 25,
      churn_risk_level: 'critical',
      total_users: 45,
      active_users_last_30_days: 12,
      customer_success_manager: 'Customer Success Manager'
    },
    {
      company_name: 'ShelfSync Pro',
      industry: 'Retail',
      mrr: 12000,
      health_score: 95,
      churn_risk_level: 'low',
      total_users: 28,
      active_users_last_30_days: 26,
      customer_success_manager: 'Customer Success Manager'
    },
    {
      company_name: 'PromoTracker Solutions',
      industry: 'CPG',
      mrr: 8500,
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
      health_score: 35,
      churn_risk_level: 'high',
      total_users: 67,
      active_users_last_30_days: 25,
      customer_success_manager: 'Customer Success Manager'
    },
    {
      company_name: 'CategoryMaster',
      industry: 'CPG',
      mrr: 9500,
      health_score: 58,
      churn_risk_level: 'medium',
      total_users: 22,
      active_users_last_30_days: 18,
      customer_success_manager: 'Customer Success Manager'
    },
    {
      company_name: 'FieldForce Mobile',
      industry: 'Retail',
      mrr: 18500,
      health_score: 88,
      churn_risk_level: 'low',
      total_users: 156,
      active_users_last_30_days: 142,
      customer_success_manager: 'Customer Success Manager'
    },
    {
      company_name: 'PlanogramPro',
      industry: 'Retail',
      mrr: 14000,
      health_score: 67,
      churn_risk_level: 'medium',
      total_users: 43,
      active_users_last_30_days: 35,
      customer_success_manager: 'Customer Success Manager'
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
    const customer: Customer = {
      id: uuidv4(),
      company_name: customerData.company_name!,
      industry: customerData.industry!,
      mrr: customerData.mrr!,
      contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      customer_success_manager: customerData.customer_success_manager!,
      health_score: customerData.health_score!,
      churn_risk_level: customerData.churn_risk_level!,
      total_users: customerData.total_users!,
      active_users_last_30_days: customerData.active_users_last_30_days!,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    };
    database.customers.push(customer);
  });

  const RISK_DISTRIBUTION = {
    low: { count: 292, healthRange: [70, 100] },
    medium: { count: 125, healthRange: [50, 69] },
    high: { count: 60, healthRange: [30, 49] },
    critical: { count: 15, healthRange: [0, 29] }
  };

  const riskLevels = [
    ...Array(RISK_DISTRIBUTION.low.count).fill('low'),
    ...Array(RISK_DISTRIBUTION.medium.count).fill('medium'),
    ...Array(RISK_DISTRIBUTION.high.count).fill('high'),
    ...Array(RISK_DISTRIBUTION.critical.count).fill('critical')
  ];

  for (let i = 0; i < 492; i++) {
    const riskLevel = riskLevels[i] as 'low' | 'medium' | 'high' | 'critical';
    const healthRange = RISK_DISTRIBUTION[riskLevel].healthRange;
    const healthScore = Math.floor(Math.random() * (healthRange[1] - healthRange[0] + 1)) + healthRange[0];

    const totalUsers = Math.floor(Math.random() * 200) + 10;
    const activeUsers = Math.floor(totalUsers * (healthScore / 100) * (0.5 + Math.random() * 0.5));

    const customer: Customer = {
      id: uuidv4(),
      company_name: `${generateCompanyName()} ${generateCompanySuffix()}`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      mrr: Math.floor(Math.random() * 50000) + 1000,
      contract_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      customer_success_manager: csms[Math.floor(Math.random() * csms.length)],
      health_score: healthScore,
      churn_risk_level: riskLevel,
      total_users: totalUsers,
      active_users_last_30_days: activeUsers,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    };
    
    database.customers.push(customer);
  }
}

function generateUsageMetrics() {
  database.customers.forEach(customer => {
    const isKeyCustomer = ['BrandFlow Analytics', 'ShelfSync Pro', 'PromoTracker Solutions', 'RetailEdge Systems'].includes(customer.company_name);
    
    for (let month = 0; month < 12; month++) {
      const date = new Date(2024, month, 15);
      let healthScore: number;
      
      if (isKeyCustomer) {
        healthScore = generateKeyCustomerHealthScore(customer.company_name, month);
      } else {
        healthScore = generateRegularCustomerHealthScore(customer.health_score, month);
      }
      
      const healthFactor = healthScore / 100;
      const seasonalFactor = getSeasonalFactor(month);
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const metric: UsageMetric = {
        id: uuidv4(),
        customer_id: customer.id,
        date,
        daily_active_users: Math.floor(customer.total_users * healthFactor * seasonalFactor * randomFactor),
        feature_usage_count: Math.floor((10 + Math.random() * 50) * healthFactor * seasonalFactor),
        session_duration_avg: Math.floor((15 + Math.random() * 45) * healthFactor),
        api_calls_count: Math.floor((100 + Math.random() * 1000) * healthFactor * seasonalFactor),
        login_frequency: Math.floor((1 + Math.random() * 5) * healthFactor),
        support_tickets_opened: Math.floor(Math.random() * 3 * (1 - healthFactor) + (healthFactor < 0.3 ? 2 : 0)),
        payment_status: healthScore > 30 && Math.random() > 0.1 ? 'current' : 
                       healthScore > 20 && Math.random() > 0.3 ? 'overdue' : 'failed',
        created_at: date
      };
      
      database.usageMetrics.push(metric);
    }
  });
}

function generateKeyCustomerHealthScore(companyName: string, month: number): number {
  switch (companyName) {
    case 'BrandFlow Analytics':
      if (month <= 2) return 85 - month * 2;
      if (month <= 6) return 80 - (month - 2) * 5;
      if (month === 7) return 35;
      return Math.max(25, 35 - (month - 7) * 2);
    
    case 'ShelfSync Pro':
      const baseScore = 90;
      const growth = month * 0.5;
      const seasonal = Math.sin(month * Math.PI / 6) * 3;
      return Math.min(100, baseScore + growth + seasonal);
    
    case 'PromoTracker Solutions':
      if (month <= 2) return 60 - month * 15;
      if (month <= 5) return 25 + (month - 2) * 12;
      return Math.min(85, 65 + (month - 5) * 3);
    
    case 'RetailEdge Systems':
      if (month <= 5) return 80 - month * 8;
      if (month <= 8) return 40 - (month - 5) * 2;
      return Math.max(30, 34 - (month - 8));
    
    default:
      return 50;
  }
}

function generateRegularCustomerHealthScore(currentScore: number, month: number): number {
  const trend = (Math.random() - 0.5) * 10;
  const seasonal = Math.sin(month * Math.PI / 6) * 5;
  const monthlyVariation = (Math.random() - 0.5) * 8;
  
  let score = currentScore + (trend * month / 12) + seasonal + monthlyVariation;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getSeasonalFactor(month: number): number {
  if (month === 5 || month === 6) return 0.85;
  if (month === 11) return 1.15;
  if (month === 0) return 0.9;
  return 1.0;
}

function generateChurnPredictions() {
  database.customers.forEach(customer => {
    for (let month = 0; month < 12; month++) {
      const predictionDate = new Date(2024, month, 20);
      const isKeyCustomer = ['BrandFlow Analytics', 'ShelfSync Pro', 'PromoTracker Solutions', 'RetailEdge Systems'].includes(customer.company_name);
      
      let churnProbability: number;
      let confidenceScore: number;
      
      if (isKeyCustomer) {
        const monthlyScore = generateKeyCustomerHealthScore(customer.company_name, month);
        churnProbability = Math.max(0, Math.min(1, (100 - monthlyScore) / 100));
        confidenceScore = 0.8 + Math.random() * 0.2;
        
        if (customer.company_name === 'BrandFlow Analytics' && month >= 7) {
          churnProbability = Math.min(0.87, 0.6 + (month - 7) * 0.05);
        }
      } else {
        const monthlyScore = generateRegularCustomerHealthScore(customer.health_score, month);
        churnProbability = Math.max(0, Math.min(1, (100 - monthlyScore) / 100 + (Math.random() - 0.5) * 0.2));
        confidenceScore = 0.7 + Math.random() * 0.3;
      }
      
      const prediction: ChurnPrediction = {
        id: uuidv4(),
        customer_id: customer.id,
        prediction_date: predictionDate,
        churn_probability: Math.round(churnProbability * 100) / 100,
        days_to_churn_estimate: Math.floor(30 + (customer.health_score / 100) * 300),
        confidence_score: Math.round(confidenceScore * 100) / 100,
        contributing_factors: {
          low_usage: churnProbability > 0.5 ? 0.3 + Math.random() * 0.4 : Math.random() * 0.2,
          support_issues: churnProbability > 0.6 ? 0.2 + Math.random() * 0.3 : Math.random() * 0.2,
          payment_delays: churnProbability > 0.7 ? 0.3 + Math.random() * 0.4 : Math.random() * 0.1,
          feature_adoption: churnProbability > 0.4 ? 0.2 + Math.random() * 0.3 : Math.random() * 0.2,
          contract_engagement: Math.random() * 0.2
        },
        model_version: 'v2.1.0',
        created_at: predictionDate
      };
      
      database.churnPredictions.push(prediction);
    }
  });
}

function createSampleInterventions() {
  const interventionTypes = ['call', 'email', 'meeting', 'training', 'discount', 'feature_demo'] as const;
  const triggerReasons = [
    'Health score dropped below 30',
    'Usage declined 50% in last 30 days',
    'Multiple support tickets opened',
    'Payment failure detected',
    'Contract renewal approaching',
    'Low feature adoption',
    'Champion departure detected',
    'Competitive threat identified',
    'Expansion opportunity',
    'Onboarding completion'
  ];

  database.customers.forEach(customer => {
    const isKeyCustomer = ['BrandFlow Analytics', 'ShelfSync Pro', 'PromoTracker Solutions', 'RetailEdge Systems'].includes(customer.company_name);
    
    if (isKeyCustomer) {
      createKeyCustomerInterventions(customer, interventionTypes, triggerReasons);
    } else if (customer.churn_risk_level === 'critical' || customer.churn_risk_level === 'high') {
      createRegularCustomerInterventions(customer, interventionTypes, triggerReasons);
    }
  });
}

function createKeyCustomerInterventions(customer: Customer, interventionTypes: readonly ('call' | 'email' | 'meeting' | 'training' | 'discount' | 'feature_demo')[], triggerReasons: string[]) {
  interface InterventionTemplate {
    month: number;
    type: 'call' | 'email' | 'meeting' | 'training' | 'discount' | 'feature_demo';
    reason: string;
    outcome?: 'successful' | 'unsuccessful' | 'partial';
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    success_probability?: number;
    estimated_time_hours?: number;
  }
  
  const interventions: InterventionTemplate[] = [];
  
  switch (customer.company_name) {
    case 'BrandFlow Analytics':
      interventions.push(
        { month: 3, type: 'call', reason: 'Usage declined 50% in last 30 days', outcome: 'partial' },
        { month: 7, type: 'meeting', reason: 'Champion departure detected', outcome: 'unsuccessful' },
        { month: 9, type: 'discount', reason: 'Payment failure detected', outcome: 'unsuccessful' },
        { month: 11, type: 'meeting', reason: 'Executive escalation required', status: 'in_progress', success_probability: 35, estimated_time_hours: 8 }
      );
      break;
    
    case 'ShelfSync Pro':
      interventions.push(
        { month: 2, type: 'feature_demo', reason: 'Expansion opportunity', outcome: 'successful' },
        { month: 6, type: 'training', reason: 'Expansion opportunity', outcome: 'successful' },
        { month: 10, type: 'meeting', reason: 'Expansion opportunity development', status: 'in_progress', success_probability: 90, estimated_time_hours: 3 }
      );
      break;
    
    case 'PromoTracker Solutions':
      interventions.push(
        { month: 1, type: 'training', reason: 'Low feature adoption', outcome: 'unsuccessful' },
        { month: 3, type: 'meeting', reason: 'Health score dropped below 30', outcome: 'successful' },
        { month: 4, type: 'feature_demo', reason: 'Onboarding completion', outcome: 'successful' },
        { month: 6, type: 'call', reason: 'Contract renewal approaching', outcome: 'successful' }
      );
      break;
    
    case 'RetailEdge Systems':
      interventions.push(
        { month: 4, type: 'call', reason: 'Competitive threat identified', outcome: 'partial' },
        { month: 7, type: 'discount', reason: 'Usage declined 50% in last 30 days', outcome: 'unsuccessful' },
        { month: 9, type: 'meeting', reason: 'Payment failure detected', outcome: 'partial' },
        { month: 11, type: 'meeting', reason: 'Payment recovery and value demonstration', status: 'in_progress', success_probability: 65, estimated_time_hours: 4 }
      );
      break;
    
    case 'CategoryMaster':
      interventions.push(
        { month: 11, type: 'training', reason: 'Feature adoption campaign', status: 'pending', success_probability: 80, estimated_time_hours: 3 }
      );
      break;
    
    case 'PlanogramPro':
      interventions.push(
        { month: 10, type: 'meeting', reason: 'Renewal preparation and negotiation', status: 'in_progress', success_probability: 75, estimated_time_hours: 2 }
      );
      break;
  }
  
  interventions.forEach(intv => {
    const createdDate = new Date(2024, intv.month, Math.floor(Math.random() * 28) + 1);
    const completedDate = intv.status !== 'in_progress' && intv.status !== 'pending' ? new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : undefined;
    
    const intervention: Intervention = {
      id: uuidv4(),
      customer_id: customer.id,
      intervention_type: intv.type,
      trigger_reason: intv.reason,
      status: intv.status || 'completed',
      assigned_to: customer.customer_success_manager,
      created_date: createdDate,
      completed_date: completedDate,
      outcome: intv.outcome,
      notes: `Strategic intervention for ${customer.company_name} - ${intv.reason}`,
      success_probability: intv.success_probability,
      estimated_time_hours: intv.estimated_time_hours
    };
    
    database.interventions.push(intervention);
  });
}

function createRegularCustomerInterventions(customer: Customer, interventionTypes: readonly ('call' | 'email' | 'meeting' | 'training' | 'discount' | 'feature_demo')[], triggerReasons: string[]) {
  const numInterventions = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numInterventions; i++) {
    const month = Math.floor(Math.random() * 12);
    const createdDate = new Date(2024, month, Math.floor(Math.random() * 28) + 1);
    const isCompleted = Math.random() > 0.2;
    const completedDate = isCompleted ? new Date(createdDate.getTime() + Math.random() * 21 * 24 * 60 * 60 * 1000) : undefined;
    
    const intervention: Intervention = {
      id: uuidv4(),
      customer_id: customer.id,
      intervention_type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
      trigger_reason: triggerReasons[Math.floor(Math.random() * triggerReasons.length)],
      status: isCompleted ? 'completed' : (Math.random() > 0.5 ? 'in_progress' : 'pending'),
      assigned_to: customer.customer_success_manager,
      created_date: createdDate,
      completed_date: completedDate,
      outcome: isCompleted ? (Math.random() > 0.6 ? 'successful' : Math.random() > 0.5 ? 'partial' : 'unsuccessful') : undefined,
      notes: 'Automated intervention based on risk indicators'
    };
    
    database.interventions.push(intervention);
  }
}

function generateCompanyName(): string {
  const prefixes = ['Smart', 'Pro', 'Elite', 'Prime', 'Max', 'Ultra', 'Super', 'Mega', 'Advanced', 'Premium'];
  const roots = ['Brand', 'Retail', 'Store', 'Shop', 'Market', 'Trade', 'Sales', 'Commerce', 'Business', 'Enterprise'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${roots[Math.floor(Math.random() * roots.length)]}`;
}

function generateCompanySuffix(): string {
  const suffixes = ['Systems', 'Solutions', 'Technologies', 'Analytics', 'Platform', 'Hub', 'Pro', 'Suite', 'Tools', 'Software'];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}

function createCSMTasks() {
  const csmCustomers = database.customers.filter(c => c.customer_success_manager === 'Customer Success Manager');
  
  const taskTemplates = [
    {
      customer_name: 'BrandFlow Analytics',
      title: 'Follow up on BrandFlow Analytics CEO response',
      description: 'Check if CEO has responded to executive escalation email and schedule follow-up call',
      task_type: 'executive_communication' as const,
      priority: 'critical' as const,
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000),
      estimated_time_hours: 0.5
    },
    {
      customer_name: 'RetailEdge Systems',
      title: 'Prepare RetailEdge Systems contract restructuring proposal',
      description: 'Create detailed contract restructuring proposal with payment plan options and ROI analysis',
      task_type: 'contract_management' as const,
      priority: 'high' as const,
      due_date: new Date(Date.now() + 4 * 60 * 60 * 1000),
      estimated_time_hours: 2
    },
    {
      customer_name: 'CategoryMaster',
      title: 'Schedule and conduct CategoryMaster feature training session',
      description: 'Set up personalized training session for advanced analytics features',
      task_type: 'customer_training' as const,
      priority: 'high' as const,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimated_time_hours: 1.5
    },
    {
      customer_name: 'PlanogramPro',
      title: 'Complete PlanogramPro renewal proposal presentation',
      description: 'Finalize renewal presentation with usage metrics and ROI calculations',
      task_type: 'renewal_management' as const,
      priority: 'high' as const,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimated_time_hours: 3
    },
    {
      customer_name: 'ShelfSync Pro',
      title: 'Review ShelfSync Pro pilot program results',
      description: 'Analyze pilot program metrics and prepare expansion proposal',
      task_type: 'expansion_management' as const,
      priority: 'medium' as const,
      due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      estimated_time_hours: 1
    },
    {
      customer_name: 'CategoryMaster',
      title: 'Quarterly business review prep for CategoryMaster',
      description: 'Prepare comprehensive QBR materials including health metrics and success stories',
      task_type: 'relationship_management' as const,
      priority: 'medium' as const,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimated_time_hours: 2
    },
    {
      customer_name: 'FieldForce Mobile',
      title: 'FieldForce Mobile case study interview scheduling',
      description: 'Schedule interviews with key stakeholders for success story development',
      task_type: 'success_story_development' as const,
      priority: 'low' as const,
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimated_time_hours: 0.75
    }
  ];
  
  taskTemplates.forEach(template => {
    const customer = csmCustomers.find(c => c.company_name === template.customer_name);
    if (customer) {
      const task: Task = {
        id: uuidv4(),
        customer_id: customer.id,
        assigned_to: 'Customer Success Manager',
        title: template.title,
        description: template.description,
        task_type: template.task_type,
        priority: template.priority,
        status: 'pending',
        due_date: template.due_date,
        estimated_time_hours: template.estimated_time_hours,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      database.tasks.push(task);
    }
  });
}
