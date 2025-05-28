import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building, Users, FileText, TrendingUp, Calendar, Star, Edit, Save, X, Bell, BellRing } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

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

  // Real-time notifications for new bid requests
  const notifications = useNotifications(contractorId || null);



  // Simple state-based approach for bid requests
  const [bidRequests, setBidRequests] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  
  // State for projects (sent bids)
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Media viewer modal state
  const [viewingMedia, setViewingMedia] = useState<{url: string, type: 'image' | 'video', index: number, allMedia: any[]} | null>(null);
  
  // Bid details viewer state
  const [viewingBidDetails, setViewingBidDetails] = useState<any | null>(null);

  // Function to open media viewer
  const openMediaViewer = (url: string, type: 'image' | 'video', index: number, allMedia: any[] = []) => {
    setViewingMedia({ url, type, index, allMedia });
  };

  // Navigate between media files
  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!viewingMedia || !viewingMedia.allMedia) return;
    
    const currentIndex = viewingMedia.index;
    let newIndex = currentIndex;
    
    if (direction === 'next' && currentIndex < viewingMedia.allMedia.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex !== currentIndex) {
      const newMediaUrl = viewingMedia.allMedia[newIndex];
      const newType = newMediaUrl.startsWith('data:image/') ? 'image' : 'video';
      setViewingMedia({
        ...viewingMedia,
        url: newMediaUrl,
        type: newType,
        index: newIndex
      });
    }
  };

  // Function to fetch bid requests
  const fetchBidRequests = () => {
    if (contractorId) {
      setLoadingBids(true);
      fetch(`/api/contractors/${contractorId}/bid-requests`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched bid requests:', data);
          // Filter out bids that have been sent (only show pending and contacted)
          const activeBids = (data?.bidRequests || []).filter((request: any) => 
            request.status === 'pending' || request.status === 'contacted'
          );
          // Sort bid requests: pending first, contacted last
          const sortedRequests = activeBids.sort((a: any, b: any) => {
            if (a.status === 'pending' && b.status === 'contacted') return -1;
            if (a.status === 'contacted' && b.status === 'pending') return 1;
            return 0;
          });
          setBidRequests(sortedRequests);
          setLoadingBids(false);
        })
        .catch(error => {
          console.error('Error fetching bid requests:', error);
          setBidRequests([]);
          setLoadingBids(false);
        });
    }
  };

  // Function to fetch projects (sent bids)
  const fetchProjects = () => {
    if (contractorId) {
      setLoadingProjects(true);
      fetch(`/api/contractors/${contractorId}/bid-requests`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched projects:', data);
          // Filter for bids that have been sent
          const sentBids = (data?.bidRequests || []).filter((request: any) => 
            request.status === 'bid_sent'
          );
          setProjects(sentBids);
          setLoadingProjects(false);
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          setProjects([]);
          setLoadingProjects(false);
        });
    }
  };

  // Function to mark customer as contacted
  const markCustomerContacted = async (requestId: number) => {
    try {
      console.log('Marking customer as contacted, ID:', requestId);
      
      // Update the database first
      const response = await fetch(`/api/contractor/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'contacted' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bid request status');
      }
      
      // Update the local state after successful database update
      setBidRequests(prevRequests => {
        const updatedRequests = prevRequests.map((request: any) => 
          request.id === requestId 
            ? { ...request, status: 'contacted' }
            : request
        );
        
        // Sort to move contacted ones to bottom
        return updatedRequests.sort((a: any, b: any) => {
          if (a.status === 'pending' && b.status === 'contacted') return -1;
          if (a.status === 'contacted' && b.status === 'pending') return 1;
          return 0;
        });
      });

      toast({
        title: "Customer Contacted!",
        description: "You can now send your bid to the customer.",
      });
      
    } catch (error) {
      console.error('Error updating bid request status:', error);
      toast({
        title: "Error",
        description: "Failed to update customer contact status.",
        variant: "destructive"
      });
    }
  };

  // Function to send bid to customer
  const sendBidToCustomer = async (requestId: number) => {
    try {
      console.log('Sending bid to customer, ID:', requestId);
      
      // Update the database to mark bid as sent
      const response = await fetch(`/api/contractor/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'bid_sent' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bid request status');
      }
      
      // Remove from current list since it moves to projects
      setBidRequests(prevRequests => {
        return prevRequests.filter((request: any) => request.id !== requestId);
      });

      // Refresh the projects list to show the new bid
      fetchProjects();
      
      // Switch to projects tab to show the moved request
      setActiveTab('projects');

      toast({
        title: "Bid Sent Successfully!",
        description: "Your bid has been sent and moved to Projects tab.",
      });
      
    } catch (error) {
      console.error('Error sending bid:', error);
      toast({
        title: "Error",
        description: "Failed to send bid to customer.",
        variant: "destructive"
      });
    }
  };

  // Fetch bid requests and projects when contractor ID is available
  useEffect(() => {
    fetchBidRequests();
    fetchProjects();
  }, [contractorId]);

  // Function to delete bid request
  const deleteBidRequest = async (requestId: number, reason: string) => {
    try {
      const response = await fetch(`/api/bid-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBidRequests();
        fetchProjects();
        toast({
          title: "Success",
          description: `Request removed - ${reason.replace('_', ' ')}`,
        });
      } else {
        throw new Error('Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to remove request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to update project status
  const updateProjectStatus = async (requestId: number, status: string) => {
    try {
      const response = await fetch(`/api/contractor/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status
        }),
      });

      if (response.ok) {
        fetchProjects();
        toast({
          title: "Success",
          description: `Project marked as ${status.replace('_', ' ')}`,
        });
      } else {
        throw new Error('Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refresh bid requests when new notification arrives
  useEffect(() => {
    if (notifications.lastNotification) {
      console.log('New bid request notification received, refreshing list...');
      fetchBidRequests();
      
      // Show toast notification
      toast({
        title: "New Customer Request!",
        description: `${notifications.lastNotification.data.customerName} submitted a project request.`,
      });
    }
  }, [notifications.lastNotification]);

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

          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Mark notifications as read when viewing leads
            if (value === 'leads') {
              notifications.markAsRead();
            }
          }} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="leads" className="relative">
                Lead Requests
                {notifications.unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center animate-pulse"
                  >
                    {notifications.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
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
                    {Array.isArray(projects) && projects.length > 0 ? projects.map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{project.fullName}</p>
                          <p className="text-sm text-gray-500">{project.description}</p>
                          <p className="text-sm">Budget: {project.budget ? `$${project.budget}` : 'Not specified'}</p>
                          <p className="text-xs text-gray-400">
                            Bid sent: {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                            BID SENT
                          </Badge>
                          <div className="flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setViewingBidDetails(project)}
                            >
                              View Details
                            </Button>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => updateProjectStatus(project.id, 'won')}
                                title="Mark project as won"
                              >
                                Won
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                onClick={() => updateProjectStatus(project.id, 'lost')}
                                title="Mark project as lost"
                              >
                                Lost
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteBidRequest(project.id, 'removed')}
                                title="Remove from projects"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 py-8">No sent bids found</p>
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
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-4">
                      Debug: {Array.isArray(bidRequests) ? `${bidRequests.length} requests found` : 'No array data'}
                    </div>
                    {Array.isArray(bidRequests) && bidRequests.length > 0 ? 
                      bidRequests.map((request: any) => (
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
                            
                            {/* Project Media */}
                            {(() => {
                              if (!request.additionalInformation) return null;
                              
                              try {
                                const mediaData = JSON.parse(request.additionalInformation);
                                const mediaUrls = mediaData.mediaUrls || [];
                                
                                if (mediaUrls.length === 0) return null;
                                
                                return (
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                      Project Media ({mediaUrls.length} files)
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2">
                                      {mediaUrls.map((url: string, idx: number) => {
                                        const isImage = url.includes('data:image/');
                                        const isVideo = url.includes('data:video/');
                                        
                                        return (
                                          <div 
                                            key={idx} 
                                            className="relative group cursor-pointer"
                                            onClick={() => openMediaViewer(url, isImage ? 'image' : 'video', idx, mediaUrls)}
                                          >
                                            {isImage ? (
                                              <img
                                                src={url}
                                                alt={`Media ${idx + 1}`}
                                                className="w-full h-16 object-cover rounded border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                              />
                                            ) : isVideo ? (
                                              <div className="relative">
                                                <video
                                                  src={url}
                                                  className="w-full h-16 object-cover rounded border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                                  muted
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                                                  <div className="bg-white bg-opacity-90 rounded-full p-1">
                                                    <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="w-full h-16 bg-gray-200 rounded border-2 border-gray-200 hover:border-blue-400 flex items-center justify-center transition-colors">
                                                <span className="text-gray-600 text-xs">File</span>
                                              </div>
                                            )}
                                            
                                            <div className="absolute top-2 right-2">
                                              <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                                                isImage ? 'bg-blue-600' : isVideo ? 'bg-red-600' : 'bg-gray-600'
                                              }`}>
                                                {isImage ? 'IMG' : isVideo ? 'VID' : 'FILE'}
                                              </span>
                                            </div>
                                            
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                                              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 bg-black bg-opacity-70 px-3 py-1 rounded">
                                                Click to View
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              } catch (error) {
                                return null;
                              }
                            })()}
                            
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            {request.status === 'pending' ? (
                              <div className="flex flex-col space-y-2">
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => markCustomerContacted(request.id)}
                                >
                                  Contact Customer
                                </Button>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => deleteBidRequest(request.id, 'not_interested')}
                                    title="Customer not interested"
                                  >
                                    Not Interested
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
                                    onClick={() => deleteBidRequest(request.id, 'no_response')}
                                    title="Customer didn't respond"
                                  >
                                    No Response
                                  </Button>
                                </div>
                              </div>
                            ) : request.status === 'contacted' ? (
                              <div className="flex flex-col space-y-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => sendBidToCustomer(request.id)}
                                >
                                  Send Bid
                                </Button>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => deleteBidRequest(request.id, 'not_interested')}
                                    title="Customer not interested"
                                  >
                                    Not Interested
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
                                    onClick={() => deleteBidRequest(request.id, 'no_response')}
                                    title="Customer didn't respond"
                                  >
                                    No Response
                                  </Button>
                                </div>
                              </div>
                            ) : null}
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

      {/* Enhanced Media Viewer Modal */}
      {viewingMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
             onClick={() => setViewingMedia(null)}
             onKeyDown={(e) => {
               if (e.key === 'Escape') setViewingMedia(null);
               if (e.key === 'ArrowLeft') navigateMedia('prev');
               if (e.key === 'ArrowRight') navigateMedia('next');
             }}
             tabIndex={0}>
          <div className="relative max-w-5xl max-h-[95vh] w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button 
              onClick={() => setViewingMedia(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous button */}
            {viewingMedia.allMedia && viewingMedia.index > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigateMedia('prev'); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-3 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {viewingMedia.allMedia && viewingMedia.index < viewingMedia.allMedia.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigateMedia('next'); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-3 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Media content */}
            <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full flex items-center justify-center">
              {viewingMedia.type === 'image' ? (
                <img 
                  src={viewingMedia.url} 
                  alt={`Project image ${viewingMedia.index + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <video 
                  src={viewingMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            
            {/* Media info bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg flex items-center space-x-4">
              <span className="text-sm">
                {viewingMedia.type === 'image' ? '📷' : '🎥'} 
                {viewingMedia.type === 'image' ? 'Photo' : 'Video'} {viewingMedia.index + 1}
                {viewingMedia.allMedia && ` of ${viewingMedia.allMedia.length}`}
              </span>
              
              {viewingMedia.allMedia && viewingMedia.allMedia.length > 1 && (
                <div className="flex space-x-1">
                  {viewingMedia.allMedia.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full ${idx === viewingMedia.index ? 'bg-white' : 'bg-gray-500'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Navigation hint */}
            {viewingMedia.allMedia && viewingMedia.allMedia.length > 1 && (
              <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-xs">
                Use ← → keys or click arrows to navigate
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bid Details Modal */}
      {viewingBidDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bid Request Details</h2>
                <button 
                  onClick={() => setViewingBidDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Preferred Contact</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.preferredContactMethod}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.address}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timeline</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.timeline}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Budget</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingBidDetails.budget ? `$${viewingBidDetails.budget}` : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Project Description</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.description}</p>
                </div>
                
                {viewingBidDetails.additionalInformation && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Additional Information</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingBidDetails.additionalInformation}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted On</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingBidDetails.createdAt).toLocaleDateString()} at {new Date(viewingBidDetails.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                        BID SENT
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Show media if available */}
                {(() => {
                  try {
                    const additionalInfo = viewingBidDetails.additionalInformation ? JSON.parse(viewingBidDetails.additionalInformation) : null;
                    const mediaUrls = additionalInfo?.mediaUrls || [];
                    
                    if (mediaUrls.length > 0) {
                      return (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-3 block">
                            Project Media ({mediaUrls.length} files)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {mediaUrls.map((url: string, idx: number) => {
                              const isImage = url.includes('data:image/');
                              const isVideo = url.includes('data:video/');
                              
                              return (
                                <div 
                                  key={idx} 
                                  className="relative group cursor-pointer"
                                  onClick={() => openMediaViewer(url, isImage ? 'image' : 'video', idx, mediaUrls)}
                                >
                                  {isImage ? (
                                    <img
                                      src={url}
                                      alt={`Media ${idx + 1}`}
                                      className="w-full h-16 object-cover rounded border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                    />
                                  ) : isVideo ? (
                                    <div className="relative">
                                      <video
                                        src={url}
                                        className="w-full h-16 object-cover rounded border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                        muted
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                                        <div className="bg-white bg-opacity-90 rounded-full p-1">
                                          <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-16 bg-gray-200 rounded border-2 border-gray-200 hover:border-blue-400 flex items-center justify-center transition-colors">
                                      <span className="text-gray-600 text-xs">File</span>
                                    </div>
                                  )}
                                  
                                  <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                                      isImage ? 'bg-blue-600' : isVideo ? 'bg-red-600' : 'bg-gray-600'
                                    }`}>
                                      {isImage ? 'IMG' : isVideo ? 'VID' : 'FILE'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setViewingBidDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorPortal;