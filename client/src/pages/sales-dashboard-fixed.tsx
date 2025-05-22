import { useState } from "react";
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
  ClipboardList
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
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bid-requests">Bid Requests</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                            <AvatarImage src={user?.avatarUrl || undefined} />
                            <AvatarFallback className="text-lg">
                              {getInitials(user?.fullName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <NfcBadge className="absolute -bottom-1 -right-1" />
                        </div>
                        <h3 className="text-lg font-medium mt-2">{user?.fullName}</h3>
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
              
              <TabsContent value="analytics">
                {/* Analytics Content */}
                <div className="grid grid-cols-1 gap-6">
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