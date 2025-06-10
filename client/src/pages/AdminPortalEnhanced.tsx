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

export default function AdminPortalEnhanced() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch analytics data
  const { data: analyticsData = {}, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch users data
  const { data: usersData = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch salespersons
  const { data: salespersonsData = [], isLoading: isLoadingSalespersons } = useQuery({
    queryKey: ['/api/salespersons'],
    queryFn: async () => {
      const response = await fetch('/api/salespersons');
      if (!response.ok) throw new Error('Failed to fetch salespersons');
      const data = await response.json();
      return data.salespersons || [];
    }
  });

  const salespersons = Array.isArray(salespersonsData) ? salespersonsData : [];

  // Fetch contractors
  const { data: contractorsData = [], isLoading: isLoadingContractors } = useQuery({
    queryKey: ['/api/contractors'],
    queryFn: async () => {
      const response = await fetch('/api/contractors');
      if (!response.ok) throw new Error('Failed to fetch contractors');
      const data = await response.json();
      return data.contractors || [];
    }
  });

  const contractors = Array.isArray(contractorsData) ? contractorsData : [];

  // Fetch projects
  const { data: projectsData = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data.projects || [];
    }
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Fetch bid requests
  const { data: bidRequestsData = [], isLoading: isLoadingBidRequests } = useQuery({
    queryKey: ['/api/bid-requests/recent'],
    queryFn: async () => {
      const response = await fetch('/api/bid-requests/recent');
      if (!response.ok) throw new Error('Failed to fetch bid requests');
      const data = await response.json();
      return data.bidRequests || [];
    }
  });

  const bidRequests = Array.isArray(bidRequestsData) ? bidRequestsData : [];

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User status updated successfully" });
    }
  });

  const updateBidRequestStatus = useMutation({
    mutationFn: async ({ bidRequestId, status }: { bidRequestId: number; status: string }) => {
      const response = await fetch(`/api/admin/bid-requests/${bidRequestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update bid request status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-requests/recent'] });
      toast({ title: "Success", description: "Bid request status updated successfully" });
    }
  });

  const deleteBidRequest = useMutation({
    mutationFn: async (bidRequestId: number) => {
      const response = await fetch(`/api/admin/bid-requests/${bidRequestId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete bid request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-requests/recent'] });
      toast({ title: "Success", description: "Bid request deleted successfully" });
    }
  });

  // Chart data
  const monthlyData = [
    { name: 'Jan', leads: 65, conversions: 45 },
    { name: 'Feb', leads: 78, conversions: 52 },
    { name: 'Mar', leads: 90, conversions: 61 },
    { name: 'Apr', leads: 81, conversions: 58 },
    { name: 'May', leads: 95, conversions: 67 },
    { name: 'Jun', leads: 102, conversions: 73 }
  ];

  const pieData = [
    { name: 'Active Sales Reps', value: salespersons?.filter((s: any) => s.isActive)?.length || 0, color: '#10b981' },
    { name: 'Inactive Sales Reps', value: salespersons?.filter((s: any) => !s.isActive)?.length || 0, color: '#ef4444' }
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  if (isLoadingAnalytics || isLoadingUsers || isLoadingSalespersons || isLoadingContractors) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalSalespersons: salespersons?.length || 0,
    activeSalespersons: salespersons?.filter((s: any) => s.isActive)?.length || 0,
    totalContractors: contractors?.length || 0,
    activeContractors: contractors?.filter((c: any) => c.isActive)?.length || 0,
    totalProjects: projects?.length || 0,
    totalBidRequests: bidRequests?.length || 0,
    pendingBidRequests: bidRequests?.filter((br: any) => br.status === 'pending')?.length || 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive management portal for sales representatives and contractors
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Sales Reps</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSalespersons}</p>
                  <p className="text-xs text-green-600">{stats.activeSalespersons} active</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Contractors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalContractors}</p>
                  <p className="text-xs text-green-600">{stats.activeContractors} verified</p>
                </div>
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                  <p className="text-xs text-blue-600">Active projects</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Bid Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBidRequests}</p>
                  <p className="text-xs text-orange-600">{stats.pendingBidRequests} pending</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="salespersons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="salespersons">Sales Representatives</TabsTrigger>
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="bid-requests">Bid Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Sales Representatives Tab */}
          <TabsContent value="salespersons">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Sales Representatives Management</CardTitle>
                    <CardDescription>Monitor sales performance and manage team members</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Salesperson
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold">Create New Salesperson</DialogTitle>
                        <DialogDescription className="text-base">
                          Add a new sales representative to the team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Username</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter username"
                              id="username"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter full name"
                              id="fullName"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <input 
                              type="email" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter email"
                              id="email"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Phone</label>
                            <input 
                              type="tel" 
                              className="w-full p-2 border rounded-md" 
                              placeholder="Enter phone number"
                              id="phone"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Password</label>
                          <input 
                            type="password" 
                            className="w-full p-2 border rounded-md" 
                            placeholder="Enter password"
                            id="password"
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full"
                          onClick={async () => {
                            const username = (document.getElementById('username') as HTMLInputElement)?.value;
                            const fullName = (document.getElementById('fullName') as HTMLInputElement)?.value;
                            const email = (document.getElementById('email') as HTMLInputElement)?.value;
                            const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
                            const password = (document.getElementById('password') as HTMLInputElement)?.value;
                            
                            if (!username || !fullName || !email || !password) {
                              alert('Please fill in all required fields');
                              return;
                            }
                            
                            try {
                              const response = await fetch('/api/auth/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  username,
                                  fullName,
                                  email,
                                  phone: phone || null,
                                  password,
                                  role: 'salesperson'
                                })
                              });
                              
                              if (response.ok) {
                                queryClient.invalidateQueries({ queryKey: ['/api/salespersons'] });
                                // Clear form
                                (document.getElementById('username') as HTMLInputElement).value = '';
                                (document.getElementById('fullName') as HTMLInputElement).value = '';
                                (document.getElementById('email') as HTMLInputElement).value = '';
                                (document.getElementById('phone') as HTMLInputElement).value = '';
                                (document.getElementById('password') as HTMLInputElement).value = '';
                                alert('Salesperson created successfully!');
                              } else {
                                const error = await response.text();
                                alert(`Error: ${error}`);
                              }
                            } catch (error) {
                              alert(`Error: ${error}`);
                            }
                          }}
                        >
                          Create Salesperson
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contractors Tab */}
          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <CardTitle>Contractors Management</CardTitle>
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
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-4 w-4 mr-1" />
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
          <TabsContent value="bid-requests">
            <Card>
              <CardHeader>
                <CardTitle>Bid Requests Management</CardTitle>
                <CardDescription>Monitor and manage incoming bid requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Salesperson</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bidRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.fullName}</p>
                            <p className="text-sm text-gray-500">{request.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{request.serviceRequested}</TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'pending' ? "outline" :
                            request.status === 'approved' ? "default" : "destructive"
                          }>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{request.salesperson?.fullName || 'Unassigned'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Select
                              value={request.status}
                              onValueChange={(value) => 
                                updateBidRequestStatus.mutate({ 
                                  bidRequestId: request.id, 
                                  status: value 
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBidRequest.mutate(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>Leads and conversions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                      <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Rep Status</CardTitle>
                  <CardDescription>Distribution of active vs inactive representatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}