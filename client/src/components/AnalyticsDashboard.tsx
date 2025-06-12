import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, 
  Calendar, Filter, Download, Eye, Building, PhoneCall 
} from 'lucide-react';

interface AnalyticsProps {
  userRole: 'admin' | 'contractor' | 'salesperson';
  userId?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ userRole, userId }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch comprehensive analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: [`/api/analytics/${userRole}/overview`, timeRange, userId],
    queryFn: () => {
      const endpoint = userRole === 'admin' 
        ? `/api/analytics/admin/overview?timeRange=${timeRange}`
        : userRole === 'salesperson'
        ? `/api/analytics/sales-rep/${userId}`
        : `/api/contractors/${userId}/analytics`;
      
      return fetch(endpoint, {
        credentials: 'include'
      }).then(res => res.json());
    },
    enabled: !!userRole && (userRole === 'admin' || !!userId)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
            <p className="text-gray-500">Unable to load analytics data at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use safe formatting utilities
  const formatCurrency = (amount: any) => {
    if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatPercentage = (value: any) => {
    if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
      return '0.0%';
    }
    return `${Number(value).toFixed(1)}%`;
  };

  const safeToFixed = (value: any, decimals: number = 1) => {
    if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
      return '0.' + '0'.repeat(decimals);
    }
    return Number(value).toFixed(decimals);
  };

  const renderKPICards = () => {
    if (userRole === 'admin') {
      const { overview, conversions, revenue, commissions } = analyticsData;
      
      return (
        <div className="space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalBidRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{conversions?.conversionRate || 0}%</span> conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenue?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(revenue?.averageProjectValue || 0)} per project
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.activeContractors + overview?.activeSalespersons || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overview?.activeContractors || 0} contractors, {overview?.activeSalespersons || 0} sales reps
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Visits</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalPageVisits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  QR code scans and profile visits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Analytics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Commission Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(commissions?.totalCommissions || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    All commission earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{formatCurrency(commissions?.pendingCommissions || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting payment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commission Records</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{commissions?.totalRecords || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total commission transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Earner</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(commissions?.topEarner?.earnings || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {commissions?.topEarner?.name || 'No data'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (userRole === 'salesperson') {
      const { personalMetrics, commissionData } = analyticsData;
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personalMetrics?.totalQrScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(personalMetrics?.scanToLeadRate || 0)} to lead rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personalMetrics?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {personalMetrics?.contactedLeads || 0} contacted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personalMetrics?.wonProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(personalMetrics?.conversionRate || 0)} conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionData?.totalCommissionValue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {commissionData?.eligibleProjects || 0} eligible projects
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Contractor KPIs
    const analytics = analyticsData;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.responded || 0} responded to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.won || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.lost || 0} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From won projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToFixed(analytics?.averageResponseTime)}h</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCharts = () => {
    if (userRole === 'admin') {
      const { trends, conversions, revenue, performance } = analyticsData;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Requests and conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="totalRequests" stroke="#3b82f6" name="Requests" />
                  <Line type="monotone" dataKey="won" stroke="#10b981" name="Won" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Service</CardTitle>
              <CardDescription>Revenue breakdown by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue?.revenueByService || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="font-medium">Pending</span>
                  <Badge variant="outline">{conversions?.pending || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <span className="font-medium">Contacted</span>
                  <Badge variant="outline">{conversions?.contacted || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                  <span className="font-medium">Bids Sent</span>
                  <Badge variant="outline">{conversions?.bidsSent || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="font-medium">Won</span>
                  <Badge variant="default">{conversions?.won || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Sales representatives by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(performance || []).slice(0, 5).map((rep: any, index: number) => (
                  <div key={rep.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{rep.name}</p>
                        <p className="text-sm text-gray-500">{rep.totalLeads} leads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(rep.revenue)}</p>
                      <p className="text-sm text-gray-500">{formatPercentage(rep.conversionRate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Charts for salesperson and contractor roles would be similar but with role-specific data
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Detailed Charts</h3>
            <p className="text-gray-500">Role-specific analytics charts coming soon</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-500">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Charts */}
      {renderCharts()}
    </div>
  );
};

export default AnalyticsDashboard;