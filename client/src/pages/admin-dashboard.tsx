import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatCurrency, getStatusColor } from "@/lib/utils";
import { 
  Search, 
  Bell, 
  Users, 
  Building, 
  UserCheck, 
  DollarSign,
  BarChart3,
  MoreHorizontal,
  PlusCircle,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Get users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<any>({
    queryKey: ["/api/users/all"],
  });

  // Get contractors
  const { data: contractorsData, isLoading: isLoadingContractors } = useQuery<any>({
    queryKey: ["/api/contractors"],
  });

  // Get salespersons
  const { data: salespersonsData, isLoading: isLoadingSalespersons } = useQuery<any>({
    queryKey: ["/api/salespersons"],
  });

  // Get projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<any>({
    queryKey: ["/api/projects"],
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          
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
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">5</span>
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-grid mb-8">
          <StatsCard
            title="Total Users"
            value={120}
            trend={{ value: "10% this month", positive: true }}
            icon={Users}
            iconBgColor="bg-primary-50
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
            title="Contractors"
            value={contractorsData?.contractors?.length || 0}
            trend={{ value: "5 new this month", positive: true }}
            icon={Building}
            iconBgColor="bg-secondary-50
            iconColor="text-secondary"
            chart={
              <div className="h-10 w-16 bg-secondary-50 rounded-md relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-3/4 bg-secondary rounded-md"></div>
              </div>
            }
          />
          
          <StatsCard
            title="Sales Representatives"
            value={salespersonsData?.salespersons?.length || 0}
            trend={{ value: "3 new this month", positive: true }}
            icon={UserCheck}
            iconBgColor="bg-accent-50
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
            title="Total Revenue"
            value={formatCurrency(48750)}
            trend={{ value: "15% this month", positive: true }}
            icon={DollarSign}
            iconBgColor="bg-success-50
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
        
        {/* Analytics Dashboard */}
        <Card className="mb-8">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Platform Overview</CardTitle>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 flex items-center justify-center bg-muted/30 rounded-md border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 font-medium">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1">Detailed metrics and charts would appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Management Tabs */}
        <Tabs defaultValue="contractors">
          <TabsList className="mb-6">
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="salespeople">Sales Team</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contractors">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Contractor Management</CardTitle>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contractor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoadingContractors ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : contractorsData?.contractors?.length > 0 ? (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Company</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Owner</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Specialties</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Rating</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Plan</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractorsData?.contractors.map((contractor: any) => (
                          <tr key={contractor.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarImage src={contractor.logoUrl || ""} alt={contractor.companyName} />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {contractor.companyName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{contractor.companyName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{contractor.fullName || "Unknown"}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {contractor.specialties?.map((specialty: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="ml-1">{contractor.rating}</span>
                                <span className="ml-1 text-muted-foreground">({contractor.reviewCount})</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={`${contractor.isActive ? "bg-success-50 text-success : "bg-destructive-50 text-destructive
                                {contractor.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 capitalize">{contractor.subscriptionTier}</td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm" className="mr-2">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No contractors found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="salespeople">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Sales Team Management</CardTitle>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Sales Rep
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoadingSalespersons ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : salespersonsData?.salespersons?.length > 0 ? (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Representative</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">NFC ID</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Profile URL</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Total Leads</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Conversion</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salespersonsData?.salespersons.map((salesperson: any) => (
                          <tr key={salesperson.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarImage src={salesperson.avatarUrl || ""} alt={salesperson.fullName} />
                                  <AvatarFallback>{getInitials(salesperson.fullName || "")}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{salesperson.fullName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-sm">{salesperson.nfcId}</td>
                            <td className="py-3 px-4">{salesperson.profileUrl}</td>
                            <td className="py-3 px-4">{salesperson.totalLeads}</td>
                            <td className="py-3 px-4">{salesperson.conversionRate}%</td>
                            <td className="py-3 px-4">
                              <Badge className={`${salesperson.isActive ? "bg-success-50 text-success : "bg-destructive-50 text-destructive
                                {salesperson.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm" className="mr-2">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No sales representatives found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoadingProjects ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : projectsData?.projects?.length > 0 ? (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Project</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Homeowner</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Contractor</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Salesperson</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Value</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsData?.projects.map((project: any) => {
                          const { bg, text } = getStatusColor(project.status);
                          return (
                            <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4 font-medium">{project.title}</td>
                              <td className="py-3 px-4">User #{project.homeownerId}</td>
                              <td className="py-3 px-4">
                                {project.contractorId ? `Contractor #${project.contractorId}` : "Unassigned"}
                              </td>
                              <td className="py-3 px-4">
                                {project.salespersonId ? `Rep #${project.salespersonId}` : "Direct"}
                              </td>
                              <td className="py-3 px-4">{formatCurrency(project.budget)}</td>
                              <td className="py-3 px-4">
                                <Badge className={`${bg} ${text}`}>
                                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace(/_/g, ' ')}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="ghost" size="sm">
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
                      No projects found.
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
