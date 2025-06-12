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
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

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
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalLeads: number;
  conversionRate: number;
  averageCommission: number;
}

interface CommissionDashboardProps {
  salespersonId: number;
}

export function CommissionDashboard({ salespersonId }: CommissionDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Fetch commission summary
  const { data: summary, isLoading: summaryLoading } = useQuery<CommissionSummary>({
    queryKey: [`/api/commissions/salesperson/${salespersonId}/commissions`],
    enabled: !!salespersonId
  });

  // Fetch commission records
  const { data: recordsResponse, isLoading: recordsLoading } = useQuery({
    queryKey: [`/api/commissions/records?salespersonId=${salespersonId}`],
    enabled: !!salespersonId
  });
  
  const records = recordsResponse?.records || [];

  // Fetch commission rates
  const { data: ratesResponse } = useQuery({
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
        return 'bg-yellow-100 text-yellow-800';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary?.pendingCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Records</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalRecords || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total commission records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Commissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.paidCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Records */}
      <Tabs defaultValue="recent" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="recent">Recent Commissions</TabsTrigger>
            <TabsTrigger value="rates">Commission Rates</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
                    <span>Pick a date range</span>
                  )}
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
            
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                Your commission earnings from successful leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records && records.length > 0 ? (
                  records.map((record) => (
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
          <Card>
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
      </Tabs>
    </div>
  );
}