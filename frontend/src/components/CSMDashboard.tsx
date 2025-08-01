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
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Target,
  Calendar,
} from 'lucide-react';

const CSMDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedCustomers, setAssignedCustomers] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
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
      const [customersRes, interventionsRes, metricsRes] = await Promise.all([
        apiService.getCustomers({ limit: 100 }),
        apiService.getInterventions({ assigned_to: user?.name || '', limit: 50 }),
        apiService.getDashboardOverview(),
      ]);

      const assigned = customersRes.customers?.filter((c: any) => 
        c.customer_success_manager === user?.name
      ) || [];
      
      setAssignedCustomers(assigned);
      setInterventions(interventionsRes.interventions || []);
      setMetrics(metricsRes);
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
        assigned_to: user?.name || '',
        notes: interventionForm.notes,
      });

      setInterventionForm({
        intervention_type: '',
        trigger_reason: '',
        notes: '',
      });
      setSelectedCustomer(null);
      loadCSMData(); // Refresh data
    } catch (error) {
      console.error('Failed to create intervention:', error);
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
  const totalARR = assignedCustomers.reduce((sum, c) => sum + (c.mrr * 12), 0);
  const avgHealthScore = assignedCustomers.length > 0 
    ? Math.round(assignedCustomers.reduce((sum, c) => sum + c.health_score, 0) / assignedCustomers.length)
    : 0;
  const activeInterventions = interventions.filter(i => i.status === 'in_progress').length;

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
            <div className="text-2xl font-bold">{assignedCustomers.length}</div>
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
              Avg health: {avgHealthScore}
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
              {interventions.length} total this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">
              Intervention success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">My Customers</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="tasks">Task Queue</TabsTrigger>
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
                    return (
                      <TableRow key={intervention.id}>
                        <TableCell className="font-medium">
                          {customer?.company_name || 'Unknown Customer'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {intervention.intervention_type.replace('_', ' ')}
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
                Recommended actions and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-red-900">
                        {customer.churn_risk_level === 'critical' ? 'URGENT: ' : 'HIGH PRIORITY: '}
                        {customer.company_name}
                      </p>
                      <p className="text-sm text-red-700">
                        Health score: {customer.health_score} - Immediate intervention required
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="destructive">
                        <Phone className="h-3 w-3 mr-1" />
                        Call Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
                
                {assignedCustomers
                  .filter(c => c.churn_risk_level === 'medium')
                  .slice(0, 3)
                  .map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-900">Check-in: {customer.company_name}</p>
                      <p className="text-sm text-yellow-700">
                        Health score: {customer.health_score} - Regular check-in recommended
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Send Email
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSMDashboard;
