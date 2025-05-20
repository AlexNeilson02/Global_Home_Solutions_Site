import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  StatsCard, 
} from "@/components/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NfcBadge } from "@/components/nfc-badge";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Get salesperson data
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  const salespersonData = userData?.roleData;

  // Get leads/projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<any>({
    queryKey: ["/api/projects"],
    enabled: !!user
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-grid mb-8">
          <StatsCard
            title="Total Leads"
            value={salespersonData?.totalLeads || 0}
            trend={{ value: "12.3% this month", positive: true }}
            icon={UserCheck}
            iconBgColor="bg-primary-50 dark:bg-primary/10"
            iconColor="text-primary"
            chart={
              <div className="h-10 flex items-end space-x-1">
                <div className="w-1 h-3 bg-primary/20 rounded-t"></div>
                <div className="w-1 h-5 bg-primary/40 rounded-t"></div>
                <div className="w-1 h-6 bg-primary/60 rounded-t"></div>
                <div className="w-1 h-4 bg-primary/40 rounded-t"></div>
                <div className="w-1 h-7 bg-primary/60 rounded-t"></div>
                <div className="w-1 h-10 bg-primary rounded-t"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Conversion Rate"
            value={formatPercentage(salespersonData?.conversionRate || 0)}
            trend={{ value: "4.5% this month", positive: true }}
            icon={Percent}
            iconBgColor="bg-secondary-50 dark:bg-secondary/10"
            iconColor="text-secondary"
            chart={
              <div className="h-10 w-16 bg-secondary-50 dark:bg-secondary/10 rounded-md relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-3/4 bg-secondary rounded-md"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Commissions"
            value={formatCurrency(salespersonData?.commissions || 0)}
            trend={{ value: "18.2% this month", positive: true }}
            icon={DollarSign}
            iconBgColor="bg-accent-50 dark:bg-accent/10"
            iconColor="text-accent"
            chart={
              <div className="h-10 flex items-end space-x-1">
                <div className="w-1 h-4 bg-accent/20 rounded-t"></div>
                <div className="w-1 h-6 bg-accent/40 rounded-t"></div>
                <div className="w-1 h-5 bg-accent/40 rounded-t"></div>
                <div className="w-1 h-7 bg-accent/60 rounded-t"></div>
                <div className="w-1 h-8 bg-accent/60 rounded-t"></div>
                <div className="w-1 h-10 bg-accent rounded-t"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Active Projects"
            value={salespersonData?.activeProjects || 0}
            trend={{ value: "Same as last month", neutral: true }}
            icon={Building}
            iconBgColor="bg-info-50 dark:bg-info/10"
            iconColor="text-info"
            chart={
              <div className="grid grid-cols-4 gap-1 w-20">
                <div className="h-2 bg-info/20 rounded"></div>
                <div className="h-2 bg-info/40 rounded"></div>
                <div className="h-2 bg-info/60 rounded"></div>
                <div className="h-2 bg-info rounded"></div>
                <div className="h-2 bg-info/20 rounded"></div>
                <div className="h-2 bg-info/40 rounded"></div>
                <div className="h-2 bg-info/60 rounded"></div>
                <div className="h-2 bg-info rounded"></div>
              </div>
            }
          />
        </div>
        
        {/* NFC Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Your NFC Profile</h2>
              <Button size="sm" className="flex items-center">
                <RefreshCw className="mr-1 h-4 w-4" />
                Update Profile
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0 md:mr-8">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName} />
                  <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user?.fullName}</h3>
                  <p className="text-sm text-muted-foreground">ID: #{salespersonData?.id || "N/A"}</p>
                  <div className="flex items-center mt-1">
                    <Badge variant="success" className="text-xs px-2 py-0.5 rounded-full">Active</Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mb-4 md:mb-0 md:mx-6 w-full md:w-auto">
                <div className="flex items-center">
                  <NfcBadge size="sm" className="mr-4" />
                  <div>
                    <h4 className="font-medium">NFC ID: {salespersonData?.nfcId || "N/A"}</h4>
                    <p className="text-xs text-muted-foreground">
                      Last scanned {salespersonData?.lastScanned ? timeAgo(salespersonData.lastScanned) : "never"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="md:ml-auto text-center md:text-left">
                <p className="text-sm font-mono bg-primary-50 dark:bg-primary/10 text-primary px-4 py-2 rounded-lg truncate max-w-[300px]">
                  {window.location.origin}/rep/{salespersonData?.profileUrl || ""}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Personal landing page URL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Leads Table */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Recent Leads</h2>
              <Button variant="link" className="text-primary text-sm font-medium">View All Leads</Button>
            </div>
            
            <div className="overflow-x-auto">
              {isLoadingProjects ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : projectsData?.projects?.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Customer</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Service</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Value</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsData.projects.map((project: any) => {
                      const { bg, text } = getStatusColor(project.status);
                      return (
                        <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Avatar className="w-8 h-8 mr-3">
                                <AvatarFallback>{getInitials("Customer")}</AvatarFallback>
                              </Avatar>
                              <span>Customer #{project.homeownerId}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{project.serviceType}</td>
                          <td className="py-3 px-4">{new Date(project.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge className={`px-2 py-1 text-xs rounded-full ${bg} ${text}`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(project.budget)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No leads found. Start connecting with homeowners to generate leads.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
