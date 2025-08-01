import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Users,
  TrendingUp,
  Phone,
  Mail,
  MessageSquare,
  Target,
} from 'lucide-react';

const CSMDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedCustomers, setAssignedCustomers] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [csmMetrics, setCsmMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [interventionForm, setInterventionForm] = useState({
    intervention_type: '',
    trigger_reason: '',
    notes: '',
  });

  useEffect(() => {
    loadCSMData();
  }, []);

  const loadCSMData = async () => {
    try {
      setIsLoading(true);
      const [customersRes, interventionsRes, tasksRes, metricsRes] = await Promise.all([
        apiService.getCustomers({ limit: 100 }),
        apiService.getInterventions({ assigned_to: user?.name || 'Customer Success Manager', limit: 50 }),
        apiService.getTasks({ assigned_to: user?.name || 'Customer Success Manager', limit: 50 }),
        apiService.getCSMMetrics(user?.name || 'Customer Success Manager'),
      ]);

      const assigned = customersRes.customers?.filter((c: any) => 
        c.customer_success_manager === (user?.name || 'Customer Success Manager')
      ) || [];
      
      setAssignedCustomers(assigned);
      setInterventions(interventionsRes.interventions || []);
      setTasks(tasksRes.tasks || []);
      setCsmMetrics(metricsRes);
    } catch (error) {
      console.error('Failed to load CSM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!selectedCustomer || !interventionForm.intervention_type || !interventionForm.trigger_reason) {
      return;
    }

    try {
      await apiService.createIntervention({
        customer_id: selectedCustomer.id,
        intervention_type: interventionForm.intervention_type,
        trigger_reason: interventionForm.trigger_reason,
        assigned_to: user?.name || 'Customer Success Manager',
        notes: interventionForm.notes,
      });

      setInterventionForm({
        intervention_type: '',
        trigger_reason: '',
        notes: '',
      });
      setSelectedCustomer(null);
      loadCSMData();
    } catch (error) {
      console.error('Failed to create intervention:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      await apiService.updateTask(taskId, updates);
      loadCSMData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const atRiskCustomers = assignedCustomers.filter(c => 
    c.churn_risk_level === 'high' || c.churn_risk_level === 'critical'
  );
  const totalARR = csmMetrics?.total_arr_responsibility || assignedCustomers.reduce((sum, c) => sum + (c.mrr * 12), 0);
  const activeInterventions = csmMetrics?.active_interventions || interventions.filter(i => i.status === 'in_progress').length;
  const interventionSuccessRate = csmMetrics?.intervention_success_rate || 87;

  return (
    <div className="space-y-6">
      {/* CSM Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{csmMetrics?.customers_managed || assignedCustomers.length}</div>
            <p className="text-xs text-muted-foreground">
              {atRiskCustomers.length} at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio ARR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalARR)}</div>
            <p className="text-xs text-muted-foreground">
              At risk: {formatCurrency(csmMetrics?.at_risk_arr || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interventions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInterventions}</div>
            <p className="text-xs text-muted-foreground">
              {csmMetrics?.capacity_utilization || 85}% capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{interventionSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              Intervention success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">My Customers ({assignedCustomers.length})</TabsTrigger>
          <TabsTrigger value="interventions">Interventions ({activeInterventions})</TabsTrigger>
          <TabsTrigger value="tasks">Task Queue ({tasks.filter(t => t.status !== 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Customers</CardTitle>
              <CardDescription>
                Customers prioritized by risk level and intervention needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedCustomers
                    .sort((a, b) => {
                      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                      return (riskOrder[b.churn_risk_level as keyof typeof riskOrder] || 0) - 
                             (riskOrder[a.churn_risk_level as keyof typeof riskOrder] || 0);
                    })
                    .map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            customer.health_score >= 80 ? 'bg-green-500' :
                            customer.health_score >= 60 ? 'bg-yellow-500' :
                            customer.health_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span>{customer.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{customer.health_score}</span>
                          <Progress value={customer.health_score} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(customer.churn_risk_level)}>
                          {customer.churn_risk_level.charAt(0).toUpperCase() + customer.churn_risk_level.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.mrr)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(customer.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Intervention</DialogTitle>
                                <DialogDescription>
                                  Create a new intervention for {customer.company_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="intervention_type">Intervention Type</Label>
                                  <Select 
                                    value={interventionForm.intervention_type}
                                    onValueChange={(value) => setInterventionForm(prev => ({ ...prev, intervention_type: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select intervention type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="call">Phone Call</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="meeting">Meeting</SelectItem>
                                      <SelectItem value="training">Training Session</SelectItem>
                                      <SelectItem value="discount">Discount Offer</SelectItem>
                                      <SelectItem value="feature_demo">Feature Demo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="trigger_reason">Trigger Reason</Label>
                                  <Input
                                    id="trigger_reason"
                                    value={interventionForm.trigger_reason}
                                    onChange={(e) => setInterventionForm(prev => ({ ...prev, trigger_reason: e.target.value }))}
                                    placeholder="e.g., Health score drop, Low usage"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="notes">Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={interventionForm.notes}
                                    onChange={(e) => setInterventionForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes or context..."
                                  />
                                </div>
                                <Button onClick={handleCreateIntervention} className="w-full">
                                  Create Intervention
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Interventions</CardTitle>
              <CardDescription>
                Track and manage your customer interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interventions.slice(0, 10).map((intervention) => {
                    const customer = assignedCustomers.find(c => c.id === intervention.customer_id);
                    const successProbability = intervention.success_probability;
                    const estimatedHours = intervention.estimated_time_hours;
                    return (
                      <TableRow key={intervention.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{customer?.company_name || 'Unknown Customer'}</span>
                            {successProbability && (
                              <span className="text-xs text-muted-foreground">
                                {successProbability}% success probability
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          <div className="flex flex-col">
                            <span>{intervention.intervention_type.replace('_', ' ')}</span>
                            {estimatedHours && (
                              <span className="text-xs text-muted-foreground">
                                {estimatedHours}h/week
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(intervention.status)}>
                            {intervention.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(intervention.created_date)}
                        </TableCell>
                        <TableCell>
                          {intervention.outcome && (
                            <Badge variant={intervention.outcome === 'successful' ? 'default' : 'secondary'}>
                              {intervention.outcome}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
              <CardDescription>
                Prioritized tasks and follow-ups for your customer portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const priorityColors = {
                    critical: 'bg-red-50 border-red-200',
                    high: 'bg-yellow-50 border-yellow-200',
                    medium: 'bg-blue-50 border-blue-200',
                    low: 'bg-gray-50 border-gray-200'
                  };
                  
                  const priorityBadgeColors = {
                    critical: 'destructive',
                    high: 'secondary',
                    medium: 'outline',
                    low: 'outline'
                  };
                  
                  const isOverdue = new Date(task.due_date) < new Date();
                  const dueDate = new Date(task.due_date);
                  const isToday = dueDate.toDateString() === new Date().toDateString();
                  
                  let dueDateText = dueDate.toLocaleDateString();
                  if (isToday) {
                    dueDateText = `Today ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000) {
                    dueDateText = dueDate.toLocaleDateString([], { weekday: 'long' });
                  }
                  
                  return (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <Badge variant={priorityBadgeColors[task.priority as keyof typeof priorityBadgeColors] as any}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Due: {dueDateText} {isOverdue && <span className="text-red-600 font-medium">(Overdue)</span>}
                        </p>
                        <p className="text-sm text-gray-500">{task.customer_name} • {task.estimated_time_hours}h estimated</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTaskUpdate(task.id, { status: 'in_progress' })}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleTaskUpdate(task.id, { status: 'completed' })}
                          >
                            Complete
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <Badge variant="default">Completed</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No tasks assigned. All caught up!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSMDashboard;
