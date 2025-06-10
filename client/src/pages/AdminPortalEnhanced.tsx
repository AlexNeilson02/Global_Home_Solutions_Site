import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Mail, 
  Phone, 
  Calendar,
  Settings,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Plus,
  Eye,
  BarChart3,
  Target,
  Star,
  MapPin,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminPortalEnhanced: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [bidFilter, setBidFilter] = useState("all");
  
  const { toast } = useToast();
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

  // Fetch all data
  const { data: salespersonsData } = useQuery({
    queryKey: ['/api/salespersons'],
    enabled: true
  });

  const { data: contractorsData } = useQuery({
    queryKey: ['/api/contractors'],
    enabled: true
  });

  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: bidRequestsData } = useQuery({
    queryKey: ['/api/bid-requests/recent'],
    enabled: true
  });

  // Extract data arrays
  const salespersons = salespersonsData?.salespersons || [];
  const contractors = contractorsData?.contractors || [];
  const projects = projectsData?.projects || [];
  const bidRequests = bidRequestsData?.bidRequests || [];

  // Update salesperson status mutation
  const updateSalespersonStatusMutation = useMutation({
    mutationFn: async ({ salespersonId, isActive }: { salespersonId: number; isActive: boolean }) => {
      const response = await fetch(`/api/salespersons/${salespersonId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update salesperson status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salespersons'] });
      toast({
        title: "Salesperson Updated",
        description: "User status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  // Update bid request status mutation
  const updateBidStatusMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: string }) => {
      const response = await fetch(`/api/bid-requests/${bidId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update bid status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-requests/recent'] });
      toast({
        title: "Bid Updated",
        description: "Bid request status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update bid status.",
        variant: "destructive",
      });
    },
  });

  // Delete bid request mutation
  const deleteBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await fetch(`/api/bid-requests/${bidId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete bid request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-requests/recent'] });
      toast({
        title: "Bid Deleted",
        description: "Bid request has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete bid request.",
        variant: "destructive",
      });
    },
  });

  // Calculate system metrics
  const totalContractors = contractors.length;
  const totalSalespersons = salespersons.length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const pendingBids = bidRequests.filter((b: any) => b.status === 'pending').length;
  const totalRevenue = projects
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  // Filter functions
  const filteredBids = bidRequests.filter((bid: any) => {
    if (bidFilter === "all") return true;
    return bid.status === bidFilter;
  });

  // Chart data - Focus on business metrics
  const teamGrowthData = [
    { month: 'Jan', contractors: 12, salespersons: 8, projects: 15 },
    { month: 'Feb', contractors: 15, salespersons: 10, projects: 22 },
    { month: 'Mar', contractors: 18, salespersons: 12, projects: 28 },
    { month: 'Apr', contractors: 22, salespersons: 15, projects: 35 },
    { month: 'May', contractors: 28, salespersons: 18, projects: 42 },
    { month: 'Jun', contractors: 32, salespersons: 22, projects: 48 }
  ];

  const teamDistribution = [
    { name: 'Contractors', value: contractors.length, color: '#3b82f6' },
    { name: 'Salespersons', value: salespersons.length, color: '#10b981' }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, projects: 8 },
    { month: 'Feb', revenue: 62000, projects: 12 },
    { month: 'Mar', revenue: 58000, projects: 10 },
    { month: 'Apr', revenue: 75000, projects: 15 },
    { month: 'May', revenue: 89000, projects: 18 },
    { month: 'Jun', revenue: 95000, projects: 22 }
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
            <Button onClick={() => logoutMutation.mutate()} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="contractors">Contractors</TabsTrigger>
              <TabsTrigger value="sales">Sales Team</TabsTrigger>
              <TabsTrigger value="bids">Bid Requests</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contractors</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalContractors}</div>
                    <p className="text-xs text-muted-foreground">Active contractors</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalSalespersons}</div>
                    <p className="text-xs text-muted-foreground">Active sales reps</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeProjects}</div>
                    <p className="text-xs text-muted-foreground">{completedProjects} completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingBids}</div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From completed projects</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Growth</CardTitle>
                    <CardDescription>Monthly growth in contractors and sales team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teamGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="contractors" fill="#3b82f6" name="Contractors" />
                        <Bar dataKey="salespersons" fill="#10b981" name="Salespersons" />
                        <Bar dataKey="projects" fill="#f59e0b" name="Projects" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Role Distribution</CardTitle>
                    <CardDescription>Breakdown of users by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={teamDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {teamDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent System Activity</CardTitle>
                  <CardDescription>Latest user registrations and project completions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{project.serviceType}</p>
                        </div>
                        <Badge variant={
                          project.status === 'completed' ? 'default' :
                          project.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Contractors Tab */}
            <TabsContent value="contractors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contractor Management</CardTitle>
                  <CardDescription>Manage contractor profiles and verification status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contractors.map((contractor: any) => (
                      <div key={contractor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{contractor.companyName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{contractor.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Rate: ${contractor.hourlyRate || 0}/hr</span>
                              <span>Specialties: {contractor.specialties?.length || 0}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={contractor.isVerified ? "default" : "outline"}>
                              {contractor.isVerified ? "Verified" : "Unverified"}
                            </Badge>
                            <Badge variant={contractor.isActive ? "default" : "destructive"}>
                              {contractor.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Team Tab */}
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Team Management</CardTitle>
                  <CardDescription>Monitor sales performance and manage team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salespersons.map((salesperson: any) => (
                      <div key={salesperson.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{salesperson.fullName || 'Sales Rep'}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Profile: {salesperson.profileUrl}
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div className="text-center">
                                <div className="text-lg font-bold">{salesperson.totalLeads || 0}</div>
                                <div className="text-xs text-gray-500">Total Leads</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold">{((salesperson.conversionRate || 0) * 100).toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">Conversion Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold">${(salesperson.commissions || 0).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Commissions</div>
                              </div>
                            </div>
                          </div>
                          <Badge variant={salesperson.isActive ? "default" : "destructive"}>
                            {salesperson.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Analytics
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bid Requests Tab */}
            <TabsContent value="bids" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Bid Request Management</CardTitle>
                    <CardDescription>Monitor and manage all bid requests in the system</CardDescription>
                  </div>
                  <Select value={bidFilter} onValueChange={setBidFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bids</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredBids.map((bid: any) => (
                      <div key={bid.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{bid.fullName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{bid.serviceRequested}</p>
                            <p className="text-xs text-gray-500 mt-1">{bid.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{bid.phone}</span>
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{bid.email}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{bid.address}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{new Date(bid.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant={
                              bid.status === 'completed' ? 'default' :
                              bid.status === 'contacted' ? 'secondary' : 'outline'
                            }>
                              {bid.status}
                            </Badge>
                            {bid.budget && (
                              <Badge variant="outline">
                                {bid.budget}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Select
                            value={bid.status}
                            onValueChange={(status) => updateBidStatusMutation.mutate({
                              bidId: bid.id,
                              status
                            })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBidMutation.mutate(bid.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly revenue and project completion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* System Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Key performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">User Activation Rate</span>
                        <span className="text-sm">{((activeUsers / totalUsers) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(activeUsers / totalUsers) * 100} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Project Completion Rate</span>
                        <span className="text-sm">{((completedProjects / totalProjects) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(completedProjects / totalProjects) * 100} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Contractor Utilization</span>
                        <span className="text-sm">{((activeProjects / contractors.length)).toFixed(1)} avg projects</span>
                      </div>
                      <Progress value={Math.min((activeProjects / contractors.length) * 20, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics Overview</CardTitle>
                  <CardDescription>Comprehensive system metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{bidRequests.length}</div>
                      <div className="text-sm text-gray-500">Total Bid Requests</div>
                      <div className="text-xs text-green-600 mt-1">
                        +{bidRequests.filter((b: any) => new Date(b.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} this month
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">4.8</div>
                      <div className="text-sm text-gray-500">Average Rating</div>
                      <div className="text-xs text-gray-400 mt-1">Based on testimonials</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{Math.round((completedProjects / totalProjects) * 100)}%</div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-xs text-green-600 mt-1">+5% from last month</div>
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

export default AdminPortalEnhanced;