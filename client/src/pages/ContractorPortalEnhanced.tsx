import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Camera, 
  DollarSign, 
  FileText, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  Upload,
  X,
  Plus,
  Trash2,
  Eye,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ContractorPortalEnhanced: React.FC = () => {
  const [, navigate] = useLocation();
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
    logoUrl: '',
    hourlyRate: 0,
    videoUrl: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: 'image' | 'video', name: string}[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

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

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: true
  });

  const contractor = userData?.roleData;

  // Get contractor's projects
  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!contractor?.id
  });

  const projects = projectsData?.projects || [];

  // Get contractor's bid requests
  const { data: bidRequestsData } = useQuery({
    queryKey: [`/api/contractors/${contractor?.id}/bid-requests`],
    enabled: !!contractor?.id
  });

  const bidRequests = bidRequestsData?.bidRequests || [];

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
        logoUrl: contractor.logoUrl || '',
        hourlyRate: contractor.hourlyRate || 0,
        videoUrl: contractor.videoUrl || ''
      });
      setLogoPreview(contractor.logoUrl || '');
      setMediaFiles(contractor.mediaFiles || []);
    }
  }, [contractor]);

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit for logo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setEditForm({...editForm, logoUrl: result});
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle media files upload
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Check file size (50MB limit for media)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 50MB.`,
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        
        setMediaFiles(prev => [...prev, {
          url: result,
          type: fileType,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  // Remove media file
  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Add specialty
  const addSpecialty = () => {
    if (newSpecialty.trim() && !editForm.specialties.includes(newSpecialty.trim())) {
      setEditForm({
        ...editForm,
        specialties: [...editForm.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  // Remove specialty
  const removeSpecialty = (specialty: string) => {
    setEditForm({
      ...editForm,
      specialties: editForm.specialties.filter(s => s !== specialty)
    });
  };

  // Add service area
  const addServiceArea = () => {
    if (newServiceArea.trim() && !editForm.serviceAreas.includes(newServiceArea.trim())) {
      setEditForm({
        ...editForm,
        serviceAreas: [...editForm.serviceAreas, newServiceArea.trim()]
      });
      setNewServiceArea('');
    }
  };

  // Remove service area
  const removeServiceArea = (area: string) => {
    setEditForm({
      ...editForm,
      serviceAreas: editForm.serviceAreas.filter(a => a !== area)
    });
  };

  // Update contractor profile mutation
  const updateContractorMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(`/api/contractors/${contractor?.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...updatedData,
          mediaFiles: mediaFiles || [],
          isActive: true
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contractor profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
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
        logoUrl: contractor.logoUrl || '',
        hourlyRate: contractor.hourlyRate || 0,
        videoUrl: contractor.videoUrl || ''
      });
      setLogoPreview(contractor.logoUrl || '');
      setMediaFiles(contractor.mediaFiles || []);
    }
  };

  // Performance data calculations
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length;
  const pendingBids = bidRequests.filter((b: any) => b.status === 'pending').length;
  const totalRevenue = projects
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  // Chart data
  const projectData = [
    { month: 'Jan', completed: 8, active: 12, revenue: 45000 },
    { month: 'Feb', completed: 12, active: 15, revenue: 62000 },
    { month: 'Mar', completed: 10, active: 18, revenue: 58000 },
    { month: 'Apr', completed: 15, active: 20, revenue: 75000 },
    { month: 'May', completed: 18, active: 16, revenue: 89000 },
    { month: 'Jun', completed: 22, active: 14, revenue: 95000 }
  ];

  const statusDistribution = [
    { name: 'Completed', value: completedProjects, color: '#10b981' },
    { name: 'Active', value: activeProjects, color: '#3b82f6' },
    { name: 'Pending', value: pendingBids, color: '#f59e0b' }
  ];

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
            <Button onClick={() => logoutMutation.mutate()} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Company Profile</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="bids">Bid Requests</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedProjects}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeProjects}</div>
                    <p className="text-xs text-muted-foreground">Currently in progress</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingBids}</div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" />
                        <Bar dataKey="active" fill="#3b82f6" name="Active" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Manage your company information and media</CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    variant={isEditingProfile ? "outline" : "default"}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingProfile ? "Cancel" : "Edit Profile"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isEditingProfile ? (
                    // Display Mode
                    <div className="space-y-6">
                      {/* Company Logo and Basic Info */}
                      <div className="flex items-start space-x-6">
                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                          {contractor?.logoUrl ? (
                            <img src={contractor.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-16 w-16 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{contractor?.companyName || 'Company Name'}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">{contractor?.description || 'No description available'}</p>
                          <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{contractor?.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{contractor?.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                              <span>${contractor?.hourlyRate || 0}/hr</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Specialties */}
                      <div>
                        <h4 className="font-medium mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.specialties?.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          )) || <span className="text-gray-500">No specialties listed</span>}
                        </div>
                      </div>

                      {/* Service Areas */}
                      <div>
                        <h4 className="font-medium mb-3">Service Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.serviceAreas?.map((area: string, index: number) => (
                            <Badge key={index} variant="outline">{area}</Badge>
                          )) || <span className="text-gray-500">No service areas listed</span>}
                        </div>
                      </div>

                      {/* Media Gallery */}
                      <div>
                        <h4 className="font-medium mb-3">Portfolio Media</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {contractor?.mediaFiles?.map((media: any, index: number) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                              ) : (
                                <video src={media.url} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )) || <p className="text-gray-500 col-span-full">No media files uploaded</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-6">
                      {/* Company Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Logo</label>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Button>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Company Name</label>
                          <Input
                            value={editForm.companyName}
                            onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Hourly Rate ($)</label>
                          <Input
                            type="number"
                            value={editForm.hourlyRate}
                            onChange={(e) => setEditForm({...editForm, hourlyRate: parseFloat(e.target.value)})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone</label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Description</label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          placeholder="Describe your company and services..."
                          rows={4}
                        />
                      </div>

                      {/* Specialties */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Specialties</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editForm.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {specialty}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSpecialty(specialty)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            placeholder="Add specialty"
                            onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                          />
                          <Button type="button" onClick={addSpecialty} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Service Areas */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Service Areas</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editForm.serviceAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {area}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeServiceArea(area)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newServiceArea}
                            onChange={(e) => setNewServiceArea(e.target.value)}
                            placeholder="Add service area"
                            onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
                          />
                          <Button type="button" onClick={addServiceArea} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Media Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Portfolio Media</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {mediaFiles.map((media, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                              ) : (
                                <video src={media.url} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-2 right-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeMediaFile(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div 
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                            onClick={() => mediaInputRef.current?.click()}
                          >
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Add Media</p>
                            </div>
                          </div>
                        </div>
                        <input
                          ref={mediaInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500">Max 50MB per file, images and videos supported</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={updateContractorMutation.isPending}
                        >
                          {updateContractorMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>Track and manage your current and completed projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.length > 0 ? (
                      projects.map((project: any) => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{project.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
                            </div>
                            <Badge variant={
                              project.status === 'completed' ? 'default' :
                              project.status === 'in_progress' ? 'secondary' : 'outline'
                            }>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Service: {project.serviceType}</span>
                            <span>Budget: ${project.budget?.toLocaleString() || 'Not specified'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No projects found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bids Tab */}
            <TabsContent value="bids" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Requests</CardTitle>
                  <CardDescription>Manage incoming bid requests and opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests.length > 0 ? (
                      bidRequests.map((bid: any) => (
                        <div key={bid.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{bid.fullName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{bid.serviceRequested}</p>
                              <p className="text-sm text-gray-500 mt-1">{bid.description}</p>
                            </div>
                            <Badge variant={
                              bid.status === 'completed' ? 'default' :
                              bid.status === 'contacted' ? 'secondary' : 'outline'
                            }>
                              {bid.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Phone:</span> {bid.phone}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {bid.email}
                            </div>
                            <div>
                              <span className="font-medium">Timeline:</span> {bid.timeline}
                            </div>
                            <div>
                              <span className="font-medium">Budget:</span> {bid.budget || 'Not specified'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No bid requests found</p>
                    )}
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

export default ContractorPortalEnhanced;