import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, FileText, BarChart3 } from "lucide-react";
import { useAuth, User } from "@/hooks/useAuth";

const AdminPortalSimple: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();

  const users = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as User)?.id,
  });

  const analytics = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: !!(user as User)?.id,
  });

  const bidRequests = useQuery({
    queryKey: ["/api/bid-requests/recent"],
    enabled: !!(user as User)?.id,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 portal-white-cards">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-gray-600">Welcome back, {(user as User).fullName}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bids">Bid Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(users.data?.users) ? users.data.users.length : 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contractors</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(users.data?.users) ? users.data.users.filter((u: any) => u.role === 'contractor').length : 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales Reps</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(users.data?.users) ? users.data.users.filter((u: any) => u.role === 'salesperson').length : 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(bidRequests.data?.bidRequests) ? bidRequests.data.bidRequests.length : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activity and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(bidRequests.data?.bidRequests) && bidRequests.data.bidRequests.length > 0 ? (
                    bidRequests.data.bidRequests.slice(0, 5).map((bid: any) => (
                      <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">New bid request from {bid.fullName}</h4>
                          <p className="text-sm text-gray-600">{bid.serviceType}</p>
                          <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={
                          bid.status === 'completed' ? 'default' :
                          bid.status === 'contacted' ? 'secondary' : 'outline'
                        }>
                          {bid.status}
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

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.data && users.data.length > 0 ? (
                    users.data.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{user.fullName}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            user.role === 'admin' ? 'default' :
                            user.role === 'contractor' ? 'secondary' : 'outline'
                          }>
                            {user.role}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
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
                <CardDescription>Monitor and manage all bid requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bidRequests.data && bidRequests.data.length > 0 ? (
                    bidRequests.data.map((bid: any) => (
                      <div key={bid.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{bid.fullName}</h3>
                            <p className="text-sm text-gray-600">{bid.email}</p>
                            <p className="text-sm text-gray-600">{bid.phone}</p>
                          </div>
                          <Badge variant={
                            bid.status === 'completed' ? 'default' :
                            bid.status === 'contacted' ? 'secondary' : 'outline'
                          }>
                            {bid.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2"><strong>Service:</strong> {bid.serviceType}</p>
                        <p className="text-sm mb-2"><strong>Address:</strong> {bid.address}</p>
                        {bid.description && (
                          <p className="text-sm mb-2"><strong>Description:</strong> {bid.description}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            Assign
                          </Button>
                          <Button size="sm" variant="outline">
                            Update Status
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-500">No bid requests available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Conversion Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Leads</span>
                        <span className="text-sm font-medium">{analytics.data?.totalLeads || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Converted</span>
                        <span className="text-sm font-medium">{analytics.data?.converted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversion Rate</span>
                        <span className="text-sm font-medium">
                          {analytics.data?.conversionRate ? `${analytics.data.conversionRate.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">User Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Users</span>
                        <span className="text-sm font-medium">{analytics.data?.activeUsers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">New Registrations</span>
                        <span className="text-sm font-medium">{analytics.data?.newRegistrations || 0}</span>
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
  );
};

export default AdminPortalSimple;