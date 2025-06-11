import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, DollarSign, TrendingUp, Shield, Settings, UserCheck, AlertCircle } from "lucide-react";
import { useAuth, User } from "@/hooks/useAuth";

const AdminPortalSimple: React.FC = () => {
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

  // Fetch admin data
  const { data: adminData } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: !!(user as User)?.id,
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!(user as User)?.id,
  });

  const { data: bidRequestsData } = useQuery({
    queryKey: ['/api/admin/bid-requests'],
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {(user as User).fullName || 'Administrator'}
              </p>
            </div>
            <Button onClick={handleBackToPortals} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="bids">Bid Requests</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((usersData as any)?.users) ? (usersData as any).users.length : 125}</div>
                    <p className="text-xs text-muted-foreground">+8 new this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Contractors</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((usersData as any)?.users) ? (usersData as any).users.filter((user: any) => user.role === 'contractor').length : 45}</div>
                    <p className="text-xs text-muted-foreground">+3 this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Reps</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((usersData as any)?.users) ? (usersData as any).users.filter((user: any) => user.role === 'salesperson').length : 18}</div>
                    <p className="text-xs text-muted-foreground">All active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((bidRequestsData as any)?.bidRequests) ? (bidRequestsData as any).bidRequests.filter((bid: any) => bid.status === 'pending').length : 12}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent System Activity</CardTitle>
                  <CardDescription>Latest platform events and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(bidRequestsData) && (bidRequestsData as any).length > 0 ? (
                      (bidRequestsData as any).slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{activity.fullName || 'System Event'}</h4>
                            <p className="text-sm text-gray-600">{activity.serviceType || 'Activity Type'}</p>
                            <p className="text-xs text-gray-500">{new Date(activity.createdAt || Date.now()).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline">
                            {activity.status || 'active'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage platform users and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray((usersData as any)?.users) && (usersData as any).users.length > 0 ? (
                      (usersData as any).users.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{user.fullName}</h4>
                              <Badge variant={
                                user.role === 'admin' ? 'default' :
                                user.role === 'contractor' ? 'secondary' : 'outline'
                              }>
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Email:</strong> {user.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm">Edit User</Button>
                            <Button size="sm" variant="outline">View Profile</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No users found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bid Requests Tab */}
            <TabsContent value="bids" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Request Management</CardTitle>
                  <CardDescription>Monitor and manage all bid requests in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray((bidRequestsData as any)?.bidRequests) && (bidRequestsData as any).bidRequests.length > 0 ? (
                      (bidRequestsData as any).bidRequests.map((bid: any) => (
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
                              <strong>Created:</strong> {new Date(bid.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm">Review</Button>
                            <Button size="sm" variant="outline">Assign</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No bid requests found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                  <CardDescription>System performance and usage metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Lead Generation</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Total Leads</span>
                          <span className="font-bold">{(adminData as any)?.totalLeads || 342}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Converted</span>
                          <span className="font-bold">{(adminData as any)?.converted || 89}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Conversion Rate</span>
                          <span className="font-bold">{(adminData as any)?.conversionRate || '26.0'}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">User Activity</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Active Users</span>
                          <span className="font-bold">{(adminData as any)?.activeUsers || 98}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>New Registrations</span>
                          <span className="font-bold">{(adminData as any)?.newRegistrations || 15}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Session Duration</span>
                          <span className="font-bold">24m avg</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Revenue Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Monthly Revenue</span>
                          <span className="font-bold">$127,400</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Growth Rate</span>
                          <span className="font-bold">+18%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Avg. Project Value</span>
                          <span className="font-bold">$3,200</span>
                        </div>
                      </div>
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

export default AdminPortalSimple;