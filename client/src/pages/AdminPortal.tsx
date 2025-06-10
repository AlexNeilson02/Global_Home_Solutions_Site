import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Building, TrendingUp, Shield, Settings, AlertTriangle } from "lucide-react";

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch admin data
  const { data: salespersons } = useQuery({
    queryKey: ['/api/salespersons'],
    enabled: true
  });

  const { data: contractors } = useQuery({
    queryKey: ['/api/contractors'],
    enabled: true
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: bidRequests } = useQuery({
    queryKey: ['/api/bid-requests/recent'],
    enabled: true
  });

  // Extract arrays from API responses
  const salespersonsList = salespersons?.salespersons || [];
  const contractorsList = contractors?.contractors || [];
  const projectsList = projects?.projects || [];
  const bidRequestsList = bidRequests?.bidRequests || [];

  // Mock data for charts
  const systemMetrics = [
    { name: 'Total Users', value: salespersonsList.length + contractorsList.length },
    { name: 'Active Projects', value: projectsList.filter((p: any) => p.status === 'in_progress')?.length || 0 },
    { name: 'Pending Bids', value: bidRequestsList.filter((b: any) => b.status === 'pending')?.length || 0 },
    { name: 'Completed Projects', value: projectsList.filter((p: any) => p.status === 'completed')?.length || 0 }
  ];

  const userDistribution = [
    { name: 'Sales Team', value: salespersonsList.length, color: '#8884d8' },
    { name: 'Contractors', value: contractorsList.length, color: '#82ca9d' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                System overview and management dashboard
              </p>
            </div>
            <Button onClick={() => navigate("/portals")} variant="outline">
              Back to Portals
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="contractors">Contractors</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    <div className="text-2xl font-bold">{salespersonsList.length + contractorsList.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {salespersonsList.length} sales + {contractorsList.length} contractors
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectsList.filter((p: any) => p.status === 'in_progress')?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+3</span> new this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bidRequestsList.filter((b: any) => b.status === 'pending')?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Requiring attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <p className="text-xs text-muted-foreground">
                      All systems operational
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>Key platform metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={systemMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Platform user breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={userDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Team</CardTitle>
                  <CardDescription>Manage sales representatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salespersonsList.slice(0, 5).map((person: any) => (
                      <div key={person.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.email}</p>
                          <p className="text-sm">Total Leads: {person.totalLeads || 0}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Active
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No sales team members found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contractors Tab */}
            <TabsContent value="contractors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contractor Network</CardTitle>
                  <CardDescription>Manage contractor partnerships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contractorsList.slice(0, 5).map((contractor: any) => (
                      <div key={contractor.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{contractor.companyName}</p>
                          <p className="text-sm text-gray-500">{contractor.email}</p>
                          <p className="text-sm">License: {contractor.licenseNumber}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Verified
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No contractors found</p>
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
                  <CardDescription>Comprehensive system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{projectsList.length || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Projects</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{bidRequestsList.length || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Bid Requests</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {bidRequestsList.filter((b: any) => b.status === 'converted')?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Platform Settings</span>
                  </CardTitle>
                  <CardDescription>Configure global system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        Enabled for all users
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Retention</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        12 months
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Rate Limit</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        1000 requests/hour
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Backup Schedule</label>
                      <p className="text-sm text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        Daily at 2:00 AM
                      </p>
                    </div>
                  </div>
                  <Button className="mt-4">
                    Update Settings
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

export default AdminPortal;