import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  formatCurrency, 
  getInitials, 
  getStatusColor, 
  formatPercentage 
} from "@/lib/utils";
import { 
  Search, 
  Bell, 
  Building, 
  Users, 
  Clock, 
  DollarSign,
  Calendar, 
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function ContractorDashboard() {
  const { user } = useAuth();

  // Get contractor data
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  const contractorData = userData?.roleData;

  // Get projects
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
          <h1 className="text-2xl font-semibold">Contractor Dashboard</h1>
          
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
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">2</span>
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-grid mb-8">
          <StatsCard
            title="Active Projects"
            value={projectsData?.projects?.filter((p: any) => p.status === "in_progress").length || 0}
            trend={{ value: "3 new this month", positive: true }}
            icon={Building}
            iconBgColor="bg-primary-50 dark:bg-primary/10"
            iconColor="text-primary"
            chart={
              <div className="h-10 flex items-end space-x-1">
                <div className="w-1 h-3 bg-primary/20 rounded-t"></div>
                <div className="w-1 h-5 bg-primary/40 rounded-t"></div>
                <div className="w-1 h-7 bg-primary/60 rounded-t"></div>
                <div className="w-1 h-6 bg-primary/40 rounded-t"></div>
                <div className="w-1 h-8 bg-primary/60 rounded-t"></div>
                <div className="w-1 h-10 bg-primary rounded-t"></div>
              </div>
            }
          />
          
          <StatsCard
            title="New Leads"
            value={projectsData?.projects?.filter((p: any) => p.status === "pending").length || 0}
            trend={{ value: "15% increase", positive: true }}
            icon={Users}
            iconBgColor="bg-secondary-50 dark:bg-secondary/10"
            iconColor="text-secondary"
            chart={
              <div className="h-10 w-16 bg-secondary-50 dark:bg-secondary/10 rounded-md relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-3/4 bg-secondary rounded-md"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Pending Bids"
            value={4}
            trend={{ value: "Same as last week", neutral: true }}
            icon={Clock}
            iconBgColor="bg-warning-50 dark:bg-warning/10"
            iconColor="text-warning"
            chart={
              <div className="h-10 flex items-end space-x-1">
                <div className="w-1 h-4 bg-warning/20 rounded-t"></div>
                <div className="w-1 h-6 bg-warning/40 rounded-t"></div>
                <div className="w-1 h-5 bg-warning/40 rounded-t"></div>
                <div className="w-1 h-7 bg-warning/60 rounded-t"></div>
                <div className="w-1 h-8 bg-warning/60 rounded-t"></div>
                <div className="w-1 h-10 bg-warning rounded-t"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(32500)}
            trend={{ value: "12% this month", positive: true }}
            icon={DollarSign}
            iconBgColor="bg-success-50 dark:bg-success/10"
            iconColor="text-success"
            chart={
              <div className="grid grid-cols-4 gap-1 w-20">
                <div className="h-2 bg-success/20 rounded"></div>
                <div className="h-2 bg-success/40 rounded"></div>
                <div className="h-2 bg-success/60 rounded"></div>
                <div className="h-2 bg-success rounded"></div>
                <div className="h-2 bg-success/20 rounded"></div>
                <div className="h-2 bg-success/40 rounded"></div>
                <div className="h-2 bg-success/60 rounded"></div>
                <div className="h-2 bg-success rounded"></div>
              </div>
            }
          />
        </div>
        
        {/* Company Profile */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0 md:mr-8">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage src={contractorData?.logoUrl || ""} alt={contractorData?.companyName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {contractorData?.companyName?.charAt(0) || user?.fullName?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{contractorData?.companyName || "Your Company"}</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill={i < Math.floor(contractorData?.rating || 0) ? "currentColor" : "none"}
                          stroke="currentColor"
                          className={`h-4 w-4 ${i < Math.floor(contractorData?.rating || 0) ? "text-yellow-400" : "text-muted-foreground"}`}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm">({contractorData?.reviewCount || 0})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {contractorData?.specialties?.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-primary-50 dark:bg-primary/10 text-primary text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="md:ml-auto flex space-x-4">
                <Badge variant="outline" className={`px-2 py-1 ${contractorData?.isVerified ? "bg-success-50 text-success dark:bg-success/10" : "bg-warning-50 text-warning dark:bg-warning/10"}`}>
                  {contractorData?.isVerified ? "Verified" : "Verification Pending"}
                </Badge>
                <Badge variant="outline" className="bg-primary-50 dark:bg-primary/10 text-primary px-2 py-1 capitalize">
                  {contractorData?.subscriptionTier || "Basic"} Plan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects and Schedule Tabs */}
        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Schedule</TabsTrigger>
            <TabsTrigger value="leads">New Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoadingProjects ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : projectsData?.projects?.filter((p: any) => p.status === "in_progress").length > 0 ? (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Project</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Customer</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Start Date</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Value</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsData.projects
                          .filter((project: any) => project.status === "in_progress")
                          .map((project: any) => (
                            <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4 font-medium">{project.title}</td>
                              <td className="py-3 px-4">Customer #{project.homeownerId}</td>
                              <td className="py-3 px-4">{new Date(project.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{formatCurrency(project.budget)}</td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No active projects found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-3 border border-border rounded-md">
                    <div className="bg-primary-50 dark:bg-primary/10 text-primary w-12 h-12 rounded-md flex items-center justify-center mr-4">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Kitchen Renovation - Initial Consultation</h4>
                      <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM - 11:30 AM</p>
                    </div>
                    <Badge className="bg-secondary-50 dark:bg-secondary/10 text-secondary">Confirmed</Badge>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center p-3 border border-border rounded-md">
                    <div className="bg-primary-50 dark:bg-primary/10 text-primary w-12 h-12 rounded-md flex items-center justify-center mr-4">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Bathroom Remodel - Final Inspection</h4>
                      <p className="text-sm text-muted-foreground">Friday, 2:00 PM - 3:30 PM</p>
                    </div>
                    <Badge className="bg-secondary-50 dark:bg-secondary/10 text-secondary">Confirmed</Badge>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center p-3 border border-border rounded-md">
                    <div className="bg-warning-50 dark:bg-warning/10 text-warning w-12 h-12 rounded-md flex items-center justify-center mr-4">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">New Project - Site Assessment</h4>
                      <p className="text-sm text-muted-foreground">Monday, 9:00 AM - 11:00 AM</p>
                    </div>
                    <Badge className="bg-warning-50 dark:bg-warning/10 text-warning">Pending</Badge>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">New Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoadingProjects ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : projectsData?.projects?.filter((p: any) => p.status === "pending").length > 0 ? (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Project</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Type</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Budget</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsData.projects
                          .filter((project: any) => project.status === "pending")
                          .map((project: any) => (
                            <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4 font-medium">{project.title}</td>
                              <td className="py-3 px-4">{project.serviceType}</td>
                              <td className="py-3 px-4">{new Date(project.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{formatCurrency(project.budget)}</td>
                              <td className="py-3 px-4 text-right">
                                <Button size="sm" className="mr-2">Bid Now</Button>
                                <Button variant="outline" size="sm">Decline</Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No new leads at the moment.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
