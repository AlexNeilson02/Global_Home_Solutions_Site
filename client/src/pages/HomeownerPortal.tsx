import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  User, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BidRequest {
  id: number;
  createdAt: string;
  contractorId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  servicesRequested: string[];
  description: string;
  timeline: string;
  budget?: string;
  preferredContactMethod: string;
  status: string;
  lastUpdated?: string;
  contractor?: {
    id: number;
    companyName: string;
    description: string;
    ownerName?: string;
    phone?: string;
    email?: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: string;
  avatarUrl?: string;
}

const HomeownerPortal: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Fetch current user data
  const { data: userData, isLoading: userLoading } = useQuery<{user: User, roleData?: any}>({
    queryKey: ['/api/users/me']
  });

  const user = userData?.user;

  // Fetch homeowner's bid requests
  const { data: bidRequestsData, isLoading: bidsLoading } = useQuery<{bidRequests: BidRequest[]}>({
    queryKey: ['/api/homeowners/bid-requests'],
    enabled: !!user
  });

  const bidRequests = bidRequestsData?.bidRequests || [];

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiRequest("PATCH", "/api/homeowners/profile", profileData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (user && !isEditingProfile) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user, isEditingProfile]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'contacted': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const recentBids = bidRequests.slice(0, 3);
  const completedBids = bidRequests.filter(bid => bid.status === 'completed').length;
  const activeBids = bidRequests.filter(bid => ['pending', 'contacted'].includes(bid.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Homeowner Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.fullName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bid Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bidRequests.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All time requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeBids}</div>
                  <p className="text-xs text-muted-foreground">
                    In progress or pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedBids}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully finished
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bids */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bid Requests</CardTitle>
                <CardDescription>
                  Your latest service requests and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentBids.length > 0 ? (
                  <div className="space-y-4">
                    {recentBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{bid.contractor?.companyName || 'Contractor'}</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {bid.servicesRequested.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(bid.status)} flex items-center space-x-1`}>
                          {getStatusIcon(bid.status)}
                          <span className="capitalize">{bid.status}</span>
                        </Badge>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('bids')}
                        className="w-full"
                      >
                        View All Bids
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No bid requests yet</p>
                    <p className="text-sm text-gray-400">
                      Start by browsing contractors and requesting quotes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Manage your personal information and contact details
                    </CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Address</label>
                        <Input
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        disabled={profileMutation.isPending}
                      >
                        {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          // Reset form to original values
                          setProfileForm({
                            fullName: user.fullName || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            address: user.address || ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Full Name</p>
                            <p className="text-gray-900">{user.fullName || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Email</p>
                            <p className="text-gray-900">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Phone</p>
                            <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Address</p>
                            <p className="text-gray-900">{user.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Bids Tab */}
          <TabsContent value="bids" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Bid Requests</CardTitle>
                <CardDescription>
                  Track all your service requests and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : bidRequests.length > 0 ? (
                  <div className="space-y-4">
                    {bidRequests.map((bid) => (
                      <div key={bid.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-5 w-5 text-gray-500" />
                              <h3 className="font-semibold text-lg">
                                {bid.contractor?.companyName || 'Contractor'}
                              </h3>
                            </div>
                            <Badge className={`${getStatusColor(bid.status)} flex items-center space-x-1 w-fit`}>
                              {getStatusIcon(bid.status)}
                              <span className="capitalize">{bid.status}</span>
                            </Badge>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>Requested: {new Date(bid.createdAt).toLocaleDateString()}</p>
                            {bid.lastUpdated && (
                              <p>Updated: {new Date(bid.lastUpdated).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Services Requested</p>
                            <p className="text-gray-900">{bid.servicesRequested.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Timeline</p>
                            <p className="text-gray-900">{bid.timeline}</p>
                          </div>
                          {bid.budget && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Budget</p>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <p className="text-gray-900">{bid.budget}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Contact Method</p>
                            <p className="text-gray-900 capitalize">{bid.preferredContactMethod}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Project Description</p>
                          <p className="text-gray-900 text-sm">{bid.description}</p>
                        </div>

                        {bid.contractor && (
                          <Separator className="my-4" />
                        )}
                        
                        {bid.contractor && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-700 mb-2">Contractor Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <p><span className="font-medium">Company:</span> {bid.contractor.companyName}</p>
                              {bid.contractor.ownerName && (
                                <p><span className="font-medium">Owner:</span> {bid.contractor.ownerName}</p>
                              )}
                              {bid.contractor.phone && (
                                <p><span className="font-medium">Phone:</span> {bid.contractor.phone}</p>
                              )}
                              {bid.contractor.email && (
                                <p><span className="font-medium">Email:</span> {bid.contractor.email}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bid requests yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start by browsing our contractors and requesting quotes for your home improvement projects.
                    </p>
                    <Button onClick={() => navigate("/services")}>
                      Browse Services
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HomeownerPortal;