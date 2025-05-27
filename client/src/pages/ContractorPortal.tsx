import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building, Users, FileText, TrendingUp, Calendar, Star, Edit, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ContractorPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    description: '',
    specialties: [] as string[],
    serviceAreas: [] as string[],
    licenseNumber: '',
    phone: '',
    email: '',
    logoUrl: ''
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get contractor data directly - the API will use session to identify the user
  const { data: contractorData } = useQuery({
    queryKey: ['/api/contractors/11'], // Using the known contractor ID for now
    enabled: true
  });

  const contractor = contractorData?.contractor;
  const contractorId = contractor?.id;

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: bidRequests, refetch: refetchBidRequests } = useQuery({
    queryKey: ['/api/contractors', contractorId, 'bid-requests'],
    enabled: !!contractorId,
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      console.log('Fetching bid requests with token:', token ? 'present' : 'missing');
      const response = await fetch(`/api/contractors/${contractorId}/bid-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Bid requests response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bid requests error:', errorText);
        throw new Error('Failed to fetch bid requests');
      }
      const data = await response.json();
      console.log('Bid requests data:', data);
      return data;
    }
  });

  // Initialize edit form with contractor data
  useEffect(() => {
    if (contractor) {
      setEditForm({
        companyName: contractor.companyName || '',
        description: contractor.description || '',
        specialties: contractor.specialties || [],
        serviceAreas: contractor.serviceAreas || [],
        licenseNumber: contractor.licenseNumber || '',
        phone: contractor.phone || '',
        email: contractor.email || '',
        logoUrl: contractor.logoUrl || ''
      });
      setProfilePhotoPreview(contractor.logoUrl || '');
    }
  }, [contractor]);

  // Handle profile photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhotoPreview(result);
        setEditForm({...editForm, logoUrl: result});
      };
      reader.readAsDataURL(file);
    }
  };

  // Update contractor profile mutation
  const updateContractorMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`/api/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error('Failed to update contractor profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors', contractorId] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated!",
        description: "Your company profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateContractorMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to original values
    if (contractor) {
      setEditForm({
        companyName: contractor.companyName || '',
        description: contractor.description || '',
        specialties: contractor.specialties || [],
        serviceAreas: contractor.serviceAreas || [],
        licenseNumber: contractor.licenseNumber || '',
        phone: contractor.phone || '',
        email: contractor.email || '',
        logoUrl: contractor.logoUrl || ''
      });
    }
  };

  // Mock performance data for charts
  const projectData = [
    { month: 'Jan', completed: 8, active: 12, revenue: 45000 },
    { month: 'Feb', completed: 12, active: 15, revenue: 62000 },
    { month: 'Mar', completed: 10, active: 18, revenue: 58000 },
    { month: 'Apr', completed: 15, active: 20, revenue: 75000 },
    { month: 'May', completed: 18, active: 16, revenue: 89000 },
    { month: 'Jun', completed: 22, active: 14, revenue: 95000 }
  ];

  const completedProjects = Array.isArray(projects) ? projects.filter((p: any) => p.status === 'completed')?.length || 0 : 0;
  const activeProjects = Array.isArray(projects) ? projects.filter((p: any) => p.status === 'in_progress')?.length || 0 : 0;

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
                    <div className="text-2xl font-bold">{Array.isArray(bidRequests) ? bidRequests.filter((b: any) => b.status === 'pending')?.length || 0 : 0}</div>
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
                    {Array.isArray(projects) ? projects.slice(0, 5).map((project: any) => (
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
                    )) : (
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
                    {Array.isArray(bidRequests?.bidRequests) && bidRequests.bidRequests.length > 0 ? 
                      bidRequests.bidRequests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-lg">{request.fullName}</h4>
                              <Badge variant={request.status === 'pending' ? 'default' : 
                                             request.status === 'contacted' ? 'secondary' : 'outline'}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <p><span className="font-medium">Email:</span> {request.email}</p>
                              <p><span className="font-medium">Phone:</span> {request.phone}</p>
                              <p><span className="font-medium">Timeline:</span> {request.timeline}</p>
                              {request.budget && <p><span className="font-medium">Budget:</span> ${request.budget}</p>}
                            </div>
                            <p className="text-sm"><span className="font-medium">Project:</span> {request.description}</p>
                            <p className="text-sm"><span className="font-medium">Address:</span> {request.address}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Contact Customer
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h1a2 2 0 012 2v1m0 0v2a2 2 0 002 2h2m0 0v1" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">No bid requests yet</p>
                          <p className="text-gray-400 text-sm">New customer inquiries will appear here</p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Manage your company information and services</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditingProfile ? (
                      <>
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={updateContractorMutation.isPending}
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateContractorMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          onClick={handleCancelEdit} 
                          variant="outline" 
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditingProfile(true)} 
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingProfile ? (
                    // Edit Mode
                    <div className="space-y-4">
                      {/* Profile Photo Upload Section */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company Logo/Photo</label>
                        <div className="flex items-center gap-4">
                          {editForm.logoUrl && (
                            <img 
                              src={editForm.logoUrl} 
                              alt="Company logo" 
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                          )}
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Convert to base64 for demo purposes
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setEditForm({...editForm, logoUrl: event.target?.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload a high-quality image (JPG, PNG)</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Name</label>
                          <Input
                            value={editForm.companyName}
                            onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                            placeholder="Enter company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">License Number</label>
                          <Input
                            value={editForm.licenseNumber}
                            onChange={(e) => setEditForm({...editForm, licenseNumber: e.target.value})}
                            placeholder="Enter license number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company Description</label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          placeholder="Describe your company and services"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Specialties (comma-separated)</label>
                        <Input
                          value={Array.isArray(editForm.specialties) ? editForm.specialties.join(', ') : ''}
                          onChange={(e) => setEditForm({...editForm, specialties: e.target.value.split(',').map(s => s.trim())})}
                          placeholder="e.g., Plumbing, HVAC, Electrical"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Areas (comma-separated)</label>
                        <Input
                          value={Array.isArray(editForm.serviceAreas) ? editForm.serviceAreas.join(', ') : ''}
                          onChange={(e) => setEditForm({...editForm, serviceAreas: e.target.value.split(',').map(s => s.trim())})}
                          placeholder="e.g., Salt Lake City, Provo, Ogden"
                        />
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
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
                      {contractor?.description && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Description</label>
                          <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                            {contractor.description}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Specialties</label>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.specialties?.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          )) || <p className="text-gray-500">No specialties listed</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Areas</label>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.serviceAreas?.map((area: string, index: number) => (
                            <Badge key={index} variant="outline">{area}</Badge>
                          )) || <p className="text-gray-500">No service areas listed</p>}
                        </div>
                      </div>
                    </div>
                  )}
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