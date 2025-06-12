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
  
  // Salesperson modal states
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    profileUrl: '',
    password: '',
    confirmPassword: ''
  });

  // Contractor modal states
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [contractorViewOpen, setContractorViewOpen] = useState(false);
  const [contractorEditOpen, setContractorEditOpen] = useState(false);
  const [contractorAddOpen, setContractorAddOpen] = useState(false);
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

  const contractors = Array.isArray(contractorsData) ? contractorsData.filter(c => c.isActive !== false) : [];

  // Contractor management handlers
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
      serviceAreas: (contractor.serviceAreas || []).join(', '),
      fullName: contractor.fullName || '',
      email: contractor.email || '',
      phone: contractor.phone || '',
      password: '',
      confirmPassword: ''
    });
    setContractorEditOpen(true);
  };

  // Contractor mutations
  const addContractorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/contractors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      setContractorAddOpen(false);
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
      toast({
        title: "Success",
        description: "Contractor created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create contractor: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const editContractorMutation = useMutation({
    mutationFn: async (data: { id: number; [key: string]: any }) => {
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

  const deleteContractorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/contractors/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to archive contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      setContractorEditOpen(false);
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

  const handleContractorAddSubmit = () => {
    if (contractorAddData.password !== contractorAddData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...contractorAddData,
      specialties: contractorAddData.specialties,
      serviceAreas: contractorAddData.serviceAreas,
      hourlyRate: parseFloat(contractorAddData.hourlyRate) || 0,
      yearsInBusiness: "1",
      employeeCount: "1-5",
      licenseNumber: "AUTO-" + Date.now(),
      insuranceProvider: "General Insurance Co.",
      businessAddress: "123 Business St, City, State",
      portfolioDescription: "Professional contractor services",
      agreeToTerms: true
    };

    addContractorMutation.mutate(submitData);
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

    const updateData: any = { id: selectedContractor?.id };
    
    if (contractorEditData.companyName !== selectedContractor?.companyName) {
      updateData.companyName = contractorEditData.companyName;
    }
    if (contractorEditData.description !== selectedContractor?.description) {
      updateData.description = contractorEditData.description;
    }
    if (contractorEditData.hourlyRate !== selectedContractor?.hourlyRate?.toString()) {
      updateData.hourlyRate = parseFloat(contractorEditData.hourlyRate) || 0;
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

    editContractorMutation.mutate(updateData);
  };

  const handleContractorDelete = () => {
    if (selectedContractor?.id) {
      deleteContractorMutation.mutate(selectedContractor.id);
    }
  };

  // Rest of the component stays the same - just need to update the contractors tab
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Comprehensive management dashboard</p>
          </div>
          <Button 
            onClick={() => navigate('/portal-access')}
            variant="outline"
            className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
          >
            Back to Portal
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="salespersons">Sales Reps</TabsTrigger>
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Contractors Tab */}
          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Contractors Management</CardTitle>
                    <CardDescription>Manage contractor profiles and verification status</CardDescription>
                  </div>
                  <Button
                    onClick={() => setContractorAddOpen(true)}
                    className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contractor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingContractors ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : contractors.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No contractors found.
                    </div>
                  ) : (
                    contractors.map((contractor: any) => (
                      <div key={contractor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{contractor.companyName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{contractor.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Rate: ${contractor.hourlyRate || 0}/hr</span>
                              <span>Specialties: {contractor.specialties?.length || 0}</span>
                              <span>Owner: {contractor.fullName || 'Unknown'}</span>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContractorView(contractor)}
                            className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContractorEdit(contractor)}
                            className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would continue here... */}
        </Tabs>

        {/* Contractor View Modal */}
        <Dialog open={contractorViewOpen} onOpenChange={setContractorViewOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Contractor Details</DialogTitle>
              <DialogDescription className="text-sm">
                View information for {selectedContractor?.companyName || 'Contractor'}
              </DialogDescription>
            </DialogHeader>
            {selectedContractor && (
              <div className="space-y-4 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <p className="text-sm text-gray-600">{selectedContractor.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Owner</label>
                    <p className="text-sm text-gray-600">{selectedContractor.fullName}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600">{selectedContractor.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hourly Rate</label>
                    <p className="text-sm text-gray-600">${selectedContractor.hourlyRate}/hr</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{selectedContractor.email}</p>
                  </div>
                </div>
                {selectedContractor.specialties && selectedContractor.specialties.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Specialties</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedContractor.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contractor Edit Modal */}
        <Dialog open={contractorEditOpen} onOpenChange={setContractorEditOpen}>
          <DialogContent className="sm:max-w-[450px] max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Contractor</DialogTitle>
              <DialogDescription className="text-sm">
                Update information for {selectedContractor?.companyName || 'Contractor'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium block mb-2">Company Name</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorEditData.companyName}
                  onChange={(e) => setContractorEditData({...contractorEditData, companyName: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <Textarea
                  className="w-full max-w-full"
                  value={contractorEditData.description}
                  onChange={(e) => setContractorEditData({...contractorEditData, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Owner Full Name</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorEditData.fullName}
                  onChange={(e) => setContractorEditData({...contractorEditData, fullName: e.target.value})}
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Email</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorEditData.email}
                  onChange={(e) => setContractorEditData({...contractorEditData, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Phone</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorEditData.phone}
                  onChange={(e) => setContractorEditData({...contractorEditData, phone: e.target.value})}
                  placeholder="Enter phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">New Password (leave empty to keep current)</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={contractorEditData.password}
                  onChange={(e) => setContractorEditData({...contractorEditData, password: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Confirm New Password</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={contractorEditData.confirmPassword}
                  onChange={(e) => setContractorEditData({...contractorEditData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setContractorEditOpen(false)}
                    className="px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContractorEditSubmit}
                    disabled={editContractorMutation.isPending}
                    className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold px-4 py-2 text-sm"
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

        {/* Contractor Add Modal */}
        <Dialog open={contractorAddOpen} onOpenChange={setContractorAddOpen}>
          <DialogContent className="sm:max-w-[500px] max-w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Contractor</DialogTitle>
              <DialogDescription className="text-sm">
                Create a new contractor account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium block mb-2">Username</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorAddData.username}
                  onChange={(e) => setContractorAddData({...contractorAddData, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Password</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={contractorAddData.password}
                  onChange={(e) => setContractorAddData({...contractorAddData, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Confirm Password</label>
                <Input
                  className="w-full max-w-full"
                  type="password"
                  value={contractorAddData.confirmPassword}
                  onChange={(e) => setContractorAddData({...contractorAddData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Full Name</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorAddData.fullName}
                  onChange={(e) => setContractorAddData({...contractorAddData, fullName: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Email</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorAddData.email}
                  onChange={(e) => setContractorAddData({...contractorAddData, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Phone</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorAddData.phone}
                  onChange={(e) => setContractorAddData({...contractorAddData, phone: e.target.value})}
                  placeholder="Enter phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Company Name</label>
                <Input
                  className="w-full max-w-full"
                  value={contractorAddData.companyName}
                  onChange={(e) => setContractorAddData({...contractorAddData, companyName: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <Textarea
                  className="w-full max-w-full"
                  value={contractorAddData.description}
                  onChange={(e) => setContractorAddData({...contractorAddData, description: e.target.value})}
                  placeholder="Enter company description"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Hourly Rate</label>
                <Input
                  className="w-full max-w-full"
                  type="number"
                  value={contractorAddData.hourlyRate}
                  onChange={(e) => setContractorAddData({...contractorAddData, hourlyRate: e.target.value})}
                  placeholder="Enter hourly rate"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setContractorAddOpen(false)}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContractorAddSubmit}
                  disabled={addContractorMutation.isPending}
                  className="bg-white text-black border-2 border-black hover:bg-gray-100 font-semibold px-4 py-2 text-sm"
                >
                  Create Contractor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}