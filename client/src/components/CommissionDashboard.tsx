import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Download,
  Eye,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { StripeConnectSetup } from "./StripeConnectSetup";

interface CommissionRecord {
  id: number;
  salespersonId: number;
  bidRequestId: number;
  serviceCategory: string;
  salesmanAmount: number;
  overrideAmount: number;
  corporateAmount: number;
  originalAmount: number;
  status: 'pending' | 'paid' | 'processing';
  createdAt: string;
  paidAt?: string;
  bidRequest?: {
    fullName: string;
    serviceRequested: string;
    address: string;
  };
}

interface CommissionSummary {
  totalEarned: number;
  pendingCommissions: number;
  paidCommissions: number;
  unpaidCommissions: number;
  totalRecords: number;
  paidRecordsCount: number;
  pendingRecordsCount: number;
  unpaidRecordsCount: number;
  stripeAnalytics?: {
    totalPaidPayments: number;
    totalUnpaidPayments: number;
    totalPendingPayments: number;
    averagePaymentTimeInDays: number;
    successfulPaymentRate: string;
    paymentTrends: Array<{month: string, amount: number, count: number}>;
    lastPaymentDate: number | null;
    totalEarnedThisMonth: number;
  };
}

interface CommissionDashboardProps {
  salespersonId: number;
}

export function CommissionDashboard({ salespersonId }: CommissionDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

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

  // Fetch commission summary
  const { data: summary, isLoading: summaryLoading } = useQuery<CommissionSummary>({
    queryKey: [`/api/commissions/salesperson/${salespersonId}/commissions`],
    enabled: !!salespersonId
  });

  // Fetch commission records
  const { data: recordsResponse, isLoading: recordsLoading } = useQuery<{records: CommissionRecord[]}>({
    queryKey: [`/api/commissions/records?salespersonId=${salespersonId}`],
    enabled: !!salespersonId
  });
  
  const records = recordsResponse?.records || [];

  // Fetch commission rates
  const { data: ratesResponse } = useQuery<{rates: any[]}>({
    queryKey: ['/api/commissions/rates']
  });
  
  const rates = ratesResponse?.rates || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (summaryLoading || recordsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} style={antiYellowStyles} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalEarned || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time commission earnings
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.stripeAnalytics?.totalEarnedThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Stripe payments received
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary?.pendingCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.pendingRecordsCount || 0} payments awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card style={antiYellowStyles}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary?.stripeAnalytics?.successfulPaymentRate || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.paidRecordsCount || 0} of {summary?.totalRecords || 0} paid successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Cards */}
      {summary?.stripeAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={antiYellowStyles}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Paid</span>
                  <span className="font-medium">{summary.paidRecordsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">Pending</span>
                  <span className="font-medium">{summary.pendingRecordsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Unpaid</span>
                  <span className="font-medium">{summary.unpaidRecordsCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Payment Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.stripeAnalytics.averagePaymentTimeInDays} days
              </div>
              <p className="text-xs text-muted-foreground">
                From commission to payment
              </p>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">
                {summary.stripeAnalytics.lastPaymentDate 
                  ? format(new Date(summary.stripeAnalytics.lastPaymentDate), "MMM dd, yyyy")
                  : 'No payments yet'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent Stripe payment
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Records */}
      <Tabs defaultValue="recent" className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Commissions</TabsTrigger>
            <TabsTrigger value="rates">Commission Rates</TabsTrigger>
            <TabsTrigger value="payment-setup">
              <Wallet className="w-4 h-4 mr-2" />
              Payment Setup
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </span>
                  <span className="sm:hidden">Date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="recent" className="space-y-4">
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                Your commission earnings from successful leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records && records.length > 0 ? (
                  records.map((record: CommissionRecord) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{record.serviceCategory}</h4>
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusIcon(record.status)}
                            <span className="ml-1 capitalize">{record.status}</span>
                          </Badge>
                        </div>
                        
                        {record.bidRequest && (
                          <div className="text-sm text-muted-foreground">
                            <p>Customer: {record.bidRequest.fullName}</p>
                            <p>Service: {record.bidRequest.serviceRequested}</p>
                            <p>Location: {record.bidRequest.address}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(record.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(record.salesmanAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatCurrency(record.originalAmount)}
                        </div>
                        {record.paidAt && (
                          <div className="text-xs text-green-600">
                            Paid {format(new Date(record.paidAt), "MMM dd")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No commission records found</p>
                    <p className="text-sm">Start generating leads to earn commissions!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle>Commission Rate Structure</CardTitle>
              <CardDescription>
                Commission breakdown by service category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50%</div>
                    <div className="text-sm text-muted-foreground">Salesperson</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">10%</div>
                    <div className="text-sm text-muted-foreground">Override/Manager</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">40%</div>
                    <div className="text-sm text-muted-foreground">Corporate</div>
                  </div>
                </div>
                
                {Array.isArray(rates) && rates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium mb-3">Service Categories & Your Commission</h4>
                    {rates.map((rate: any) => {
                      const salesmanAmount = rate.salesmanCommission || 0;
                      const totalAmount = (rate.salesmanCommission || 0) + (rate.overrideCommission || 0) + (rate.corpCommission || 0);
                      return (
                        <div key={rate.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{rate.service}</span>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(salesmanAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              of {formatCurrency(totalAmount)} total
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Setup Tab */}
        <TabsContent value="payment-setup" className="space-y-4">
          <Card style={antiYellowStyles}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Commission Payment Setup
              </CardTitle>
              <CardDescription>
                Set up automatic commission payments with Stripe Connect. Get paid directly when contractors pay referral fees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StripeConnectSetup />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}