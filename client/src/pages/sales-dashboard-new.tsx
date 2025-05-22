import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StatsCard } from "@/components/stats-card";
import ProfileEditForm from "@/components/profile-edit-form";
import { 
  formatCurrency, 
  getInitials, 
  getStatusColor
} from "@/lib/utils";
import { 
  UserCheck, 
  Percent, 
  DollarSign, 
  Building,
  Search, 
  Bell,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  PhoneCall,
  Clock,
  Briefcase,
  Phone,
  Star,
  ArrowUpRight,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedBidRequest, setSelectedBidRequest] = useState<any>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Get salesperson data
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  const salespersonData = userData?.roleData;

  // Get analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<any>({
    queryKey: ["/api/salespersons", salespersonData?.id, "analytics"],
    enabled: !!salespersonData?.id
  });

  // Get bid requests
  const { data: bidRequestsData, isLoading: isLoadingBidRequests } = useQuery<any>({
    queryKey: ["/api/salespersons", salespersonData?.id, "bid-requests"],
    enabled: !!salespersonData?.id
  });
  
  // Get contractors data
  const { data: contractorsData, isLoading: isLoadingContractors } = useQuery<any>({
    queryKey: ["/api/contractors"],
    enabled: true
  });
  
  // Update bid request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return apiRequest(`/api/bid-requests/${id}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The bid request status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons", salespersonData?.id, "bid-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Add notes mutation
  const addNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes: string }) => {
      return apiRequest(`/api/bid-requests/${id}/notes`, "PATCH", { notes });
    },
    onSuccess: () => {
      toast({
        title: "Notes saved",
        description: "Your notes have been successfully saved.",
      });
      setNoteInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons", salespersonData?.id, "bid-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper functions for the dashboard
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'contacted':
        return <PhoneCall className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  const handleNoteSubmit = (id: number) => {
    if (!noteInput.trim()) {
      toast({
        title: "Error",
        description: "Notes cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    addNotesMutation.mutate({ id, notes: noteInput });
  };

  // Render the appropriate content based on the current URL path
  const renderContent = () => {
    // Extract the path to determine which content to show
    const path = location.split('/')[2] || '';
    
    if (showProfileEdit) {
      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Edit Profile</h1>
            <Button variant="outline" onClick={() => setShowProfileEdit(false)}>
              Return to Dashboard
            </Button>
          </div>
          <ProfileEditForm 
            userData={userData}
            roleData={salespersonData}
            userType="salesperson"
            onSuccess={() => {
              setShowProfileEdit(false);
              queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
              toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
              });
            }}
          />
        </div>
      );
    }
    
    switch (path) {
      case 'contractors':
        return renderContractorsContent();
      case 'bid-requests':
        return renderBidRequestsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardOverview();
    }
  };
  
  // Dashboard overview content
  const renderDashboardOverview = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowProfileEdit(true)}
            >
              Edit Profile
            </Button>
            <div className="relative">
              <Input
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {bidRequestsData?.bidRequests?.filter((req: any) => req.status === 'pending').length || 0}
              </span>
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-grid mb-8">
          <StatsCard
            title="Total Leads"
            value={analyticsData?.analytics?.conversions || salespersonData?.totalLeads || 0}
            trend={{ value: "12.3% this month", positive: true }}
            icon={UserCheck}
            iconBgColor="bg-primary-50"
            iconColor="text-primary"
            chart={
              <div className="h-10 flex items-end space-x-1">
                <div className="w-1 h-3 bg-primary/20 rounded-t"></div>
                <div className="w-1 h-4 bg-primary/30 rounded-t"></div>
                <div className="w-1 h-6 bg-primary/50 rounded-t"></div>
                <div className="w-1 h-8 bg-primary/60 rounded-t"></div>
                <div className="w-1 h-10 bg-primary rounded-t"></div>
              </div>
            }
          />
          <StatsCard
            title="Conversion Rate"
            value={analyticsData?.analytics?.conversionRate + "%" || salespersonData?.conversionRate + "%" || "0%"}
            trend={{ value: "3.2% this month", positive: true }}
            icon={Percent}
            iconBgColor="bg-green-50"
            iconColor="text-green-500"
            chart={
              <div className="grid grid-cols-4 gap-1 w-20">
                <div className="h-2 bg-green-500/20 rounded"></div>
                <div className="h-2 bg-green-500/40 rounded"></div>
                <div className="h-2 bg-green-500/60 rounded"></div>
                <div className="h-2 bg-green-500 rounded"></div>
                <div className="h-2 bg-green-500/20 rounded"></div>
                <div className="h-2 bg-green-500/40 rounded"></div>
                <div className="h-2 bg-green-500/60 rounded"></div>
                <div className="h-2 bg-green-500 rounded"></div>
              </div>
            }
          />
          <StatsCard
            title="Page Visits"
            value={analyticsData?.analytics?.totalVisits || 0}
            trend={{ value: "8.1% this month", positive: true }}
            icon={UserCheck}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-500"
            chart={
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-full border-4 border-amber-500/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-amber-500">+8.1%</span>
                </div>
              </div>
            }
          />
          <StatsCard
            title="Active Projects"
            value={salespersonData?.activeProjects || 0}
            trend={{ value: "Same as last month", positive: false }}
            icon={Building}
            iconBgColor="bg-secondary-50"
            iconColor="text-secondary"
            chart={
              <div className="flex flex-col space-y-1">
                <div className="flex space-x-1">
                  <div className="h-3 w-8 bg-secondary/20 rounded"></div>
                  <div className="h-3 w-4 bg-secondary/40 rounded"></div>
                </div>
                <div className="flex space-x-1">
                  <div className="h-3 w-6 bg-secondary/60 rounded"></div>
                  <div className="h-3 w-4 bg-secondary/80 rounded"></div>
                </div>
                <div className="flex space-x-1">
                  <div className="h-3 w-10 bg-secondary rounded"></div>
                  <div className="h-3 w-2 bg-secondary/50 rounded"></div>
                </div>
              </div>
            }
          />
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Bid Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBidRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : bidRequestsData?.bidRequests && bidRequestsData.bidRequests.length > 0 ? (
                <div className="space-y-4">
                  {bidRequestsData.bidRequests.slice(0, 5).map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-muted p-2 mr-3">
                          {getStatusIcon(request.status)}
                        </div>
                        <div>
                          <p className="font-medium">{request.homeownerName}</p>
                          <p className="text-xs text-muted-foreground">{request.serviceType}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(request.status).bg} ${getStatusColor(request.status).text}`}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No recent bid requests</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Featured Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingContractors ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : contractorsData?.contractors && contractorsData.contractors.length > 0 ? (
                <div className="space-y-4">
                  {contractorsData.contractors.slice(0, 3).map((contractor: any) => (
                    <div key={contractor.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={contractor.logoUrl || ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(contractor.companyName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contractor.companyName}</p>
                          <p className="text-xs text-muted-foreground">{contractor.serviceTypes?.join(", ")}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        Refer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No featured contractors</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  };
  
  // Contractors content
  const renderContractorsContent = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Partner Contractors</h1>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search contractors..."
              className="w-60"
            />
            <Button variant="outline" size="sm" className="h-9">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingContractors ? (
            <Card className="col-span-full">
              <CardContent className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : contractorsData?.contractors?.length > 0 ? (
            contractorsData.contractors.map((contractor: any) => (
              <Card key={contractor.id} className="overflow-hidden">
                <div className="h-32 bg-primary/10 relative">
                  {contractor.featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white border-0">
                        Preferred Partner
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <Avatar className="h-14 w-14 border-4 border-background -mt-10 mr-3">
                      <AvatarImage src={contractor.logoUrl || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(contractor.companyName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{contractor.companyName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {contractor.serviceTypes?.join(", ") || "General Contractor"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 justify-between text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="font-medium">{contractor.rating || "4.5"}</span>
                      <span className="text-muted-foreground ml-1">({contractor.reviewCount || "42"} reviews)</span>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {contractor.businessType || "Residential"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" className="text-xs">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      Refer Lead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No contractors found</h3>
                <p className="text-muted-foreground text-sm">There are no contractors available at the moment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  };
  
  // Bid Requests content
  const renderBidRequestsContent = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Bid Requests</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bid Requests List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">All Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBidRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : bidRequestsData?.bidRequests && bidRequestsData.bidRequests.length > 0 ? (
                <div className="divide-y">
                  {bidRequestsData.bidRequests.map((request: any) => (
                    <div 
                      key={request.id} 
                      className={`py-3 cursor-pointer transition-colors hover:bg-muted/50 ${selectedBidRequest?.id === request.id ? 'bg-muted/50' : ''}`}
                      onClick={() => setSelectedBidRequest(request)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="rounded-full h-2 w-2 mr-2" style={{
                              backgroundColor: 
                                request.status === 'pending' ? 'orange' : 
                                request.status === 'completed' ? 'green' : 
                                request.status === 'declined' ? 'red' : 'gray'
                            }}></div>
                            <p className="font-medium">{request.homeownerName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{request.serviceType}</p>
                        </div>
                        <Badge className={`${getStatusColor(request.status).bg} ${getStatusColor(request.status).text}`}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No bid requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Bid Request Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBidRequest ? (
                <div className="space-y-4">
                  {/* Request info */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Homeowner</p>
                        <p className="font-medium">{selectedBidRequest.homeownerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <p className="font-medium">{selectedBidRequest.homeownerEmail}</p>
                        <p className="font-medium">{selectedBidRequest.homeownerPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service Type</p>
                        <p className="font-medium">{selectedBidRequest.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(selectedBidRequest.status).bg} ${getStatusColor(selectedBidRequest.status).text}`}>
                          {selectedBidRequest.status}
                        </Badge>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedBidRequest.address}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p>{selectedBidRequest.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={selectedBidRequest.status === 'pending' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedBidRequest.id, 'pending')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </Button>
                      <Button 
                        variant={selectedBidRequest.status === 'contacted' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedBidRequest.id, 'contacted')}
                      >
                        <PhoneCall className="h-4 w-4 mr-1" />
                        Contacted
                      </Button>
                      <Button 
                        variant={selectedBidRequest.status === 'completed' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedBidRequest.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Button>
                      <Button 
                        variant={selectedBidRequest.status === 'declined' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedBidRequest.id, 'declined')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Declined
                      </Button>
                    </div>
                  </div>
                  
                  {/* Notes section */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Notes</h3>
                    <Textarea 
                      placeholder="Add notes about this bid request..."
                      className="min-h-[100px] mb-2"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                    <Button onClick={() => handleNoteSubmit(selectedBidRequest.id)}>
                      Save Notes
                    </Button>
                  </div>
                  
                  {selectedBidRequest.notes && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Previous Notes</h3>
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-sm whitespace-pre-wrap">{selectedBidRequest.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Select a bid request to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  };
  
  // Settings content
  const renderSettingsContent = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Account Settings</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    placeholder="Your full name" 
                    value={userData?.fullName || ""} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="Your email" 
                    value={userData?.email || ""} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    placeholder="Your phone number" 
                    value={salespersonData?.phone || "(555) 123-4567"} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input 
                    placeholder="Your job title" 
                    value={salespersonData?.jobTitle || "Sales Representative"} 
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button>
                  Save Changes
                </Button>
              </div>
            </div>
            
            {/* Profile Settings Section */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                    <label className="text-sm font-medium">Profile URL</label>
                    <div className="flex mt-1">
                      <div className="bg-muted px-3 py-2 text-sm rounded-l-md border border-r-0 text-muted-foreground">
                        {window.location.origin}/s/
                      </div>
                      <Input 
                        className="rounded-l-none" 
                        value={salespersonData?.profileUrl || "alexneilson"} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is your unique profile URL for your digital business card
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">NFC Badge ID</label>
                    <Input value={salespersonData?.nfcId || "SP12345"} disabled />
                    <p className="text-xs text-muted-foreground">
                      Your unique NFC badge identifier
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Profile Picture</label>
                  <div className="mt-1 flex items-center">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage src={userData?.avatarUrl || ""} />
                      <AvatarFallback className="text-lg">
                        {getInitials(userData?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline">
                      Change Picture
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button>
                  Save Profile
                </Button>
              </div>
            </div>
            
            {/* Password Section */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Password & Security</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="mt-4">
                <Button>
                  Update Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
}