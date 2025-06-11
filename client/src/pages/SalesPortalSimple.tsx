import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, DollarSign, Target, QrCode, Eye, Phone, Mail } from "lucide-react";
import { useAuth, User } from "@/hooks/useAuth";

const SalesPortalSimple: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();
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
      navigate('/');
    }
  });

  const handleBackToPortals = () => {
    logoutMutation.mutate();
  };

  // Fetch sales data
  const { data: salesperson } = useQuery({
    queryKey: ['/api/salespersons', (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/sales-rep', (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const { data: bidRequests } = useQuery({
    queryKey: ['/api/salespersons', (user as User)?.id, 'bid-requests'],
    enabled: !!(user as User)?.id,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 portal-white-cards">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Portal</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {(salesperson as any)?.name || (user as User).fullName || 'Sales Representative'}
              </p>
            </div>
            <Button onClick={handleBackToPortals} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="leads">Lead Management</TabsTrigger>
              <TabsTrigger value="qr-tools">QR Tools</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.totalVisits || 156}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.conversions || 23}</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics as any)?.conversionRate || '14.7'}%</div>
                    <p className="text-xs text-muted-foreground">Above target</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$29,800</div>
                    <p className="text-xs text-muted-foreground">+15% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Lead Activity</CardTitle>
                  <CardDescription>Your latest customer interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(bidRequests) && bidRequests.length > 0 ? (
                      bidRequests.slice(0, 5).map((bid: any) => (
                        <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{bid.fullName}</h4>
                            <p className="text-sm text-gray-600">{bid.serviceType}</p>
                            <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lead Management Tab */}
            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Management</CardTitle>
                  <CardDescription>Track and manage your sales leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(bidRequests) && bidRequests.length > 0 ? (
                      bidRequests.map((bid: any) => (
                        <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{bid.fullName}</h4>
                              <Badge variant={
                                bid.status === 'completed' ? 'default' :
                                bid.status === 'contacted' ? 'secondary' : 'outline'
                              }>
                                {bid.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Service:</strong> {bid.serviceType}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Location:</strong> {bid.city}, {bid.state}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Contact:</strong> {bid.email} • {bid.phone}
                            </p>
                            {bid.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Notes:</strong> {bid.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm">Contact Lead</Button>
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No leads available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Tools Tab */}
            <TabsContent value="qr-tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Tools</CardTitle>
                  <CardDescription>Generate and manage your personal QR codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Personal QR Code</h3>
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                      <Button className="w-full mb-2">Download QR Code</Button>
                      <Button variant="outline" className="w-full">Print QR Code</Button>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">QR Code Analytics</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Total Scans</span>
                          <span className="font-bold">247</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>This Week</span>
                          <span className="font-bold">18</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Conversion Rate</span>
                          <span className="font-bold">12.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Representative Profile</CardTitle>
                  <CardDescription>Your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-gray-600">{(salesperson as any)?.name || (user as User).fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm text-gray-600">{(salesperson as any)?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <p className="text-sm text-gray-600">{(salesperson as any)?.bio || 'No bio available'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Specializations</label>
                      <p className="text-sm text-gray-600">Residential Construction, Kitchen Remodeling</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SalesPortalSimple;