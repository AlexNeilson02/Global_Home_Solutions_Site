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
  const [activeTab, setActiveTab] = useState("salespersons");

  // Style object to remove yellow coloring with subtle borders
  const antiYellowStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  } as const;

  // Enhanced style for inputs and interactive elements
  const antiYellowInputStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '2px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as const;

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

  const handleBackToPortals = () => {
    logoutMutation.mutate();
  };
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    profileUrl: '',
    password: '',
    confirmPassword: ''
  });

  // Contractor management state
  const [contractorViewOpen, setContractorViewOpen] = useState(false);
  const [contractorEditOpen, setContractorEditOpen] = useState(false);
  const [contractorAddOpen, setContractorAddOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [contractorEditData, setContractorEditData] = useState({
    companyName: '',
    description: '',
    hourlyRate: '',
    specialties: [] as string[],
    serviceAreas: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [contractorAddData, setContractorAddData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    description: '',
    hourlyRate: '',
    specialties: [] as string[],
    serviceAreas: ''
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

  // Contractors are already fetched below, using the existing data

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

  // Contractor edit mutation
  const editContractorMutation = useMutation({
    mutationFn: async (data: { id: number; companyName?: string; description?: string; hourlyRate?: string; specialties?: string[]; serviceAreas?: string; fullName?: string; email?: string; phone?: string; password?: string }) => {
      const response = await fetch(`/api/admin/contractors/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      setContractorEditOpen(false);
      toast({
        title: "Success",
        description: "Contractor updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update contractor: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Contractor delete/archive mutation
  const deleteContractorMutation = useMutation({
    mutationFn: async (contractorId: number) => {
      const response = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to archive contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      setContractorViewOpen(false);
      toast({
        title: "Success",
        description: "Contractor archived successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to archive contractor: ${error.message}`,
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

  // Contractor handlers
  const handleContractorView = (contractor: any) => {
    setSelectedContractor(contractor);
    setContractorViewOpen(true);
  };

  const handleContractorEdit = (contractor: any) => {
    setSelectedContractor(contractor);
    setContractorEditData({
      companyName: contractor.companyName || '',
      description: contractor.description || '',
      hourlyRate: contractor.hourlyRate?.toString() || '',
      specialties: contractor.specialties || [],
      serviceAreas: contractor.serviceAreas?.join(', ') || '',
      fullName: contractor.fullName || '',
      email: contractor.email || '',
      phone: contractor.phone || '',
      password: '',
      confirmPassword: ''
    });
    setContractorEditOpen(true);
  };

  const handleContractorEditSubmit = () => {
    if (contractorEditData.password && contractorEditData.password !== contractorEditData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const updateData: any = {};
    if (contractorEditData.companyName !== selectedContractor?.companyName) {
      updateData.companyName = contractorEditData.companyName;
    }
    if (contractorEditData.description !== selectedContractor?.description) {
      updateData.description = contractorEditData.description;
    }
    if (contractorEditData.hourlyRate !== selectedContractor?.hourlyRate?.toString()) {
      updateData.hourlyRate = contractorEditData.hourlyRate;
    }
    if (JSON.stringify(contractorEditData.specialties) !== JSON.stringify(selectedContractor?.specialties || [])) {
      updateData.specialties = contractorEditData.specialties;
    }
    if (contractorEditData.serviceAreas !== selectedContractor?.serviceAreas?.join(', ')) {
      updateData.serviceAreas = contractorEditData.serviceAreas;
    }
    if (contractorEditData.fullName !== selectedContractor?.fullName) {
      updateData.fullName = contractorEditData.fullName;
    }
    if (contractorEditData.email !== selectedContractor?.email) {
      updateData.email = contractorEditData.email;
    }
    if (contractorEditData.phone !== selectedContractor?.phone) {
      updateData.phone = contractorEditData.phone;
    }
    if (contractorEditData.password) {
      updateData.password = contractorEditData.password;
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    editContractorMutation.mutate({
      id: selectedContractor.id,
      ...updateData
    });
  };

  const handleContractorDelete = () => {
    if (window.confirm('Are you sure you want to archive this contractor? This action will move them to archive and they will be permanently deleted after 60 days.')) {
      deleteContractorMutation.mutate(selectedContractor.id);
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

  // Calculate real metrics from data
  const totalSalespersons = salespersons?.length || 0;
  const activeSalespersons = salespersons?.filter((s: any) => s.isActive !== false)?.length || 0;
  const totalContractors = contractors?.length || 0;
  const activeContractors = contractors?.filter((c: any) => c.isActive !== false)?.length || 0;
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter((p: any) => p.status === 'completed')?.length || 0;
  const totalBidRequests = bidRequests?.length || 0;
  const pendingBidRequests = bidRequests?.filter((b: any) => b.status === 'pending')?.length || 0;
  const totalRevenue = projects?.filter((p: any) => p.status === 'completed')
    ?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;

  // Real chart data from analytics
  const monthlyData = analyticsData?.monthlyPerformance || [
    { name: 'Current', leads: totalBidRequests, conversions: completedProjects }
  ];

  const pieData = [
    { name: 'Active Sales Reps', value: activeSalespersons, color: '#10b981' },
    { name: 'Inactive Sales Reps', value: totalSalespersons - activeSalespersons, color: '#ef4444' },
    { name: 'Active Contractors', value: activeContractors, color: '#3b82f6' },
    { name: 'Inactive Contractors', value: totalContractors - activeContractors, color: '#f59e0b' }
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  // Stats object for dashboard cards
  const stats = {
    totalSalespersons,
    activeSalespersons,
    totalContractors,
    activeContractors,
    totalProjects,
    completedProjects,
    totalBidRequests,
    pendingBidRequests,
    totalRevenue
  };

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
              onClick={handleBackToPortals}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2 w-full sm:w-auto"
              style={antiYellowInputStyles}
            >
              <Users className="h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card style={antiYellowStyles}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Sales Reps</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSalespersons}</p>
                  <p className="text-xs text-green-600">{stats.activeSalespersons} active</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Contractors</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalContractors}</p>
                  <p className="text-xs text-green-600">{stats.activeContractors} verified</p>
                </div>
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Total Projects</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                  <p className="text-xs text-blue-600">Active projects</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card style={antiYellowStyles}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Bid Requests</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBidRequests}</p>
                  <p className="text-xs text-orange-600">{stats.pendingBidRequests} pending</p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 pb-20 sm:pb-0">
          {/* Desktop/Tablet Navigation - Hidden on mobile */}
          <TabsList className="hidden sm:grid w-full grid-cols-4">
            <TabsTrigger value="salespersons">Sales Representatives</TabsTrigger>
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="bid-requests">Bid Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Mobile Navigation - Fixed bottom bar, shown only on mobile */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
            <div className="grid grid-cols-4 h-16">
              <button
                onClick={() => setActiveTab("salespersons")}
                className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  activeTab === "salespersons" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Sales</span>
              </button>
              <button
                onClick={() => setActiveTab("contractors")}
                className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  activeTab === "contractors" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span>Contractors</span>
              </button>
              <button
                onClick={() => setActiveTab("bid-requests")}
                className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  activeTab === "bid-requests" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <Target className="h-5 w-5" />
                <span>Bids</span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  activeTab === "analytics" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Sales Representatives Tab */}
          <TabsContent value="salespersons">
            <Card style={antiYellowStyles}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Sales Representatives Management</CardTitle>
                    <CardDescription className="text-sm">Monitor sales performance and manage team members</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold text-sm sm:text-base" style={antiYellowInputStyles}>
                        <Plus className="h-4 w-4 mr-2 text-black" />
                        <span className="hidden sm:inline">Add Salesperson</span>
                        <span className="sm:hidden">Add</span>
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
                          style={antiYellowInputStyles}
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
                    <div key={salesperson.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{salesperson.fullName || 'No Name Provided'}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                            Profile: {salesperson.profileUrl}
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-sm sm:text-lg font-bold">{salesperson.totalLeads || 0}</div>
                              <div className="text-xs text-gray-500">Total Leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm sm:text-lg font-bold">{salesperson.conversionRate && !isNaN(salesperson.conversionRate) ? ((salesperson.conversionRate) * 100).toFixed(1) : '0.0'}%</div>
                              <div className="text-xs text-gray-500">Conversion</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm sm:text-lg font-bold">${(salesperson.commissions || 0).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Commission</div>
                            </div>
                          </div>
                        </div>
                        <Badge variant={salesperson.isActive ? "default" : "destructive"}>
                          {salesperson.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(salesperson)}>
                          <Eye className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(salesperson)}>
                          <Edit3 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
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
            <Card style={antiYellowStyles}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Contractors Management</CardTitle>
                    <CardDescription className="text-sm">Manage contractor profiles and verification status</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold text-sm sm:text-base w-full sm:w-auto" style={antiYellowInputStyles}>
                        <Plus className="h-4 w-4 mr-2 text-black" />
                        <span className="hidden sm:inline">Add Contractor</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold">Create New Contractor</DialogTitle>
                        <DialogDescription className="text-base">
                          Add a new contractor to the platform
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Username</label>
                            <Input
                              type="text"
                              placeholder="Enter username"
                              value={contractorAddData.username}
                              onChange={(e) => setContractorAddData({...contractorAddData, username: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Full Name</label>
                            <Input
                              type="text"
                              placeholder="Enter full name"
                              value={contractorAddData.fullName}
                              onChange={(e) => setContractorAddData({...contractorAddData, fullName: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Email</label>
                            <Input
                              type="email"
                              placeholder="Enter email"
                              value={contractorAddData.email}
                              onChange={(e) => setContractorAddData({...contractorAddData, email: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Phone</label>
                            <Input
                              type="text"
                              placeholder="Enter phone number"
                              value={contractorAddData.phone}
                              onChange={(e) => setContractorAddData({...contractorAddData, phone: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Company Name</label>
                          <Input
                            type="text"
                            placeholder="Enter company name"
                            value={contractorAddData.companyName}
                            onChange={(e) => setContractorAddData({...contractorAddData, companyName: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Company Description</label>
                          <Textarea
                            placeholder="Enter company description"
                            value={contractorAddData.description}
                            onChange={(e) => setContractorAddData({...contractorAddData, description: e.target.value})}
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Hourly Rate ($)</label>
                            <Input
                              type="number"
                              placeholder="Enter hourly rate"
                              value={contractorAddData.hourlyRate}
                              onChange={(e) => setContractorAddData({...contractorAddData, hourlyRate: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Service Areas</label>
                            <Input
                              type="text"
                              placeholder="Enter service areas (comma-separated)"
                              value={contractorAddData.serviceAreas}
                              onChange={(e) => setContractorAddData({...contractorAddData, serviceAreas: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Password</label>
                            <Input
                              type="password"
                              placeholder="Enter password"
                              value={contractorAddData.password}
                              onChange={(e) => setContractorAddData({...contractorAddData, password: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                            <Input
                              type="password"
                              placeholder="Confirm password"
                              value={contractorAddData.confirmPassword}
                              onChange={(e) => setContractorAddData({...contractorAddData, confirmPassword: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-black text-white hover:bg-gray-800"
                          onClick={async () => {
                            try {
                              // Validate passwords match
                              if (contractorAddData.password !== contractorAddData.confirmPassword) {
                                alert('Passwords do not match');
                                return;
                              }

                              // Validate required fields
                              if (!contractorAddData.username || !contractorAddData.fullName || !contractorAddData.email || 
                                  !contractorAddData.companyName || !contractorAddData.password) {
                                alert('Please fill in all required fields');
                                return;
                              }

                              const response = await fetch('/api/contractors', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  username: contractorAddData.username,
                                  password: contractorAddData.password,
                                  fullName: contractorAddData.fullName,
                                  email: contractorAddData.email,
                                  phone: contractorAddData.phone,
                                  companyName: contractorAddData.companyName,
                                  description: contractorAddData.description,
                                  hourlyRate: contractorAddData.hourlyRate ? parseFloat(contractorAddData.hourlyRate) : null,
                                  serviceAreas: contractorAddData.serviceAreas ? contractorAddData.serviceAreas.split(',').map(area => area.trim()) : []
                                })
                              });
                              
                              if (response.ok) {
                                alert('Contractor created successfully!');
                                // Reset form
                                setContractorAddData({
                                  username: '',
                                  password: '',
                                  confirmPassword: '',
                                  fullName: '',
                                  email: '',
                                  phone: '',
                                  companyName: '',
                                  description: '',
                                  hourlyRate: '',
                                  specialties: [],
                                  serviceAreas: ''
                                });
                                // Refresh data
                                window.location.reload();
                              } else {
                                const error = await response.text();
                                alert(`Error: ${error}`);
                              }
                            } catch (error) {
                              alert(`Error: ${error}`);
                            }
                          }}
                        >
                          Create Contractor
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleContractorView(contractor)} className="border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-800">
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleContractorEdit(contractor)} className="border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-800">
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
            <Card style={antiYellowStyles}>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Bid Requests Management</CardTitle>
                <CardDescription className="text-sm">Monitor and manage incoming bid requests</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mobile view - Cards layout for smaller screens */}
                <div className="block sm:hidden space-y-4">
                  {bidRequests.map((request: any) => (
                    <Card key={request.id} className="p-4" style={antiYellowStyles}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{request.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{request.email}</p>
                            <p className="text-xs text-gray-500 truncate">{request.phone}</p>
                          </div>
                          <Badge 
                            variant={
                              request.status === 'pending' ? "outline" :
                              request.status === 'approved' ? "default" : "destructive"
                            }
                            className="flex-shrink-0 text-xs px-2 py-1"
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Service: {request.serviceRequested}</p>
                          <p className="text-xs text-gray-500">Budget: ${request.budget || 'Not specified'}</p>
                          <p className="text-xs text-gray-500">Address: {request.address || 'Not provided'}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                          <p>Salesperson: {request.salesperson?.fullName || 'Unassigned'}</p>
                        </div>
                        {request.projectDescription && (
                          <div>
                            <p className="text-xs font-medium">Description:</p>
                            <p className="text-xs text-gray-600">{request.projectDescription}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Select
                            value={request.status}
                            onValueChange={(value) => 
                              updateBidRequestStatus.mutate({ 
                                bidRequestId: request.id, 
                                status: value 
                              })
                            }
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs">
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
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop view - Table layout for larger screens */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Details</TableHead>
                        <TableHead>Service & Budget</TableHead>
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
                              <p className="text-sm text-gray-500">{request.phone}</p>
                              {request.address && (
                                <p className="text-xs text-gray-400">{request.address}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.serviceRequested}</p>
                              <p className="text-sm text-gray-500">Budget: ${request.budget || 'Not specified'}</p>
                              {request.projectDescription && (
                                <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={request.projectDescription}>
                                  {request.projectDescription}
                                </p>
                              )}
                            </div>
                          </TableCell>
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
                </div>
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
          <DialogContent className="sm:max-w-[450px] max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Sales Representative</DialogTitle>
              <DialogDescription className="text-sm">
                Update information for {selectedSalesperson?.fullName || 'Sales Rep'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium block mb-2">Full Name</label>
                <Input
                  className="w-full max-w-full"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Profile URL</label>
                <Input
                  className="w-full max-w-full text-sm"
                  value={editFormData.profileUrl}
                  onChange={(e) => setEditFormData({...editFormData, profileUrl: e.target.value})}
                  placeholder="Enter profile URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">New Password (leave empty to keep current)</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Confirm New Password</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={editFormData.confirmPassword}
                  onChange={(e) => setEditFormData({...editFormData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={editSalespersonMutation.isPending}
                    className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold px-4 py-2 text-sm"
                  >
                    Save Changes
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteSalespersonMutation.isPending}
                  className="w-full text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Salesperson
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contractor View Modal */}
        <Dialog open={contractorViewOpen} onOpenChange={setContractorViewOpen}>
          <DialogContent className="sm:max-w-[600px] max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Contractor Details</DialogTitle>
              <DialogDescription className="text-sm">
                Complete information for {selectedContractor?.companyName || 'Contractor'}
              </DialogDescription>
            </DialogHeader>
            {selectedContractor && (
              <div className="space-y-4 px-1 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-sm">Company Name:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedContractor.companyName}</p>
                  </div>
                  <div>
                    <strong className="text-sm">Contact Name:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedContractor.fullName}</p>
                  </div>
                  <div>
                    <strong className="text-sm">Email:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedContractor.email}</p>
                  </div>
                  <div>
                    <strong className="text-sm">Phone:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedContractor.phone}</p>
                  </div>
                  <div>
                    <strong className="text-sm">Hourly Rate:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">${selectedContractor.hourlyRate || 0}/hr</p>
                  </div>
                  <div>
                    <strong className="text-sm">Status:</strong>
                    <Badge variant={selectedContractor.isActive ? "default" : "destructive"}>
                      {selectedContractor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <strong className="text-sm">Description:</strong>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedContractor.description}</p>
                </div>
                {selectedContractor.specialties && selectedContractor.specialties.length > 0 && (
                  <div>
                    <strong className="text-sm">Specialties:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedContractor.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContractor.serviceAreas && selectedContractor.serviceAreas.length > 0 && (
                  <div>
                    <strong className="text-sm">Service Areas:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {selectedContractor.serviceAreas.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contractor Edit Modal */}
        <Dialog open={contractorEditOpen} onOpenChange={setContractorEditOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Contractor</DialogTitle>
              <DialogDescription className="text-sm">
                Update information for {selectedContractor?.companyName || 'Contractor'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Company Name</label>
                  <Input
                    className="w-full"
                    value={contractorEditData.companyName}
                    onChange={(e) => setContractorEditData({...contractorEditData, companyName: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Contact Name</label>
                  <Input
                    className="w-full"
                    value={contractorEditData.fullName}
                    onChange={(e) => setContractorEditData({...contractorEditData, fullName: e.target.value})}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Email</label>
                  <Input
                    className="w-full"
                    type="email"
                    value={contractorEditData.email}
                    onChange={(e) => setContractorEditData({...contractorEditData, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Phone</label>
                  <Input
                    className="w-full"
                    value={contractorEditData.phone}
                    onChange={(e) => setContractorEditData({...contractorEditData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                  value={contractorEditData.description}
                  onChange={(e) => setContractorEditData({...contractorEditData, description: e.target.value})}
                  placeholder="Enter company description"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Hourly Rate ($)</label>
                <Input
                  className="w-full"
                  type="number"
                  value={contractorEditData.hourlyRate}
                  onChange={(e) => setContractorEditData({...contractorEditData, hourlyRate: e.target.value})}
                  placeholder="Enter hourly rate"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Service Areas (comma-separated)</label>
                <Input
                  className="w-full"
                  value={contractorEditData.serviceAreas}
                  onChange={(e) => setContractorEditData({...contractorEditData, serviceAreas: e.target.value})}
                  placeholder="Enter service areas"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">New Password (leave empty to keep current)</label>
                <Input
                  className="w-full"
                  type="password"
                  value={contractorEditData.password}
                  onChange={(e) => setContractorEditData({...contractorEditData, password: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Confirm New Password</label>
                <Input
                  className="w-full"
                  type="password"
                  value={contractorEditData.confirmPassword}
                  onChange={(e) => setContractorEditData({...contractorEditData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setContractorEditOpen(false)}
                    className="flex-1 text-sm border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContractorEditSubmit}
                    disabled={editContractorMutation.isPending}
                    className="flex-1 text-sm bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    Save Changes
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleContractorDelete}
                  disabled={deleteContractorMutation.isPending}
                  className="w-full text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Contractor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}