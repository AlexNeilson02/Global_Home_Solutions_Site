import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle,
  Plus,
  Calendar,
  MessageSquare,
  Paperclip,
  User
} from "lucide-react";
import { format } from "date-fns";

interface ProjectMilestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  orderIndex: number;
  createdAt: string;
  createdBy: number;
}

interface ProjectStatusUpdate {
  id: number;
  projectId: number;
  status: string;
  notes?: string;
  updatedBy: number;
  createdAt: string;
  attachments: string[];
}

interface ProjectTimelineProps {
  projectId: number;
  canEdit?: boolean;
}

export default function ProjectTimeline({ projectId, canEdit = false }: ProjectTimelineProps) {
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: ""
  });
  const [newStatusUpdate, setNewStatusUpdate] = useState({
    status: "",
    notes: ""
  });
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch timeline data
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'timeline'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    }
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (milestoneData: any) => {
      return apiRequest('POST', `/api/projects/${projectId}/milestones`, milestoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'timeline'] });
      setNewMilestone({ title: "", description: "", dueDate: "" });
      setShowMilestoneDialog(false);
      toast({
        title: "Milestone Created",
        description: "Project milestone has been added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Milestone",
        description: "There was an error creating the milestone",
        variant: "destructive"
      });
    }
  });

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, status }: { milestoneId: number; status: string }) => {
      return apiRequest('PATCH', `/api/projects/${projectId}/milestones/${milestoneId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'timeline'] });
      toast({
        title: "Milestone Updated",
        description: "Milestone status has been updated"
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update milestone status",
        variant: "destructive"
      });
    }
  });

  // Create status update mutation
  const createStatusUpdateMutation = useMutation({
    mutationFn: async (statusData: any) => {
      return apiRequest('POST', `/api/projects/${projectId}/status-updates`, statusData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'timeline'] });
      setNewStatusUpdate({ status: "", notes: "" });
      setShowStatusDialog(false);
      toast({
        title: "Status Update Added",
        description: "Project status update has been recorded"
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Update",
        description: "There was an error adding the status update",
        variant: "destructive"
      });
    }
  });

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleCreateMilestone = () => {
    if (!newMilestone.title) return;
    
    createMilestoneMutation.mutate({
      ...newMilestone,
      dueDate: newMilestone.dueDate || null
    });
  };

  const handleCreateStatusUpdate = () => {
    if (!newStatusUpdate.status) return;
    
    createStatusUpdateMutation.mutate(newStatusUpdate);
  };

  const toggleMilestoneStatus = (milestoneId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateMilestoneMutation.mutate({ milestoneId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { milestones = [], statusUpdates = [] } = timelineData?.timeline || {};

  // Combine and sort timeline events
  const timelineEvents = [
    ...milestones.map((m: ProjectMilestone) => ({ ...m, type: 'milestone' })),
    ...statusUpdates.map((s: ProjectStatusUpdate) => ({ ...s, type: 'status_update' }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Timeline</h3>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Milestone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="milestone-title">Title</Label>
                    <Input
                      id="milestone-title"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Milestone title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestone-description">Description</Label>
                    <Textarea
                      id="milestone-description"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Milestone description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestone-due-date">Due Date</Label>
                    <Input
                      id="milestone-due-date"
                      type="date"
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowMilestoneDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateMilestone}
                      disabled={!newMilestone.title || createMilestoneMutation.isPending}
                    >
                      {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Update
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Status Update</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status-select">Status</Label>
                    <Select value={newStatusUpdate.status} onValueChange={(value) => setNewStatusUpdate(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status-notes">Notes</Label>
                    <Textarea
                      id="status-notes"
                      value={newStatusUpdate.notes}
                      onChange={(e) => setNewStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about this status update..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateStatusUpdate}
                      disabled={!newStatusUpdate.status || createStatusUpdateMutation.isPending}
                    >
                      {createStatusUpdateMutation.isPending ? "Adding..." : "Add Update"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Milestones Overview */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone: ProjectMilestone) => (
                <div key={milestone.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <button
                    onClick={() => canEdit && toggleMilestoneStatus(milestone.id, milestone.status)}
                    disabled={!canEdit}
                    className="flex-shrink-0"
                  >
                    {getMilestoneIcon(milestone.status)}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{milestone.title}</h4>
                      <Badge variant={getStatusBadgeVariant(milestone.status)} className="text-xs">
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {milestone.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {milestone.completedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed: {format(new Date(milestone.completedAt), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? (
            <div className="space-y-4">
              {timelineEvents.map((event: any, index) => (
                <div key={`${event.type}-${event.id}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {event.type === 'milestone' ? (
                        getMilestoneIcon(event.status)
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {index < timelineEvents.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {event.type === 'milestone' ? event.title : `Status: ${event.status}`}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    {(event.description || event.notes) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description || event.notes}
                      </p>
                    )}
                    
                    {event.type === 'milestone' && event.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(event.dueDate), 'MMM dd, yyyy')}
                      </div>
                    )}
                    
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Paperclip className="h-3 w-3" />
                        {event.attachments.length} attachment(s)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No timeline events yet</p>
              {canEdit && (
                <p className="text-sm text-muted-foreground mt-1">
                  Add milestones and status updates to track project progress
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}