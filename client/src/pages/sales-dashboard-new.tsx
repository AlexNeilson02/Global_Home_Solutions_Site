import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { useAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { 
  UserCheck, 
  DollarSign, 
  BarChart3 
} from "lucide-react";

export default function SalesDashboardNew() {
  const [location] = useLocation();
  const { user } = useAuth();
  
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
            value={`${analyticsData?.analytics?.conversionRate?.toFixed(1) || 0}%`}
            trend={{ value: "3.2% this month", positive: true }}
            icon={BarChart3}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-500"
          />
          
          <StatsCard
            title="Commissions"
            value={`$${salespersonData?.commissions?.toFixed(2) || 0}`}
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
        <Card>
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
                      value={salespersonData?.phone || "(555) 123-4567"}
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