import React, { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';
import { Alert } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
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
  Bell,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Eye,
  X,
  Clock,
  TrendingDown,
  CreditCard,
  Users,
} from 'lucide-react';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadAlerts();

    const unsubscribe = wsService.subscribe('alerts', (message) => {
      if (message.type === 'new_alert') {
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: message.alert_type || 'general',
          severity: message.severity || 'medium',
          title: `Alert: ${message.company_name}`,
          message: message.message,
          customer_id: message.customer_id,
          customer_name: message.company_name,
          created_at: message.timestamp,
          read: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, severityFilter, typeFilter, showUnreadOnly]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const sampleAlerts: Alert[] = [
        {
          id: '1',
          type: 'high_churn_risk',
          severity: 'critical',
          title: 'Critical Churn Risk',
          message: 'BrandFlow Analytics has 87% churn probability',
          customer_id: 'customer-1',
          customer_name: 'BrandFlow Analytics',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          read: false,
        },
        {
          id: '2',
          type: 'health_score_drop',
          severity: 'high',
          title: 'Health Score Drop',
          message: 'RetailEdge Systems health score dropped to 18',
          customer_id: 'customer-2',
          customer_name: 'RetailEdge Systems',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          read: false,
        },
        {
          id: '3',
          type: 'payment_issue',
          severity: 'high',
          title: 'Payment Failed',
          message: 'Payment failure detected for CategoryMaster',
          customer_id: 'customer-3',
          customer_name: 'CategoryMaster',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          read: true,
        },
        {
          id: '4',
          type: 'usage_anomaly',
          severity: 'medium',
          title: 'Usage Anomaly',
          message: 'Unusual usage pattern detected for PlanogramPro',
          customer_id: 'customer-4',
          customer_name: 'PlanogramPro',
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          read: true,
        },
        {
          id: '5',
          type: 'health_score_drop',
          severity: 'medium',
          title: 'Health Score Decline',
          message: 'TradeSpend Optimizer showing declining engagement',
          customer_id: 'customer-5',
          customer_name: 'TradeSpend Optimizer',
          created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          read: false,
        },
      ];
      setAlerts(sampleAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (showUnreadOnly) {
      filtered = filtered.filter(alert => !alert.read);
    }

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    setFilteredAlerts(filtered);
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'health_score_drop':
        return <TrendingDown className="h-4 w-4" />;
      case 'payment_issue':
        return <CreditCard className="h-4 w-4" />;
      case 'usage_anomaly':
        return <Users className="h-4 w-4" />;
      case 'high_churn_risk':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const alertTypes = [...new Set(alerts.map(alert => alert.type))];

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Action needed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12m</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Center</CardTitle>
              <CardDescription>
                Monitor and manage customer health alerts and notifications
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button 
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {alertTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alerts Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
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
                  </TableRow>
                ))
              ) : (
                filteredAlerts.map((alert) => (
                  <TableRow 
                    key={alert.id} 
                    className={`${!alert.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alert.customer_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(alert.type)}
                        <span className="text-sm capitalize">
                          {alert.type.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeAgo(alert.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {!alert.read && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
