import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QrCode, Users, TrendingUp, Target, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/hooks/useAuth";

const SalesPortalSimple: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const roleData = useQuery({
    queryKey: ["/api/salespersons", (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const analytics = useQuery({
    queryKey: ["/api/analytics/sales-rep", (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const bidRequests = useQuery({
    queryKey: ["/api/salespersons", (user as User)?.id, "bid-requests"],
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
              <h1 className="text-2xl font-bold text-gray-900">Sales Portal</h1>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.data?.totalVisits || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.data?.conversions || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.data?.conversionRate ? `${analytics.data.conversionRate.toFixed(1)}%` : '0%'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">QR Code</CardTitle>
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    View QR Code
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bid Requests</CardTitle>
                <CardDescription>Latest leads from your sales activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bidRequests.data && bidRequests.data.length > 0 ? (
                    bidRequests.data.slice(0, 5).map((bid: any) => (
                      <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{bid.fullName}</h4>
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
                    <p className="text-center py-8 text-gray-500">No recent bid requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>Manage your sales leads and follow up activities</CardDescription>
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
                    <p className="text-center py-8 text-gray-500">No leads available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-sm text-gray-600">{(user as User).fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{(user as User).email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-gray-600">{(user as User).role}</p>
                </div>
                {roleData.data && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm text-gray-600">{roleData.data.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <p className="text-sm text-gray-600">{roleData.data.bio || 'No bio available'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesPortalSimple;