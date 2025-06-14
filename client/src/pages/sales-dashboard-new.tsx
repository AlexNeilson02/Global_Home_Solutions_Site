import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { useAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { 
  UserCheck, 
  DollarSign, 
  BarChart3 
} from "lucide-react";

export default function SalesDashboardNew() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Get user data
  const { data: userData } = useQuery({
    queryKey: ["/api/users/me"],
    enabled: !!user,
  });
  
  // Get salesperson data
  const { data: salespersonData } = useQuery({
    queryKey: ["/api/salespersons", user?.id],
    enabled: !!user?.id && user?.role === "salesperson",
  });
  
  // Get analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/salespersons", user?.id, "analytics"],
    enabled: !!user?.id && user?.role === "salesperson",
  });
  
  // Set phone number from salesperson data when available
  useEffect(() => {
    if (salespersonData?.phone) {
      setPhoneNumber(salespersonData.phone);
    }
  }, [salespersonData?.phone]);

  // Determine which section to show based on URL path
  const getActiveSection = () => {
    const path = location.split('/').filter(Boolean);
    if (path.length === 1) return "dashboard"; // /sales-dashboard
    return path[1]; // /sales-dashboard/section
  };

  const activeSection = getActiveSection();
  
  // Render the main dashboard
  const renderDashboard = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline">Edit Profile</Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Leads"
            value={analyticsData?.analytics?.conversions || salespersonData?.totalLeads || 0}
            trend={{ value: "12.3% this month", positive: true }}
            icon={UserCheck}
            iconBgColor="bg-primary-50"
            iconColor="text-primary"
          />
          
          <StatsCard
            title="Conversion Rate"
            value={`${analyticsData?.analytics?.conversionRate && !isNaN(analyticsData.analytics.conversionRate) ? analyticsData.analytics.conversionRate.toFixed(1) : '0.0'}%`}
            trend={{ value: "3.2% this month", positive: true }}
            icon={BarChart3}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-500"
          />
          
          <StatsCard
            title="Commissions"
            value={`$${salespersonData?.commissions && !isNaN(salespersonData.commissions) ? salespersonData.commissions.toFixed(2) : '0.00'}`}
            trend={{ value: "5.1% this month", positive: true }}
            icon={DollarSign}
            iconBgColor="bg-green-50"
            iconColor="text-green-500"
          />
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 py-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(userData?.fullName || "")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">New lead generated for home renovation project</p>
                <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render contractors section
  const renderContractors = () => {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Contractors</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Contractor directory will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render bid requests section
  const renderBidRequests = () => {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Bid Requests</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Bid requests will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render settings section
  const renderSettings = () => {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      className="w-full px-3 py-2 border rounded-md" 
                      value={userData?.fullName || ""}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Email</label>
                    <input 
                      className="w-full px-3 py-2 border rounded-md" 
                      value={userData?.email || ""}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <input 
                      className="w-full px-3 py-2 border rounded-md" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{getInitials(userData?.fullName || "")}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Picture</Button>
                </div>
                
                <div className="mt-4">
                  <Button onClick={() => {
                    alert("Phone number updated: " + phoneNumber);
                    // In real implementation, this would save to the backend
                  }}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Digital Business Card QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your unique QR code allows customers to easily access your digital business card. 
                  Print it on your physical business cards, display it at events, or share it digitally.
                </p>
                
                <div className="p-2 bg-muted rounded-lg mb-4">
                  <p className="font-medium mb-1 text-sm">Your Personal Profile URL:</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-background px-3 py-2 text-sm rounded-md w-full truncate border">
                      {window.location.origin}/s/{salespersonData?.profileUrl || "your-profile"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/s/${salespersonData?.profileUrl || "your-profile"}`);
                        alert("Profile URL copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm font-medium mb-2">Benefits:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground mb-4">
                  <li>Allow customers to contact you directly</li>
                  <li>Showcase your services and expertise</li>
                  <li>Enable quick quote requests from prospects</li>
                  <li>Increase your conversion rate with personalized approach</li>
                </ul>
              </div>
              
              {/* Simple QR Code Display */}
              <div className="mt-6 p-4 border rounded-lg bg-white">
                <h3 className="font-semibold text-lg mb-4 text-center">Your QR Code</h3>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <QRCode
                      value={`${window.location.origin}/sales/alexneilson02`}
                      size={180}
                      level="M"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Scan to visit your personal landing page
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/sales/alexneilson02`);
                          alert("Link copied to clipboard!");
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const canvas = document.querySelector('canvas');
                          if (canvas) {
                            const link = document.createElement('a');
                            link.download = 'my-qr-code.png';
                            link.href = canvas.toDataURL();
                            link.click();
                          }
                        }}
                      >
                        Download QR
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render the active section content
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "contractors":
        return renderContractors();
      case "bid-requests":
        return renderBidRequests();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
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