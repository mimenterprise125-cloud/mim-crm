import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Wrench, AlertCircle, CheckCircle, Clock, RefreshCw, Eye, MessageCircle, Send } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { projectWhatsappService } from "@/services/projectWhatsappService";

const projectStatusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  DELAYED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function Operations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [messageType, setMessageType] = useState("custom"); // "prefilled" or "custom"
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
    loadProjectUpdates();
    setupRealtimeSubscription();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          lead_id (
            id,
            name,
            phone,
            location,
            project_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter to only show complete projects (with all required fields filled)
      const completeProjects = (data || []).filter(project => {
        return project.total_sqft && 
               project.rate_per_sqft && 
               project.expected_completion_date &&
               project.total_sqft > 0 &&
               project.rate_per_sqft > 0;
      });
      
      setProjects(completeProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjectUpdates(data || []);
    } catch (error) {
      console.error("Error loading project updates:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const updateProjectStatus = async () => {
    try {
      if (!newStatus || !selectedProject) return;

      setSubmitting(true);

      // Update project status
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", selectedProject.id);

      if (error) throw error;

      // Log to audit
      const { auditService } = await import("@/services/auditService");
      await auditService.logAction({
        user_id: user?.id || "",
        action_type: "STATUS_CHANGE",
        entity_type: "PROJECT",
        entity_id: selectedProject.id,
        old_value: { status: selectedProject.status },
        new_value: { status: newStatus },
      });

      toast({
        title: "Success",
        description: `Project status updated to ${newStatus}`,
      });

      setShowStatusDialog(false);
      setNewStatus("");
      await loadProjects();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessageToCustomer = async () => {
    try {
      if (!selectedProject) return;

      setSubmitting(true);

      // Extract lead ID - handle both cases: lead_id as UUID or object with id
      const leadId = typeof selectedProject.lead_id === 'string' 
        ? selectedProject.lead_id 
        : selectedProject.lead_id?.id;

      if (!leadId) {
        throw new Error("Lead ID not found");
      }

      let result;
      if (messageType === "prefilled") {
        result = await projectWhatsappService.sendStatusMessage(
          selectedProject.id,
          leadId,
          selectedProject.lead_id?.phone || "",
          selectedProject.status,
          user?.id || ""
        );
      } else {
        result = await projectWhatsappService.sendCustomMessage(
          selectedProject.id,
          leadId,
          selectedProject.lead_id?.phone || "",
          customMessage,
          user?.id || ""
        );
      }

      if (result.success) {
        toast({
          title: "Success",
          description: "Message sent to customer",
        });
        setShowMessageDialog(false);
        setCustomMessage("");
        setMessageType("custom");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "DELAYED":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "ON_HOLD":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Wrench className="h-5 w-5 text-blue-600" />;
    }
  };

  const getProjectUpdates = (projectId: string) => {
    return projectUpdates.filter((pu) => pu.project_id === projectId);
  };

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
    delayed: projects.filter((p) => p.status === "DELAYED").length,
    onHold: projects.filter((p) => p.status === "ON_HOLD").length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-bold">Operations Dashboard</h1>
          <div className="h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground">Monitor project progress and timelines</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-blue-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-green-600">{stats.completed}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Delayed</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-red-600">{stats.delayed}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">On Hold</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-yellow-600">{stats.onHold}</div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <Button onClick={loadProjects} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        {/* Projects Grid */}
        <div className="space-y-8">
          {/* Active & In Progress Projects */}
          {projects.filter(p => p.status !== "COMPLETED").length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Active Projects ({projects.filter(p => p.status !== "COMPLETED").length})</h2>
                <p className="text-sm text-muted-foreground">Projects currently in progress</p>
              </div>
              <div className="grid gap-4">
                {projects.filter(p => p.status !== "COMPLETED").map((project) => {
                  const daysRemaining = differenceInDays(
                    new Date(project.expected_completion_date),
                    new Date()
                  );
                  const updates = getProjectUpdates(project.id);

                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
                          {/* Client Name */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Client</p>
                            <p className="font-semibold">{project.lead_id?.name}</p>
                          </div>

                          {/* Area */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Area (sqft)</p>
                            <p className="font-semibold">{project.total_sqft}</p>
                          </div>

                          {/* Rate */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Rate/sqft</p>
                            <p className="font-semibold">₹{parseFloat(project.rate_per_sqft).toFixed(0)}</p>
                          </div>

                          {/* Amount */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
                            <p className="font-semibold">₹{parseFloat(project.final_amount).toLocaleString()}</p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge className={projectStatusColors[project.status]}>
                              {project.status}
                            </Badge>
                          </div>

                          {/* Timeline */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Completion</p>
                              <p className="text-sm font-semibold">
                                {daysRemaining > 0 ? `${daysRemaining}d left` : "Overdue"}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Dialog open={showStatusDialog && selectedProject?.id === project.id} onOpenChange={setShowStatusDialog}>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setNewStatus(project.status);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    Change
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Update Project Status</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">New Status</label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ACTIVE">Active</SelectItem>
                                          <SelectItem value="DELAYED">Delayed</SelectItem>
                                          <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                          <SelectItem value="COMPLETED">Completed</SelectItem>
                                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={updateProjectStatus} disabled={submitting} className="w-full">
                                      {submitting ? "Updating..." : "Update Status"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={showMessageDialog && selectedProject?.id === project.id} onOpenChange={setShowMessageDialog}>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedProject(project)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs gap-1"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    Msg
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Send WhatsApp Message to Customer</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">Message Type</label>
                                      <Select value={messageType} onValueChange={setMessageType}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="prefilled">Prefilled (Status Based)</SelectItem>
                                          <SelectItem value="custom">Custom Message</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {messageType === "prefilled" ? (
                                      <div className="bg-muted p-3 rounded text-sm">
                                        <p className="font-semibold mb-2">Preview:</p>
                                        <p className="text-xs">
                                          {selectedProject?.status === "ACTIVE"
                                            ? "Thank you for choosing MIM Doors & Windows! Your project is now active and underway. Our team will keep you updated on the progress."
                                            : selectedProject?.status === "DELAYED"
                                            ? "We wanted to inform you that your project has encountered a delay. Our team is working diligently to minimize the impact and complete your project as soon as possible."
                                            : selectedProject?.status === "COMPLETED"
                                            ? "🎉 Great news! Your MIM Doors & Windows project has been completed successfully. Thank you for your business! We hope you enjoy your new installation."
                                            : "Your project status has been updated. Please contact us for more details."}
                                        </p>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">Message</label>
                                        <Textarea
                                          placeholder="Type your custom message here..."
                                          value={customMessage}
                                          onChange={(e) => setCustomMessage(e.target.value)}
                                          rows={4}
                                        />
                                      </div>
                                    )}

                                    <Button onClick={sendMessageToCustomer} disabled={submitting} className="w-full gap-2">
                                      <Send className="h-4 w-4" />
                                      {submitting ? "Sending..." : "Send Message"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={showDetails && selectedProject?.id === project.id} onOpenChange={setShowDetails}>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedProject(project)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Project Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedProject && (
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                                        <Badge className={projectStatusColors[selectedProject.status]}>
                                          {selectedProject.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Total Area</p>
                                        <p className="font-semibold">{selectedProject.total_sqft} sqft</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Rate per sqft</p>
                                        <p className="font-semibold">₹{parseFloat(selectedProject.rate_per_sqft).toFixed(0)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Final Amount (with GST)</p>
                                        <p className="font-semibold text-lg">
                                          ₹{parseFloat(selectedProject.final_amount).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Expected Completion</p>
                                        <p className="font-semibold">
                                          {format(new Date(selectedProject.expected_completion_date), "MMM d, yyyy")}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Project Updates</p>
                                        {updates.length > 0 ? (
                                          <div className="space-y-2">
                                            {updates.map((update) => (
                                              <div key={update.id} className="p-2 bg-muted rounded text-sm">
                                                <p className="font-semibold">{update.type}</p>
                                                <p className="text-xs text-muted-foreground">{update.description}</p>
                                                <p className="text-xs">
                                                  {format(new Date(update.created_at), "MMM d, yyyy")}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">No updates yet</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {projects.filter(p => p.status === "COMPLETED").length > 0 && (
            <div>
              <div className="mb-4 pb-4 border-t">
                <h2 className="text-2xl font-bold text-green-600 mt-4">Completed Projects ({projects.filter(p => p.status === "COMPLETED").length})</h2>
                <p className="text-sm text-muted-foreground">Successfully finished projects</p>
              </div>
              <div className="grid gap-4">
                {projects.filter(p => p.status === "COMPLETED").map((project) => {
                  const daysRemaining = differenceInDays(
                    new Date(project.expected_completion_date),
                    new Date()
                  );
                  const updates = getProjectUpdates(project.id);

                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow border-green-200 bg-green-50/30">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
                          {/* Client Name */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Client</p>
                            <p className="font-semibold">{project.lead_id?.name}</p>
                          </div>

                          {/* Area */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Area (sqft)</p>
                            <p className="font-semibold">{project.total_sqft}</p>
                          </div>

                          {/* Rate */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Rate/sqft</p>
                            <p className="font-semibold">₹{parseFloat(project.rate_per_sqft).toFixed(0)}</p>
                          </div>

                          {/* Amount */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
                            <p className="font-semibold">₹{parseFloat(project.final_amount).toLocaleString()}</p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge className={projectStatusColors[project.status]}>
                              {project.status}
                            </Badge>
                          </div>

                          {/* Details Button */}
                          <div className="flex justify-end">
                            <Dialog open={showDetails && selectedProject?.id === project.id} onOpenChange={setShowDetails}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => setSelectedProject(project)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Project Details</DialogTitle>
                                </DialogHeader>
                                {selectedProject && (
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                                      <Badge className={projectStatusColors[selectedProject.status]}>
                                        {selectedProject.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Total Area</p>
                                      <p className="font-semibold">{selectedProject.total_sqft} sqft</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Rate per sqft</p>
                                      <p className="font-semibold">₹{parseFloat(selectedProject.rate_per_sqft).toFixed(0)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Final Amount (with GST)</p>
                                      <p className="font-semibold text-lg">
                                        ₹{parseFloat(selectedProject.final_amount).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Expected Completion</p>
                                      <p className="font-semibold">
                                        {format(new Date(selectedProject.expected_completion_date), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Project Updates</p>
                                      {updates.length > 0 ? (
                                        <div className="space-y-2">
                                          {updates.map((update) => (
                                            <div key={update.id} className="p-2 bg-muted rounded text-sm">
                                              <p className="font-semibold">{update.type}</p>
                                              <p className="text-xs text-muted-foreground">{update.description}</p>
                                              <p className="text-xs">
                                                {format(new Date(update.created_at), "MMM d, yyyy")}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No updates yet</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground/30 mr-3" />
                <p className="text-muted-foreground">No projects found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
