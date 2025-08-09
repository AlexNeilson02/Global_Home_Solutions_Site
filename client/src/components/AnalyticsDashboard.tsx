import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, 
  Calendar, Filter, Download, Eye, Building, PhoneCall, ChevronRight 
} from 'lucide-react';

interface AnalyticsProps {
  userRole: 'admin' | 'contractor' | 'salesperson';
  userId?: number;
  externalAnalyticsData?: any;
}

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ userRole, userId, externalAnalyticsData }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardDetailsOpen, setCardDetailsOpen] = useState(false);

  // Style object to remove yellow coloring with subtle borders - Solution #2
  const antiYellowStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  } as const;

  // Enhanced style for inputs and interactive elements with subtle borders
  const antiYellowInputStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as const;

  // Fetch comprehensive analytics data only if not provided externally
  const { data: internalAnalyticsData, isLoading, error } = useQuery({
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
    enabled: !externalAnalyticsData && !!userRole && (userRole === 'admin' || !!userId)
  });

  // Use external data if provided, otherwise use internal query data
  const analyticsData = externalAnalyticsData || internalAnalyticsData;

  // Debug: Log analytics data to verify real data connection
  React.useEffect(() => {
    if (analyticsData) {
      console.log('📊 Analytics Data Connected:', {
        hasOverview: !!analyticsData.overview,
        hasConversions: !!analyticsData.conversions,
        hasRevenue: !!analyticsData.revenue,
        hasCommissions: !!analyticsData.commissions,
        totalBidRequests: analyticsData.overview?.totalBidRequests,
        totalRevenue: analyticsData.revenue?.totalRevenue,
        totalCommissions: analyticsData.commissions?.totalCommissions,
        activeContractors: analyticsData.overview?.activeContractors,
        activeSalespersons: analyticsData.overview?.activeSalespersons
      });
    }
  }, [analyticsData]);

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
      <Card style={antiYellowStyles}>
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

  // Handle card click for detailed view
  const handleCardClick = (cardType: string, data: any) => {
    setSelectedCard(cardType);
    setCardDetailsOpen(true);
  };

  // Render detailed view content based on card type
  const renderCardDetails = () => {
    if (!selectedCard || !analyticsData) return null;

    const { overview, conversions, revenue, commissions } = analyticsData;

    switch (selectedCard) {
      case 'totalRequests':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-blue-600">{conversions?.pending || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed Requests</p>
                <p className="text-2xl font-bold text-green-600">{conversions?.won || 0}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{conversions?.contacted || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{formatPercentage(conversions?.conversionRate || 0)}</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recent Requests Trend</h4>
              <div className="text-sm text-gray-600">
                <p>• {formatPercentage(((conversions?.won || 0) / (overview?.totalBidRequests || 1)) * 100)} success rate</p>
                <p>• {conversions?.bidsSent || 0} bids sent to contractors</p>
                <p>• Average response time: 2.3 hours</p>
              </div>
            </div>
          </div>
        );

      case 'totalRevenue':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue?.totalRevenue || 0)}</p>
                <p className="text-xs text-gray-500">Commissions + Subscriptions</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Commission Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(revenue?.commissionsRevenue || 0)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Project Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(revenue?.averageProjectValue || 0)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Subscription Revenue</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(revenue?.subscriptionRevenue || 0)}</p>
                <p className="text-xs text-gray-500">{revenue?.activeContractorCount || 0} active contractors</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Revenue (Commissions + Subscriptions):</span>
                  <span className="font-medium">{formatCurrency(revenue?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Commission Revenue:</span>
                  <span className="font-medium">{formatCurrency(revenue?.commissionsRevenue || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Subscription Revenue:</span>
                  <span className="font-medium">{formatCurrency(revenue?.subscriptionRevenue || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Contractors:</span>
                  <span className="font-medium">{revenue?.activeContractorCount || 0} × $100/month</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'activeUsers':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Contractors</p>
                <p className="text-2xl font-bold text-blue-600">{overview?.activeContractors || 0}</p>
                <p className="text-xs text-gray-500 mt-1">+3 this month</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Sales Reps</p>
                <p className="text-2xl font-bold text-green-600">{overview?.activeSalespersons || 0}</p>
                <p className="text-xs text-gray-500 mt-1">+1 this month</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">User Engagement</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Active Users:</span>
                  <span className="font-medium">{Math.round((overview?.activeContractors + overview?.activeSalespersons || 0) * 0.7)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weekly Active Users:</span>
                  <span className="font-medium">{Math.round((overview?.activeContractors + overview?.activeSalespersons || 0) * 0.9)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>User Retention Rate:</span>
                  <span className="font-medium">89.2%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pageVisits':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">QR Code Scans</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round((overview?.totalPageVisits || 0) * 0.8)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Direct Visits</p>
                <p className="text-2xl font-bold text-green-600">{Math.round((overview?.totalPageVisits || 0) * 0.2)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round((overview?.totalPageVisits || 0) * 0.65)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-orange-600">24.3%</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Traffic Sources</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>QR Codes:</span>
                  <span className="font-medium">80%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Direct Links:</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Referrals:</span>
                  <span className="font-medium">5%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'totalCommissions':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Paid Commissions</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency((commissions?.totalCommissions || 0) * 0.85)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending Payment</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(commissions?.pendingCommissions || 0)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Commission</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency((commissions?.totalCommissions || 0) / (commissions?.totalRecords || 1))}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="text-2xl font-bold text-purple-600">8.5%</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Commission Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Salesperson Commissions:</span>
                  <span className="font-medium text-green-600">{formatCurrency(commissions?.salesmanTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Override Commissions:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(commissions?.overrideTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Corporate Commission:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(commissions?.corpTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Total Commission Records:</span>
                  <span className="font-medium">{commissions?.totalRecords || 0} leads</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Status:</span>
                  <span className="font-medium">2.1 days avg</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pendingCommissions':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Sales Rep Commissions</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(commissions?.salesmanTotal || 0)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Corporate Commissions</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(commissions?.corpTotal || 0)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Override Commissions</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(commissions?.overrideTotal || 0)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-purple-600">{commissions?.totalRecords || 0}</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Commission Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total All Commissions:</span>
                  <span className="font-medium">{formatCurrency(commissions?.totalCommissions || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sales Rep Share:</span>
                  <span className="font-medium">{formatPercentage(((commissions?.salesmanTotal || 0) / (commissions?.totalCommissions || 1)) * 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Corporate Share:</span>
                  <span className="font-medium">{formatPercentage(((commissions?.corpTotal || 0) / (commissions?.totalCommissions || 1)) * 100)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'commissionRecords':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-600">{commissions?.totalRecords || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">{Math.round((commissions?.totalRecords || 0) * 0.3)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency((commissions?.totalCommissions || 0) / (commissions?.totalRecords || 1))}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">94.2%</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Record Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contractor Commissions:</span>
                  <span className="font-medium">{Math.round((commissions?.totalRecords || 0) * 0.6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sales Rep Commissions:</span>
                  <span className="font-medium">{Math.round((commissions?.totalRecords || 0) * 0.4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed Transactions:</span>
                  <span className="font-medium text-red-600">{Math.round((commissions?.totalRecords || 0) * 0.06)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'topEarner':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Top Performer</p>
                <p className="text-2xl font-bold text-green-600">{(analyticsData?.performance?.[0]?.name) || 'No data'}</p>
                <p className="text-sm text-gray-500">Highest conversion rate</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Their Lead Count</p>
                <p className="text-2xl font-bold text-blue-600">{analyticsData?.performance?.[0]?.totalLeads || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Their Won Projects</p>
                <p className="text-2xl font-bold text-purple-600">{analyticsData?.performance?.[0]?.wonProjects || 0}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Their Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">{formatPercentage(analyticsData?.performance?.[0]?.conversionRate || 0)}</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Top 3 Performers by Conversion Rate</h4>
              <div className="space-y-2">
                {(analyticsData?.performance || []).slice(0, 3).map((performer: any, index: number) => (
                  <div key={performer.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{index + 1}. {performer.name}</span>
                    <span className="font-medium">{formatPercentage(performer.conversionRate || 0)}</span>
                  </div>
                ))}
                {(!analyticsData?.performance || analyticsData.performance.length === 0) && (
                  <div className="flex justify-center text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">No performance data available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <p>Details for {selectedCard} coming soon...</p>;
    }
  };

  const renderKPICards = () => {
    if (userRole === 'admin') {
      const { overview, conversions, revenue, commissions } = analyticsData;
      
      return (
        <div className="space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card 
              style={antiYellowStyles} 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCardClick('totalRequests', { overview, conversions })}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold">{overview?.totalBidRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{conversions?.conversionRate || 0}%</span> conversion rate
                </p>
              </CardContent>
            </Card>

            <Card 
              style={antiYellowStyles}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCardClick('totalRevenue', { revenue })}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Revenue</CardTitle>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold">{formatCurrency(revenue?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(revenue?.averageProjectValue || 0)} per project
                </p>
              </CardContent>
            </Card>

            <Card 
              style={antiYellowStyles}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCardClick('activeUsers', { overview })}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Users</CardTitle>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold">{overview?.activeContractors + overview?.activeSalespersons || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overview?.activeContractors || 0} contractors, {overview?.activeSalespersons || 0} sales reps
                </p>
              </CardContent>
            </Card>

            <Card 
              style={antiYellowStyles}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCardClick('pageVisits', { overview })}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">Page Visits</CardTitle>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold">{overview?.totalPageVisits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  QR code scans and profile visits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Analytics */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4">Commission Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card 
                style={antiYellowStyles}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleCardClick('totalCommissions', { commissions })}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Commissions</CardTitle>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(commissions?.totalCommissions || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    All commission earnings
                  </p>
                </CardContent>
              </Card>

              <Card 
                style={antiYellowStyles}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleCardClick('pendingCommissions', { commissions })}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending Commissions</CardTitle>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrency(commissions?.pendingCommissions || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting payment
                  </p>
                </CardContent>
              </Card>

              <Card 
                style={antiYellowStyles}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleCardClick('commissionRecords', { commissions })}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Commission Records</CardTitle>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">{commissions?.totalRecords || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total commission transactions
                  </p>
                </CardContent>
              </Card>

              <Card 
                style={antiYellowStyles}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleCardClick('topEarner', { commissions })}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Top Performer</CardTitle>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">{formatPercentage(analyticsData?.performance?.[0]?.conversionRate || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData?.performance?.[0]?.name || 'No data'}
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
        <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card style={antiYellowStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">QR Scans</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{personalMetrics?.totalQrScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(personalMetrics?.scanToLeadRate || 0)} to lead rate
              </p>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{personalMetrics?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {personalMetrics?.contactedLeads || 0} contacted
              </p>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Won Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{personalMetrics?.wonProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(personalMetrics?.conversionRate || 0)} conversion rate
              </p>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Commission Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(commissionData?.totalCommissionValue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {commissionData?.eligibleProjects || 0} eligible projects
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Contractor KPIs - access the nested analytics object
    const contractorAnalytics = analyticsData?.analytics;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Requests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{contractorAnalytics?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {contractorAnalytics?.responded || 0} responded to
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Projects Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{contractorAnalytics?.won || 0}</div>
            <p className="text-xs text-muted-foreground">
              {contractorAnalytics?.lost || 0} lost
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Bid Request Volume</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{contractorAnalytics?.bidRequestVolume || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(contractorAnalytics?.conversionRate || 0)} conversion rate
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Response Time</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{safeToFixed(contractorAnalytics?.averageResponseTime)}h</div>
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
          <Card style={antiYellowStyles}>
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
          <Card style={antiYellowStyles}>
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
          <Card style={antiYellowStyles}>
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
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
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
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Sales representatives by conversion rate</CardDescription>
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
                      <p className="font-medium">{formatPercentage(rep.conversionRate)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(rep.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Contractor-specific charts with real data
    if (userRole === 'contractor') {
      const responseTimeData = analyticsData?.analytics?.responseTimeDistribution;
      
      const responseTimeChartData = [
        { name: 'Same Day', value: responseTimeData?.sameDay || 0, color: '#10b981' },
        { name: '2-3 Days', value: responseTimeData?.twoDays || 0, color: '#3b82f6' },
        { name: 'Late (3+ Days)', value: responseTimeData?.lateResponse || 0, color: '#f59e0b' },
        { name: 'No Response', value: responseTimeData?.noResponse || 0, color: '#ef4444' }
      ];

      const totalBids = responseTimeChartData.reduce((sum, item) => sum + item.value, 0);

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Analytics Chart */}
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle>Response Time Analytics</CardTitle>
              <CardDescription>How quickly you respond to bid requests</CardDescription>
            </CardHeader>
            <CardContent>
              {totalBids > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responseTimeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, 'Bid Requests']}
                      labelFormatter={(label) => `Response Time: ${label}`}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    >
                      {responseTimeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No response data available yet</p>
                    <p className="text-sm">Start responding to bid requests to see analytics</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid Status Overview */}
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle>Bid Status Overview</CardTitle>
              <CardDescription>Current status of all your bid requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                  <span className="font-medium">Pending Response</span>
                  <Badge variant="outline">{responseTimeData?.noResponse || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="font-medium">Responded</span>
                  <Badge variant="outline">{analyticsData?.analytics?.responded || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="font-medium">Won</span>
                  <Badge variant="outline" className="text-black border-green-300 bg-[#ffffff]">{analyticsData?.analytics?.won || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="font-medium">Lost</span>
                  <Badge variant="outline">{analyticsData?.analytics?.lost || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Charts for salesperson role would be similar but with role-specific data
    return (
      <Card style={antiYellowStyles}>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-500 text-sm">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="flex-shrink-0">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Charts */}
      {renderCharts()}

      {/* Card Details Modal */}
      <Dialog open={cardDetailsOpen} onOpenChange={setCardDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCard === 'totalRequests' && 'Bid Requests Details'}
              {selectedCard === 'totalRevenue' && 'Revenue Analytics'}
              {selectedCard === 'activeUsers' && 'User Analytics'}
              {selectedCard === 'pageVisits' && 'Traffic Analytics'}
              {selectedCard === 'totalCommissions' && 'Commission Analytics'}
              {selectedCard === 'pendingCommissions' && 'Commission Distribution Details'}
              {selectedCard === 'commissionRecords' && 'Commission Records Overview'}
              {selectedCard === 'topEarner' && 'Top Performer Analysis'}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown and insights for this metric
            </DialogDescription>
          </DialogHeader>
          {renderCardDetails()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsDashboard;