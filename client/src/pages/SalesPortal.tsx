import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, DollarSign, Target, QrCode, Eye, ArrowUpRight } from "lucide-react";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const SalesPortal: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/portals');
    }
  });

  const handleBackToPortals = () => {
    logoutMutation.mutate();
  };

  // Fetch sales data - using placeholder salesperson ID 1 for demo
  const { data: salesperson } = useQuery({
    queryKey: ['/api/salespersons', 1],
    enabled: true
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/salespersons/1/analytics'],
    enabled: true
  });

  const { data: bidRequests } = useQuery({
    queryKey: ['/api/salespersons/1/bid-requests'],
    enabled: true
  });

  // Mock performance data for charts
  const performanceData = [
    { month: 'Jan', leads: 45, conversions: 12, revenue: 15600 },
    { month: 'Feb', leads: 52, conversions: 18, revenue: 23400 },
    { month: 'Mar', leads: 48, conversions: 15, revenue: 19500 },
    { month: 'Apr', leads: 61, conversions: 22, revenue: 28600 },
    { month: 'May', leads: 55, conversions: 19, revenue: 24700 },
    { month: 'Jun', leads: 67, conversions: 25, revenue: 32500 }
  ];

  const conversionRate = analytics && (analytics as any).totalVisits > 0 && !isNaN((analytics as any).conversions) ? ((analytics as any).conversions / (analytics as any).totalVisits * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 sm:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sales Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Welcome back, {salesperson?.name || 'Sales Representative'}
              </p>
            </div>
            <Button onClick={handleBackToPortals} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Desktop Navigation - Only visible on larger screens */}
            <div className="hidden sm:block">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="leads">Lead Management</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              portalType="sales"
            />

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics Cards - Mobile: 2 columns, Desktop: 4 columns */}
              <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.totalVisits || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+12.5%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.conversions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+8.2%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+2.1%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesperson?.totalLeads || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+15.3%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your sales performance over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="conversions" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="leads" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lead Management Tab */}
            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bid Requests</CardTitle>
                  <CardDescription>Manage your latest customer inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests?.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{request.customerName}</p>
                          <p className="text-sm text-gray-500">{request.customerEmail}</p>
                          <p className="text-sm">{request.serviceDescription}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'default' : 
                                         request.status === 'contacted' ? 'secondary' : 'success'}>
                            {request.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No bid requests found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Tools Tab */}
            <TabsContent value="qr-tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5" />
                    <span>QR Code Generator</span>
                  </CardTitle>
                  <CardDescription>Generate QR codes for easy customer access to your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Your Profile QR Code</p>
                      <p className="text-sm text-gray-500">
                        Landing page: {salesperson?.profileUrl ? `/salesperson/${salesperson.profileUrl}` : 'Not set'}
                      </p>
                    </div>
                    <Button>
                      Generate QR Code
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Profile URL</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.profileUrl || 'Not configured'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">NFC ID</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.nfcId || 'Not configured'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your sales profile and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.name || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.bio || 'No bio available'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.phone || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {salesperson?.email || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <Button className="mt-4">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SalesPortal;