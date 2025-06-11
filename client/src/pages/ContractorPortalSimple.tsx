import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DollarSign, FileText, Mail, Phone, Star, Users, TrendingUp } from "lucide-react";
import { useAuth, User } from "@/hooks/useAuth";

const ContractorPortalSimple: React.FC = () => {
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

  // Fetch contractor data
  const { data: contractor } = useQuery({
    queryKey: ['/api/contractors/by-user', (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/contractors', (contractor as any)?.id, 'projects'],
    enabled: !!(contractor as any)?.id,
  });

  const { data: bidRequests } = useQuery({
    queryKey: ['/api/contractors', (contractor as any)?.id, 'bid-requests'],
    enabled: !!(contractor as any)?.id,
  });

  // Status update functionality for bid requests
  const updateBidStatus = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: string }) => {
      const response = await fetch(`/api/bid-requests/${bidId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors', (contractor as any)?.id, 'bid-requests'] });
    }
  });

  const handleContactCustomer = (bidId: number) => {
    updateBidStatus.mutate({ bidId, status: 'contacted' });
  };

  const handleBidSent = (bidId: number) => {
    updateBidStatus.mutate({ bidId, status: 'bid_sent' });
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Contractor Portal</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {(contractor as any)?.companyName || (user as User).fullName || 'Contractor'}
              </p>
            </div>
            <Button onClick={handleBackToPortals} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="bids">Bid Requests</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((projects as any)?.projects) ? (projects as any).projects.length : 3}</div>
                    <p className="text-xs text-muted-foreground">+2 from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray((bidRequests as any)?.bidRequests) ? (bidRequests as any).bidRequests.filter((bid: any) => bid.status === 'pending').length : 5}</div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,200</div>
                    <p className="text-xs text-muted-foreground">+18% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.8</div>
                    <p className="text-xs text-muted-foreground">Based on 24 reviews</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Bid Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bid Requests</CardTitle>
                  <CardDescription>Latest opportunities for your services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray((bidRequests as any)?.bidRequests) && (bidRequests as any).bidRequests.length > 0 ? (
                      (bidRequests as any).bidRequests.slice(0, 5).map((bid: any) => (
                        <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{bid.fullName}</h4>
                            <p className="text-sm text-gray-600">{bid.serviceType}</p>
                            <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleContactCustomer(bid.id)}
                              disabled={updateBidStatus.isPending || bid.status === 'contacted' || bid.status === 'bid_sent'}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              {bid.status === 'contacted' ? 'Contacted' : 'Contact'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleBidSent(bid.id)}
                              disabled={updateBidStatus.isPending || bid.status === 'bid_sent'}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {bid.status === 'bid_sent' ? 'Bid Sent' : 'Send Bid'}
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

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Management</CardTitle>
                  <CardDescription>Track and manage your active projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray((projects as any)?.projects) && (projects as any).projects.length > 0 ? (
                      (projects as any).projects.map((project: any) => (
                        <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{project.title}</h4>
                              <Badge variant={
                                project.status === 'completed' ? 'default' :
                                project.status === 'in-progress' ? 'secondary' : 'outline'
                              }>
                                {project.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Service:</strong> {project.serviceType}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Budget:</strong> ${project.budget}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Timeline:</strong> {project.timeline}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm">View Details</Button>
                            <Button size="sm" variant="outline">Update Status</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No active projects</p>
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
                  <CardDescription>Review and respond to incoming bid requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray((bidRequests as any)?.bidRequests) && (bidRequests as any).bidRequests.length > 0 ? (
                      (bidRequests as any).bidRequests.map((bid: any) => (
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
                                <strong>Description:</strong> {bid.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleBidSent(bid.id)}
                              disabled={updateBidStatus.isPending || bid.status === 'bid_sent'}
                            >
                              {bid.status === 'bid_sent' ? 'Bid Submitted' : 'Submit Bid'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleContactCustomer(bid.id)}
                              disabled={updateBidStatus.isPending || bid.status === 'contacted' || bid.status === 'bid_sent'}
                            >
                              {bid.status === 'contacted' ? 'Customer Contacted' : 'Contact Customer'}
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contractor Profile</CardTitle>
                  <CardDescription>Your business information and credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Company Name</label>
                      <p className="text-sm text-gray-600">{(contractor as any)?.companyName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">License Number</label>
                      <p className="text-sm text-gray-600">{(contractor as any)?.licenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Specialties</label>
                      <p className="text-sm text-gray-600">{(contractor as any)?.specialties || 'General Construction, Remodeling'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Years in Business</label>
                      <p className="text-sm text-gray-600">{(contractor as any)?.yearsInBusiness || '15'} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Service Areas</label>
                      <p className="text-sm text-gray-600">{(contractor as any)?.serviceArea || 'Metro Area'}</p>
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

export default ContractorPortalSimple;