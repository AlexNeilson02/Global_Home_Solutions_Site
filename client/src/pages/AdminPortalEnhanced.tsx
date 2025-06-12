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
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function AdminPortalEnhanced() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    profileUrl: '',
    password: '',
    confirmPassword: ''
  });

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

  const salespersons = Array.isArray(salespersonsData) ? salespersonsData.filter(s => s.isActive !== false) : [];

  // Edit salesperson mutation
  const editSalespersonMutation = useMutation({
    mutationFn: async (data: { id: number; fullName?: string; profileUrl?: string; password?: string }) => {
      const response = await fetch(`/api/admin/salespersons/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update salesperson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salespersons'] });
      setEditModalOpen(false);
      toast({
        title: "Success",
        description: "Salesperson updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update salesperson: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete salesperson mutation
  const deleteSalespersonMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/salespersons/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete salesperson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salespersons'] });
      setEditModalOpen(false);
      toast({
        title: "Success",
        description: "Salesperson archived successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to archive salesperson: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleViewDetails = (salesperson: any) => {
    setSelectedSalesperson(salesperson);
    setViewDetailsOpen(true);
  };

  const handleEdit = (salesperson: any) => {
    setSelectedSalesperson(salesperson);
    setEditFormData({
      fullName: salesperson.fullName || '',
      profileUrl: salesperson.profileUrl || '',
      password: '',
      confirmPassword: ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const updateData: any = {};
    if (editFormData.fullName !== selectedSalesperson?.fullName) {
      updateData.fullName = editFormData.fullName;
    }
    if (editFormData.profileUrl !== selectedSalesperson?.profileUrl) {
      updateData.profileUrl = editFormData.profileUrl;
    }
    if (editFormData.password) {
      updateData.password = editFormData.password;
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    editSalespersonMutation.mutate({
      id: selectedSalesperson.id,
      ...updateData
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to archive this salesperson? This action will move them to archive and they will be permanently deleted after 60 days.')) {
      deleteSalespersonMutation.mutate(selectedSalesperson.id);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Comprehensive management portal for sales representatives and contractors
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/portal-access')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Back to Portals
            </Button>
          </div>
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
                      <Button className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold">
                        <Plus className="h-4 w-4 mr-2 text-black" />
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
                        <div>
                          <label className="text-sm font-medium">Username</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="Enter username"
                            id="username"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Full Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="Enter full name"
                            id="fullName"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <input 
                              type="email" 
                              className="w-full p-3 border rounded-lg" 
                              placeholder="Enter email"
                              id="email"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Phone</label>
                            <input 
                              type="tel" 
                              className="w-full p-3 border rounded-lg" 
                              placeholder="Enter phone number"
                              id="phone"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Password</label>
                          <input 
                            type="password" 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="Enter password"
                            id="password"
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
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
                          <h4 className="font-semibold">{salesperson.fullName || 'No Name Provided'}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Profile: {salesperson.profileUrl}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-lg font-bold">{salesperson.totalLeads || 0}</div>
                              <div className="text-xs text-gray-500">Total Leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{salesperson.conversionRate && !isNaN(salesperson.conversionRate) ? ((salesperson.conversionRate) * 100).toFixed(1) : '0.0'}%</div>
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
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(salesperson)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(salesperson)}>
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
            <AnalyticsDashboard userRole="admin" />
          </TabsContent>
        </Tabs>

        {/* View Details Modal */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Sales Representative Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedSalesperson?.fullName || 'Sales Rep'}
              </DialogDescription>
            </DialogHeader>
            {selectedSalesperson && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-base">{selectedSalesperson.fullName || 'No name provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Profile URL</label>
                    <p className="text-base">{selectedSalesperson.profileUrl}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-base">{selectedSalesperson.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-base">{selectedSalesperson.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">NFC ID</label>
                    <p className="text-base">{selectedSalesperson.nfcId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge variant={selectedSalesperson.isActive ? "default" : "destructive"}>
                      {selectedSalesperson.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedSalesperson.totalLeads || 0}</div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSalesperson.conversionRate && !isNaN(selectedSalesperson.conversionRate) 
                        ? ((selectedSalesperson.conversionRate) * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${(selectedSalesperson.commissions || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Commissions</div>
                  </div>
                </div>
                {selectedSalesperson.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bio</label>
                    <p className="text-base">{selectedSalesperson.bio}</p>
                  </div>
                )}
                {selectedSalesperson.specialties && selectedSalesperson.specialties.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Specialties</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSalesperson.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Sales Representative</DialogTitle>
              <DialogDescription>
                Update information for {selectedSalesperson?.fullName || 'Sales Rep'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="w-full">
                <label className="text-sm font-medium block mb-1">Full Name</label>
                <Input
                  className="w-full"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div className="w-full">
                <label className="text-sm font-medium block mb-1">Profile URL</label>
                <Input
                  className="w-full"
                  value={editFormData.profileUrl}
                  onChange={(e) => setEditFormData({...editFormData, profileUrl: e.target.value})}
                  placeholder="Enter profile URL"
                />
              </div>
              <div className="w-full">
                <label className="text-sm font-medium block mb-1">New Password (leave empty to keep current)</label>
                <Input
                  className="w-full"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div className="w-full">
                <label className="text-sm font-medium block mb-1">Confirm New Password</label>
                <Input
                  className="w-full"
                  type="password"
                  value={editFormData.confirmPassword}
                  onChange={(e) => setEditFormData({...editFormData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-between gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteSalespersonMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Salesperson
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={editSalespersonMutation.isPending}
                    className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}