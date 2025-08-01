import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Customer } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Eye,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';

interface CustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onCustomerSelect }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [interventionForm, setInterventionForm] = useState({
    intervention_type: '',
    trigger_reason: '',
    notes: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    loadCustomers();
  }, [pagination.page, riskFilter, industryFilter]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, riskFilter, industryFilter]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (riskFilter !== 'all') {
        params.risk_level = riskFilter;
      }
      if (industryFilter !== 'all') {
        params.industry = industryFilter;
      }

      const response = await apiService.getCustomers(params);
      setCustomers(response.customers || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_success_manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const loadCustomerDetails = async (customer: Customer) => {
    try {
      const [detailsRes, healthHistoryRes, churnFactorsRes] = await Promise.all([
        apiService.getCustomer(customer.id),
        apiService.getCustomerHealthHistory(customer.id),
        apiService.getChurnFactors(customer.id).catch(() => null),
      ]);

      setCustomerDetails({
        ...detailsRes,
        healthHistory: healthHistoryRes.history || [],
        churnAnalysis: churnFactorsRes || null,
      });
    } catch (error) {
      console.error('Failed to load customer details:', error);
    }
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadCustomerDetails(customer);
    if (onCustomerSelect) {
      onCustomerSelect(customer);
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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

  const industries = [...new Set(customers.map(c => c.industry))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your customer portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>CSM</TableHead>
                <TableHead>Contract End</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          customer.health_score >= 80 ? 'bg-green-500' :
                          customer.health_score >= 60 ? 'bg-yellow-500' :
                          customer.health_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <span 
                          className="cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => handleCustomerClick(customer)}
                        >
                          {customer.company_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.industry}</TableCell>
                    <TableCell>{formatCurrency(customer.mrr)}</TableCell>
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
                    <TableCell className="text-sm">{customer.customer_success_manager}</TableCell>
                    <TableCell className="text-sm">{formatDate(customer.contract_end_date)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCustomerClick(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <span>{selectedCustomer?.company_name}</span>
                              <Badge variant={getRiskBadgeVariant(selectedCustomer?.churn_risk_level || 'low')}>
                                {(selectedCustomer?.churn_risk_level || 'low').charAt(0).toUpperCase() + (selectedCustomer?.churn_risk_level || 'low').slice(1)}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              Customer health analysis and intervention opportunities
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedCustomer && customerDetails && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="health">Health Analysis</TabsTrigger>
                                <TabsTrigger value="usage">Usage Trends</TabsTrigger>
                                <TabsTrigger value="interventions">Interventions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Customer Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">Industry:</span>
                                        <span className="text-sm">{selectedCustomer.industry}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">MRR:</span>
                                        <span className="text-sm">{formatCurrency(selectedCustomer.mrr)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">Total Users:</span>
                                        <span className="text-sm">{selectedCustomer.total_users}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">Active Users (30d):</span>
                                        <span className="text-sm">{selectedCustomer.active_users_last_30_days}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">Contract End:</span>
                                        <span className="text-sm">{formatDate(selectedCustomer.contract_end_date)}</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Health Score</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-center">
                                        <div className="text-4xl font-bold mb-2 text-center">
                                          <span className={getRiskColor(selectedCustomer.churn_risk_level)}>
                                            {selectedCustomer.health_score}
                                          </span>
                                        </div>
                                        <Progress value={selectedCustomer.health_score} className="mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                          {selectedCustomer.churn_risk_level === 'critical' && 'Immediate attention required'}
                                          {selectedCustomer.churn_risk_level === 'high' && 'High risk of churn'}
                                          {selectedCustomer.churn_risk_level === 'medium' && 'Monitor closely'}
                                          {selectedCustomer.churn_risk_level === 'low' && 'Healthy customer'}
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button size="sm">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Schedule Call
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Create Intervention
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Create Intervention</DialogTitle>
                                        <DialogDescription>
                                          Create a new intervention for {selectedCustomer?.company_name}
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
                              </TabsContent>
                              
                              <TabsContent value="health" className="space-y-4">
                                {customerDetails.churnAnalysis && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Churn Risk Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium">Churn Probability:</span>
                                          <span className="text-lg font-bold text-red-600">
                                            {(customerDetails.churnAnalysis.analysis.overall_risk * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="space-y-2">
                                          <h4 className="font-medium">Contributing Factors:</h4>
                                          {Object.entries(customerDetails.churnAnalysis.analysis.contributing_factors).map(([factor, weight]) => (
                                            <div key={factor} className="flex justify-between items-center">
                                              <span className="text-sm capitalize">{factor.replace('_', ' ')}:</span>
                                              <span className="text-sm font-medium">{((weight as number) * 100).toFixed(1)}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="usage" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Usage Metrics</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      Usage trend analysis would be displayed here with charts showing
                                      daily active users, feature adoption, and engagement metrics over time.
                                    </p>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                              <TabsContent value="interventions" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Intervention History</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      Past interventions and their outcomes would be displayed here.
                                    </p>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
