import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NfcBadge } from "@/components/nfc-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QRCodeDisplay } from "@/components/qr-code-display";
import ProfileEditForm from "@/components/profile-edit-form";
import { 
  formatCurrency, 
  getInitials, 
  getStatusColor,
  formatPercentage,
  timeAgo
} from "@/lib/utils";
import { 
  UserCheck, 
  Percent, 
  DollarSign, 
  Building,
  Search, 
  Bell,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  MoveUp,
  LineChart,
  CheckCircle,
  XCircle,
  PhoneCall,
  Clock,
  ClipboardList,
  Plus,
  Users,
  Briefcase,
  Settings,
  Mail,
  Phone,
  ArrowUpRight,
  CreditCard,
  FileText,
  BarChart3,
  PieChart,
  UserCog,
  Star
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedBidRequest, setSelectedBidRequest] = useState<any>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [localProfileData, setLocalProfileData] = useState<any>(null);

  // Get salesperson data
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  // Use local data if available (for when we're having API issues)
  const [localUserData, setLocalUserData] = useState<any>(null);
  
  // On component mount, try to load data from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setLocalUserData(parsedData);
      }
    } catch (error) {
      console.error("Error loading profile from localStorage:", error);
    }
  }, []);
  
  // Merge data from server and local storage, preferring local updates if available
  const effectiveUserData = localUserData || userData;
  const salespersonData = effectiveUserData?.roleData;

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
  
  // Get leads/projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<any>({
    queryKey: ["/api/projects"],
    enabled: !!user
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {showProfileEdit ? (
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
              onSuccess={(updatedData) => {
                // Store the updated profile data in local state
                setLocalProfileData(updatedData);
                setShowProfileEdit(false);
                // Try to invalidate queries, but this might not work if not authenticated
                queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
              }}
            />
          </div>
        ) : (
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
            
            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
              <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="leads">My Leads</TabsTrigger>
                <TabsTrigger value="bid-requests">Bid Requests</TabsTrigger>
                <TabsTrigger value="contractors">Contractors</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                {/* Stats Overview */}
                <div className="stats-grid mb-8">
                  <StatsCard
                    title="Total Leads"
                    value={analyticsData?.analytics?.conversions || salespersonData?.totalLeads || 0}
                    trend={{ value: "12.3% this month", positive: true }}
                    icon={UserCheck}
                    iconBgColor="bg-primary-50 dark:bg-primary/10"
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
                    value={formatPercentage(analyticsData?.analytics?.conversionRate || salespersonData?.conversionRate || 0)}
                    trend={{ value: "3.2% this month", positive: true }}
                    icon={Percent}
                    iconBgColor="bg-green-50 dark:bg-green-500/10"
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
                    icon={MoveUp}
                    iconBgColor="bg-amber-50 dark:bg-amber-500/10"
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
                    iconBgColor="bg-secondary-50 dark:bg-secondary/10"
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
                
                {/* NFC Profile and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* NFC Profile */}
                  <Card className="lg:col-span-1">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center mb-4">
                        <div className="relative">
                          <Avatar className="h-20 w-20 mb-2">
                            <AvatarImage src={effectiveUserData?.avatarUrl || undefined} />
                            <AvatarFallback className="text-lg">
                              {getInitials(effectiveUserData?.fullName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <NfcBadge className="absolute -bottom-1 -right-1" />
                        </div>
                        <h3 className="text-lg font-medium mt-2">{effectiveUserData?.fullName}</h3>
                        <p className="text-muted-foreground text-sm">Sales Representative</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">Unique Visitors</p>
                          <p className="text-2xl font-semibold mt-1">
                            {analyticsData?.visitStats?.uniqueVisitors || 0}
                          </p>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-xs">Last Scan</p>
                          <p className="text-sm font-medium mt-1">
                            {salespersonData?.lastScanned ? 
                              timeAgo(new Date(salespersonData.lastScanned)) : 
                              "Never"
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Your NFC URL</p>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            Refresh
                          </Button>
                        </div>
                        
                        <div className="flex items-center">
                          <Input 
                            value={`${window.location.origin}/s/${salespersonData?.profileUrl || ""}`}
                            readOnly
                            className="text-xs"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 h-10"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/s/${salespersonData?.profileUrl || ""}`);
                              toast({
                                title: "URL Copied",
                                description: "Your profile link has been copied to clipboard.",
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        
                        {/* QR Code Section */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Your QR Code</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/salespersons", salespersonData?.id, "qrcode"] });
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Refresh
                            </Button>
                          </div>
                          
                          {/* Use current salesperson's profile URL for QR code */}
                          <QRCodeDisplay 
                            salespersonId={salespersonData?.id} 
                            profileUrl={salespersonData?.profileUrl || "profile"}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Bid Requests */}
                  <Card className="lg:col-span-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Recent Bid Requests</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTab("bid-requests")}
                        >
                          View All
                        </Button>
                      </div>
                      
                      {isLoadingBidRequests ? (
                        <div className="flex items-center justify-center h-52">
                          <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Loading bid requests...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bidRequestsData?.bidRequests?.slice(0, 4).map((request: any) => (
                            <div 
                              key={request.id} 
                              className="p-4 border rounded-lg transition-colors hover:border-accent-foreground/20"
                              onClick={() => {
                                setSelectedBidRequest(request);
                                setSelectedTab("bid-requests");
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-medium">{request.customerName}</h4>
                                  <p className="text-xs text-muted-foreground">{request.serviceNeeded}</p>
                                </div>
                                <Badge variant={getStatusColor(request.status)}>
                                  <span className="flex items-center">
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1 capitalize">{request.status}</span>
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="bid-requests">
                {/* Bid Requests Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Bid Requests</CardTitle>
                        <CardDescription>Manage your bid requests from customers</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingBidRequests ? (
                          <div className="flex items-center justify-center h-52">
                            <div className="text-center">
                              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                              <p className="text-sm text-muted-foreground mt-2">Loading bid requests...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bidRequestsData?.bidRequests?.map((request: any) => (
                              <div 
                                key={request.id} 
                                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                  selectedBidRequest?.id === request.id 
                                    ? 'border-primary bg-primary/5' 
                                    : 'hover:border-accent-foreground/20'
                                }`}
                                onClick={() => setSelectedBidRequest(request)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-sm font-medium">{request.customerName}</h4>
                                    <p className="text-xs text-muted-foreground">{request.serviceNeeded}</p>
                                  </div>
                                  <Badge variant={getStatusColor(request.status)}>
                                    <span className="flex items-center">
                                      {getStatusIcon(request.status)}
                                      <span className="ml-1 capitalize">{request.status}</span>
                                    </span>
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {selectedBidRequest ? "Bid Request Details" : "Select a bid request"}
                        </CardTitle>
                        <CardDescription>
                          {selectedBidRequest 
                            ? `Request from ${selectedBidRequest.customerName} for ${selectedBidRequest.serviceNeeded}` 
                            : "Select a bid request from the list to view details"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedBidRequest ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Customer Information</h4>
                                <div className="mt-2 space-y-2">
                                  <p className="text-sm"><span className="font-medium">Name:</span> {selectedBidRequest.customerName}</p>
                                  <p className="text-sm"><span className="font-medium">Phone:</span> {selectedBidRequest.customerPhone}</p>
                                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedBidRequest.customerEmail}</p>
                                  <p className="text-sm"><span className="font-medium">Location:</span> {selectedBidRequest.location}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Request Details</h4>
                                <div className="mt-2 space-y-2">
                                  <p className="text-sm"><span className="font-medium">Service:</span> {selectedBidRequest.serviceNeeded}</p>
                                  <p className="text-sm"><span className="font-medium">Budget:</span> {formatCurrency(selectedBidRequest.budget)}</p>
                                  <p className="text-sm"><span className="font-medium">Timeline:</span> {selectedBidRequest.timeline}</p>
                                  <p className="text-sm"><span className="font-medium">Date Created:</span> {new Date(selectedBidRequest.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                              <p className="text-sm p-3 bg-muted/50 rounded-md">
                                {selectedBidRequest.description || "No description provided"}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                              <Textarea 
                                placeholder="Add notes about this bid request..."
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <Button 
                                size="sm" 
                                className="mt-2"
                                onClick={() => handleNoteSubmit(selectedBidRequest.id)}
                                disabled={addNotesMutation.isPending}
                              >
                                {addNotesMutation.isPending ? "Saving..." : "Save Notes"}
                              </Button>
                              {selectedBidRequest.notes && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                  <p className="text-sm font-medium">Previous Notes:</p>
                                  <p className="text-sm mt-1">{selectedBidRequest.notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Update Status</h4>
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  variant={selectedBidRequest.status === "pending" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(selectedBidRequest.id, "pending")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Pending
                                </Button>
                                <Button 
                                  variant={selectedBidRequest.status === "contacted" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(selectedBidRequest.id, "contacted")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <PhoneCall className="h-4 w-4 mr-1" />
                                  Contacted
                                </Button>
                                <Button 
                                  variant={selectedBidRequest.status === "completed" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(selectedBidRequest.id, "completed")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Completed
                                </Button>
                                <Button 
                                  variant={selectedBidRequest.status === "declined" ? "destructive" : "outline"} 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(selectedBidRequest.id, "declined")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Declined
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Select a bid request to view details</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="leads" className="pt-4">
                {/* My Leads Content */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">My Leads</CardTitle>
                      <Button size="sm" className="h-8">
                        <Plus className="h-4 w-4 mr-1" /> New Lead
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingProjects ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : projectsData?.projects && projectsData.projects.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Project Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date Added</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectsData.projects.map((project: any) => (
                                <tr key={project.id} className="border-b hover:bg-muted/50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarFallback>{getInitials(project.homeownerName)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{project.homeownerName}</p>
                                        <p className="text-xs text-muted-foreground">{project.address}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">{project.serviceType}</td>
                                  <td className="px-4 py-3 text-sm">{new Date(project.createdAt).toLocaleDateString()}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={getStatusColor(project.status)}>
                                      {project.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-1">No leads yet</h3>
                          <p className="text-muted-foreground text-sm">Start adding your first lead or check back later</p>
                          <Button className="mt-4">
                            <Plus className="h-4 w-4 mr-1" /> Add New Lead
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="contractors" className="pt-4">
                {/* Contractors Tab Content */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">Partner Contractors</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Search contractors..."
                          className="w-60"
                        />
                        <Button variant="outline" size="sm" className="h-9">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                        {/* Contractor Cards */}
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Card key={i} className="overflow-hidden">
                            <div className="h-32 bg-primary/10 relative">
                              {i % 2 === 0 && <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500 text-white">
                                  Preferred Partner
                                </Badge>
                              </div>}
                            </div>
                            <CardContent className="pt-4">
                              <div className="flex items-center">
                                <Avatar className="h-14 w-14 border-4 border-background -mt-10 mr-3">
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {String.fromCharCode(65 + i)}C
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">{["Premier Roofing", "All Seasons HVAC", "Green Earth Solar", "Modern Floors", "Elite Kitchens", "Backyard Pools"][i]}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {["Roofing Specialists", "Heating & Cooling", "Solar Installation", "Flooring Services", "Kitchen Remodeling", "Pool Installation"][i]}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center mt-4 justify-between text-sm">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-amber-500 mr-1" />
                                  <span className="font-medium">{(4 + (i % 2) * 0.5).toFixed(1)}</span>
                                  <span className="text-muted-foreground ml-1">({40 + i * 12} reviews)</span>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {["Residential", "Commercial", "Both"][i % 3]}
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
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="pt-4">
                {/* Schedule Tab Content */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">My Schedule</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Today
                        </Button>
                        <Button variant="outline" size="sm">
                          This Week
                        </Button>
                        <Button variant="outline" size="sm">
                          This Month
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border mt-2">
                        <div className="grid grid-cols-7 text-sm font-medium bg-muted">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                            <div key={i} className="py-2 text-center">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 text-sm">
                          {Array.from({ length: 35 }).map((_, i) => {
                            const isToday = i === 16;
                            const hasEvent = [11, 16, 17, 22, 24, 26].includes(i);
                            return (
                              <div key={i} className={`min-h-[100px] p-1 border-t border-r ${isToday ? 'bg-primary/5' : ''}`}>
                                <div className="flex justify-between">
                                  <span className={`text-xs p-1 ${isToday ? 'font-bold' : ''}`}>
                                    {(i % 31) + 1}
                                  </span>
                                  {isToday && (
                                    <span className="h-4 w-4 rounded-full bg-primary"></span>
                                  )}
                                </div>
                                {hasEvent && (
                                  <div className={`text-xs p-1 mt-1 rounded-md ${i === 16 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {i === 11 && "9:00 AM - Site Visit"}
                                    {i === 16 && "11:30 AM - Client Meeting"}
                                    {i === 17 && "2:00 PM - Follow-up Call"}
                                    {i === 22 && "10:00 AM - Home Expo"}
                                    {i === 24 && "3:30 PM - Contractor Mtg"}
                                    {i === 26 && "1:00 PM - Team Meeting"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="commissions" className="pt-4">
                {/* Commissions Tab Content */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-primary mr-2" />
                          <div>
                            <p className="text-3xl font-bold">{formatCurrency(12850)}</p>
                            <p className="text-sm text-muted-foreground">This year</p>
                          </div>
                        </div>
                        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '68%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">68% of annual target</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Pending Commissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <CreditCard className="h-8 w-8 text-amber-500 mr-2" />
                          <div>
                            <p className="text-3xl font-bold">{formatCurrency(3450)}</p>
                            <p className="text-sm text-muted-foreground">To be paid</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-1">
                          <div className="text-center p-1 bg-muted rounded-md">
                            <p className="text-xl font-semibold">{formatCurrency(1200)}</p>
                            <p className="text-xs text-muted-foreground">This month</p>
                          </div>
                          <div className="text-center p-1 bg-muted rounded-md">
                            <p className="text-xl font-semibold">{formatCurrency(2250)}</p>
                            <p className="text-xs text-muted-foreground">Next month</p>
                          </div>
                          <div className="text-center p-1 bg-muted rounded-md">
                            <p className="text-xl font-semibold">4</p>
                            <p className="text-xs text-muted-foreground">Projects</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Commission Rates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                              <span className="text-sm">Roofing</span>
                            </div>
                            <span className="font-semibold">8%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                              <span className="text-sm">Solar</span>
                            </div>
                            <span className="font-semibold">10%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                              <span className="text-sm">HVAC</span>
                            </div>
                            <span className="font-semibold">7%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                              <span className="text-sm">Kitchen</span>
                            </div>
                            <span className="font-semibold">6%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                              <span className="text-sm">Bathroom</span>
                            </div>
                            <span className="font-semibold">6%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="pt-4">
                {/* Settings Tab Content */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Manage your account preferences and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Personal Information Section */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input 
                              placeholder="Your full name" 
                              value={effectiveUserData?.fullName || ""} 
                              disabled 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input 
                              type="email" 
                              placeholder="Your email" 
                              value={effectiveUserData?.email || ""} 
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
                                <AvatarImage src={effectiveUserData?.avatarUrl || undefined} />
                                <AvatarFallback className="text-lg">
                                  {getInitials(effectiveUserData?.fullName || "")}
                                </AvatarFallback>
                              </Avatar>
                              <Button variant="outline">
                                Change Picture
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics">
                {/* Analytics Content */}
                <div className="grid grid-cols-1 gap-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sales Performance</CardTitle>
                      <CardDescription>Your sales metrics and conversion analytics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-60">
                        <div className="text-center">
                          <LineChart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Daily visit chart would appear here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}