import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building, Users, FileText, TrendingUp, Calendar, Star } from "lucide-react";

const ContractorPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch contractor data - using placeholder contractor ID 1 for demo
  const { data: contractor } = useQuery({
    queryKey: ['/api/contractors', 1],
    enabled: true
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: bidRequests } = useQuery({
    queryKey: ['/api/contractors/1/bid-requests'],
    enabled: true
  });

  // Mock performance data for charts
  const projectData = [
    { month: 'Jan', completed: 8, active: 12, revenue: 45000 },
    { month: 'Feb', completed: 12, active: 15, revenue: 62000 },
    { month: 'Mar', completed: 10, active: 18, revenue: 58000 },
    { month: 'Apr', completed: 15, active: 20, revenue: 75000 },
    { month: 'May', completed: 18, active: 16, revenue: 89000 },
    { month: 'Jun', completed: 22, active: 14, revenue: 95000 }
  ];

  const completedProjects = projects?.filter((p: any) => p.status === 'completed')?.length || 0;
  const activeProjects = projects?.filter((p: any) => p.status === 'in_progress')?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Contractor Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Welcome back, {contractor?.companyName || 'Contractor'}
              </p>
            </div>
            <Button onClick={() => navigate("/portals")} variant="outline">
              Back to Portals
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="leads">Lead Requests</TabsTrigger>
              <TabsTrigger value="profile">Company Profile</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+2</span> new this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+5</span> this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bidRequests?.filter((b: any) => b.status === 'pending')?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600">3</span> new today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contractor?.rating || '4.8'}</div>
                    <p className="text-xs text-muted-foreground">
                      Based on {contractor?.reviewCount || '156'} reviews
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>Your project completion and revenue over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#8884d8" />
                      <Bar dataKey="active" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Manage your current and recent projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects?.slice(0, 5).map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-gray-500">{project.description}</p>
                          <p className="text-sm">Budget: ${project.budget?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={project.status === 'in_progress' ? 'default' : 
                                         project.status === 'completed' ? 'success' : 'secondary'}>
                            {project.status?.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No projects found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lead Requests Tab */}
            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Requests</CardTitle>
                  <CardDescription>Review and respond to new business opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests?.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{request.customerName}</p>
                          <p className="text-sm text-gray-500">{request.customerEmail}</p>
                          <p className="text-sm">{request.serviceDescription}</p>
                          <p className="text-xs text-gray-400">
                            Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'default' : 
                                         request.status === 'responded' ? 'secondary' : 'success'}>
                            {request.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Respond
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Manage your company information and services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Name</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {contractor?.companyName || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">License Number</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {contractor?.licenseNumber || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {contractor?.phone || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        {contractor?.email || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Services</label>
                    <div className="flex flex-wrap gap-2">
                      {contractor?.services?.map((service: string, index: number) => (
                        <Badge key={index} variant="secondary">{service}</Badge>
                      )) || <p className="text-gray-500">No services listed</p>}
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

export default ContractorPortal;