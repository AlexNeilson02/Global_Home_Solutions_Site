import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentManager from "@/components/DocumentManager";
import ProjectTimeline from "@/components/ProjectTimeline";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Building, 
  Phone, 
  Mail,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  budget?: number;
  createdAt: string;
  completedAt?: string;
  imageUrl?: string;
  homeownerId: number;
  contractorId?: number;
  salespersonId?: number;
}

interface BidRequest {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  serviceRequested: string;
  description: string;
  timeline: string;
  budget?: string;
  status: string;
  createdAt: string;
}

export default function ProjectManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');

  // Fetch project details
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      // For now, we'll use bid request data as project data
      const response = await fetch(`/api/bid-requests/recent`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      const project = data.bidRequests?.find((br: BidRequest) => br.id === projectId);
      return { project };
    },
    enabled: !!projectId
  });

  const project = projectData?.project as BidRequest;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'won':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
      case 'contacted':
      case 'bid_sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
      case 'declined':
      case 'lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'won':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
      case 'contacted':
      case 'bid_sent':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoadingProject) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.serviceRequested}</h1>
          <p className="text-muted-foreground">Project #{project.id}</p>
        </div>
        <Badge className={getStatusColor(project.status)}>
          {getStatusIcon(project.status)}
          <span className="ml-1">{project.status.replace('_', ' ').toUpperCase()}</span>
        </Badge>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <p className="text-muted-foreground">{project.timeline}</p>
                </div>
                
                {project.budget && (
                  <div>
                    <h4 className="font-medium mb-2">Budget</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{project.budget}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{project.address}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Created</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(project.createdAt), 'PPP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{project.fullName}</p>
                  <p className="text-sm text-muted-foreground">Customer</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{project.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{project.phone}</p>
                  <p className="text-sm text-muted-foreground">Phone</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Timeline and Documents */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Project Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents & Files</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <ProjectTimeline 
            projectId={projectId} 
            canEdit={true}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentManager 
            category="project"
            relatedId={projectId}
            relatedType="project"
            showUpload={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}