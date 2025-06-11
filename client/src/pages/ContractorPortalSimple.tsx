import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, FileText, Mail, Phone, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/hooks/useAuth";

const ContractorPortalSimple: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const roleData = useQuery({
    queryKey: ["/api/contractors", (user as User)?.id],
    enabled: !!(user as User)?.id,
  });

  const projects = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!(user as User)?.id,
  });

  const bidRequests = useQuery({
    queryKey: ["/api/contractors", (user as User)?.id, "bid-requests"],
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
              <h1 className="text-2xl font-bold text-gray-900">Contractor Portal</h1>
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
            <TabsTrigger value="bids">Bid Requests</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {projects.data?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {bidRequests.data?.filter((bid: any) => bid.status === 'pending').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Won Projects</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {bidRequests.data?.filter((bid: any) => bid.status === 'won').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bid Requests</CardTitle>
                <CardDescription>Latest opportunities for your services</CardDescription>
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
                          bid.status === 'won' ? 'default' :
                          bid.status === 'bid_sent' ? 'secondary' : 'outline'
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

          {/* Bid Requests Tab */}
          <TabsContent value="bids" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bid Requests</CardTitle>
                <CardDescription>Manage your bid opportunities</CardDescription>
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
                            bid.status === 'won' ? 'default' :
                            bid.status === 'bid_sent' ? 'secondary' : 'outline'
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
                            Contact
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Bid
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
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Your current and completed projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.data && projects.data.length > 0 ? (
                    projects.data.map((project: any) => (
                      <div key={project.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{project.title}</h3>
                            <p className="text-sm text-gray-600">{project.description}</p>
                          </div>
                          <Badge variant={
                            project.status === 'completed' ? 'default' :
                            project.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        {project.budget && (
                          <p className="text-sm mb-2"><strong>Budget:</strong> ${project.budget}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-500">No projects available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Your business information and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <p className="text-sm text-gray-600">
                    {roleData.data?.companyName || (user as User).fullName}
                  </p>
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
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-gray-600">{roleData.data.description || 'No description available'}</p>
                    </div>
                    {roleData.data.specialties && roleData.data.specialties.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Specialties</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {roleData.data.specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
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

export default ContractorPortalSimple;