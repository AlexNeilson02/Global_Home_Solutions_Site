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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Home, 
  FileText, 
  User, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit3,
  Star,
  Building2,
  Settings,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BidRequestForm from "@/components/BidRequestForm";

export default function HomeownerPortal() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [preSelectedService, setPreSelectedService] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle URL parameters for tab switching and service selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const service = urlParams.get('service');
    
    if (tab && ['dashboard', 'bid-requests', 'contractors', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (service) {
      setPreSelectedService(decodeURIComponent(service));
      setActiveTab('contractors'); // Switch to contractors tab when service is pre-selected
    }
  }, []);

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
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as const;

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  // Get current user data
  const { data: userData, isLoading: userLoading } = useQuery<{user: any, roleData: any}>({
    queryKey: ['/api/users/me'],
    enabled: true
  });

  const user = userData?.user || {};

  // Get homeowner's bid requests
  const { data: bidRequestsData, isLoading: bidRequestsLoading, refetch: refetchBidRequests } = useQuery<{bidRequests: any[]}>({
    queryKey: ['/api/homeowner/bid-requests'],
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get contractors data
  const { data: contractorsData } = useQuery<{contractors: any[]}>({
    queryKey: ['/api/contractors'],
    enabled: true
  });

  // Get service categories
  const { data: serviceCategoriesData } = useQuery<{services: any[]}>({
    queryKey: ['/api/service-categories'],
    enabled: true
  });

  const bidRequests = bidRequestsData?.bidRequests || [];
  const contractors = contractorsData?.contractors || [];
  const serviceCategories = serviceCategoriesData?.services || [];

  // Initialize profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

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
      navigate('/');
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been successfully updated.",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleBackToPortals = () => {
    logoutMutation.mutate();
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleRequestBid = (contractor: any) => {
    setSelectedContractor(contractor);
    setShowBidForm(true);
  };

  const handleCloseBidForm = () => {
    setShowBidForm(false);
    setSelectedContractor(null);
    refetchBidRequests(); // Refresh bid requests after submission
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalBidRequests: bidRequests.length,
    pendingBids: bidRequests.filter(bid => bid.status === 'pending').length,
    activeBids: bidRequests.filter(bid => bid.status === 'sent' || bid.status === 'contacted').length,
    completedBids: bidRequests.filter(bid => bid.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'sent': return <Mail className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={antiYellowStyles}>
      {/* Header */}
      <div className="bg-white border-b" style={antiYellowStyles}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Homeowner Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.fullName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleBackToPortals} variant="outline" style={antiYellowStyles}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" style={antiYellowStyles}>
            <TabsTrigger value="dashboard" style={antiYellowStyles}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="bid-requests" style={antiYellowStyles}>
              <FileText className="w-4 h-4 mr-2" />
              My Bid Requests
            </TabsTrigger>
            <TabsTrigger value="contractors" style={antiYellowStyles}>
              <Users className="w-4 h-4 mr-2" />
              Find Contractors
            </TabsTrigger>
            <TabsTrigger value="profile" style={antiYellowStyles}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalBidRequests}</div>
                  <p className="text-xs text-muted-foreground">All time bid requests</p>
                </CardContent>
              </Card>

              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingBids}</div>
                  <p className="text-xs text-muted-foreground">Awaiting contractor response</p>
                </CardContent>
              </Card>

              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.activeBids}</div>
                  <p className="text-xs text-muted-foreground">In progress conversations</p>
                </CardContent>
              </Card>

              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.completedBids}</div>
                  <p className="text-xs text-muted-foreground">Successfully completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bid Requests */}
            <Card style={antiYellowStyles}>
              <CardHeader>
                <CardTitle>Recent Bid Requests</CardTitle>
                <CardDescription>Your latest service requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {bidRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : bidRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No bid requests yet. Start by requesting quotes from contractors!</p>
                    <Button
                      onClick={() => setActiveTab('contractors')}
                      className="mt-4"
                      style={antiYellowStyles}
                    >
                      Find Contractors
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bidRequests.slice(0, 5).map((bid: any) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg" style={antiYellowStyles}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{bid.servicesRequested?.join(', ') || 'Service Request'}</h3>
                            <Badge className={getStatusColor(bid.status)}>
                              {getStatusIcon(bid.status)}
                              <span className="ml-1 capitalize">{bid.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{bid.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" style={antiYellowStyles}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {bidRequests.length > 5 && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('bid-requests')}
                          style={antiYellowStyles}
                        >
                          View All Requests
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bid Requests Tab */}
          <TabsContent value="bid-requests" className="space-y-6">
            <Card style={antiYellowStyles}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Bid Requests</CardTitle>
                    <CardDescription>Track and manage all your service requests</CardDescription>
                  </div>
                  <Button
                    onClick={() => setActiveTab('contractors')}
                    style={antiYellowStyles}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bidRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : bidRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No bid requests yet. Start by requesting quotes from contractors!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bidRequests.map((bid: any) => (
                      <Card key={bid.id} style={antiYellowStyles}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold">{bid.servicesRequested?.join(', ') || 'Service Request'}</h3>
                                <Badge className={getStatusColor(bid.status)}>
                                  {getStatusIcon(bid.status)}
                                  <span className="ml-1 capitalize">{bid.status}</span>
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{bid.description}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-gray-700">Timeline</p>
                                  <p className="text-gray-600">{bid.timeline}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Budget</p>
                                  <p className="text-gray-600">{bid.budget || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Contact Method</p>
                                  <p className="text-gray-600 capitalize">{bid.preferredContactMethod}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Requested</p>
                                  <p className="text-gray-600">{new Date(bid.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {bid.notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-700 mb-1">Notes:</p>
                              <p className="text-gray-600 text-sm">{bid.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contractors Tab */}
          <TabsContent value="contractors" className="space-y-6">
            <Card style={antiYellowStyles}>
              <CardHeader>
                <CardTitle>Find Contractors</CardTitle>
                <CardDescription>Browse qualified contractors and request quotes for your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contractors.map((contractor: any) => (
                    <Card key={contractor.id} style={antiYellowStyles}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          {contractor.logoUrl ? (
                            <img
                              src={contractor.logoUrl}
                              alt={contractor.companyName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">{contractor.companyName}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              4.8 (12 reviews)
                            </div>
                          </div>
                        </div>
                        
                        {contractor.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{contractor.description}</p>
                        )}
                        
                        {contractor.specialties && contractor.specialties.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                            <div className="flex flex-wrap gap-1">
                              {contractor.specialties.slice(0, 3).map((specialty: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {contractor.specialties.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{contractor.specialties.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleRequestBid(contractor)}
                            className="flex-1"
                            style={antiYellowStyles}
                          >
                            Request Quote
                          </Button>
                          <Button variant="outline" size="sm" style={antiYellowStyles}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card style={antiYellowStyles}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your personal information and preferences</CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    variant="outline"
                    style={antiYellowStyles}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                        style={antiYellowInputStyles}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        style={antiYellowInputStyles}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        style={antiYellowInputStyles}
                        disabled
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={updateProfileMutation.isPending}
                        style={antiYellowStyles}
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={() => setIsEditingProfile(false)}
                        variant="outline"
                        style={antiYellowStyles}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <p className="text-gray-900">{user.fullName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <p className="text-gray-900">{user.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <Badge variant="secondary">Homeowner</Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                        <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bid Request Form Modal */}
      {showBidForm && selectedContractor && (
        <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={antiYellowStyles}>
            <DialogHeader>
              <DialogTitle>Request Quote from {selectedContractor.companyName}</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a quote for your project.
              </DialogDescription>
            </DialogHeader>
            <BidRequestForm
              contractor={selectedContractor}
              onClose={handleCloseBidForm}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}