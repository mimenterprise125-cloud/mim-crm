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
import { Eye, Plus, Clock, RefreshCw, Edit, History } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  DELAYED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    total_sqft: "",
    rate_per_sqft: "",
    gst_enabled: true,
    profit_percentage: "",
    expected_completion_date: "",
  });
  const [formData, setFormData] = useState({
    lead_id: "",
    total_sqft: "",
    rate_per_sqft: "",
    gst_enabled: true,
    profit_percentage: "",
    expected_completion_date: "",
  });

  useEffect(() => {
    loadProjects();
    loadLeads();

    // Subscribe to real-time changes in projects
    const projectsSubscription = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        () => {
          loadProjects();
          toast({
            title: "New Project",
            description: "A new project has been created",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects" },
        () => {
          loadProjects();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "projects" },
        () => {
          loadProjects();
        }
      )
      .subscribe();

    // Subscribe to real-time changes in leads
    const leadsSubscription = supabase
      .channel("leads-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          loadLeads();
        }
      )
      .subscribe();

    return () => {
      projectsSubscription.unsubscribe();
      leadsSubscription.unsubscribe();
    };
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
      setRefreshing(false);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, phone, location, status")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const calculateWithGST = (sqft: string, rate: string, gstEnabled: boolean) => {
    if (!sqft || !rate) {
      return { rateWithGST: 0, finalAmount: 0 };
    }
    
    const sqftNum = parseFloat(sqft);
    const rateNum = parseFloat(rate);
    
    if (gstEnabled) {
      // Calculate GST-inclusive rate: rate * 1.18
      const rateWithGST = rateNum * 1.18;
      // Calculate final amount: sqft * rate with GST
      const finalAmount = sqftNum * rateWithGST;
      return { rateWithGST, finalAmount };
    }
    
    // Without GST
    const finalAmount = sqftNum * rateNum;
    return { rateWithGST: rateNum, finalAmount };
  };

  const loadAuditHistory = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          user_id (
            id,
            full_name,
            email
          )
        `)
        .eq("entity_id", projectId)
        .eq("entity_type", "PROJECT")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setAuditHistory(data || []);
    } catch (error) {
      console.error("Error loading audit history:", error);
    }
  };

  const handleEditProject = async () => {
    try {
      if (!selectedProject) return;

      setSubmitting(true);

      const { rateWithGST, finalAmount } = calculateWithGST(
        editFormData.total_sqft,
        editFormData.rate_per_sqft,
        editFormData.gst_enabled
      );

      // Get the old values for audit
      const oldValues = {
        total_sqft: selectedProject.total_sqft,
        rate_per_sqft: selectedProject.rate_per_sqft,
        gst_enabled: selectedProject.gst_enabled,
        profit_percentage: selectedProject.profit_percentage,
        expected_completion_date: selectedProject.expected_completion_date,
      };

      // Update project
      const { error } = await supabase
        .from("projects")
        .update({
          total_sqft: parseFloat(editFormData.total_sqft),
          rate_per_sqft: rateWithGST,
          gst_enabled: editFormData.gst_enabled,
          final_amount: finalAmount,
          profit_percentage: editFormData.profit_percentage ? parseFloat(editFormData.profit_percentage) : null,
          expected_completion_date: editFormData.expected_completion_date,
        })
        .eq("id", selectedProject.id);

      if (error) throw error;

      // Log to audit with detailed change info - ONLY the fields that were actually changed
      const { auditService } = await import("@/services/auditService");
      
      // Build old and new values with ONLY changed fields
      const changedOldValue: any = {};
      const changedNewValue: any = {};
      
      if (editFormData.total_sqft !== selectedProject.total_sqft.toString()) {
        changedOldValue.total_sqft = selectedProject.total_sqft;
        changedNewValue.total_sqft = parseFloat(editFormData.total_sqft);
      }
      if (editFormData.rate_per_sqft !== selectedProject.rate_per_sqft.toString()) {
        changedOldValue.rate_per_sqft = selectedProject.rate_per_sqft;
        changedNewValue.rate_per_sqft = rateWithGST;
      }
      if (editFormData.gst_enabled !== selectedProject.gst_enabled) {
        changedOldValue.gst_enabled = selectedProject.gst_enabled;
        changedNewValue.gst_enabled = editFormData.gst_enabled;
      }
      if ((editFormData.profit_percentage || null) !== (selectedProject.profit_percentage || null)) {
        changedOldValue.profit_percentage = selectedProject.profit_percentage;
        changedNewValue.profit_percentage = editFormData.profit_percentage ? parseFloat(editFormData.profit_percentage) : null;
      }
      if (editFormData.expected_completion_date !== selectedProject.expected_completion_date) {
        changedOldValue.expected_completion_date = selectedProject.expected_completion_date;
        changedNewValue.expected_completion_date = editFormData.expected_completion_date;
      }

      await auditService.logAction({
        user_id: user?.id || "",
        action_type: "UPDATE",
        entity_type: "PROJECT",
        entity_id: selectedProject.id,
        old_value: changedOldValue,
        new_value: changedNewValue,
      });

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      setShowEditDialog(false);
      await loadProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateFinalAmount = (sqft: string, rate: string, gstEnabled: boolean) => {
    const { finalAmount } = calculateWithGST(sqft, rate, gstEnabled);
    return finalAmount;
  };

  const handleAddProject = async () => {
    try {
      if (!formData.lead_id || !formData.total_sqft || !formData.rate_per_sqft || !formData.expected_completion_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

      const { rateWithGST, finalAmount } = calculateWithGST(formData.total_sqft, formData.rate_per_sqft, formData.gst_enabled);

      const { error } = await supabase.from("projects").insert([
        {
          lead_id: formData.lead_id,
          total_sqft: parseFloat(formData.total_sqft),
          rate_per_sqft: rateWithGST, // Save GST-inclusive rate
          gst_enabled: formData.gst_enabled,
          final_amount: finalAmount, // This is also GST-inclusive if enabled
          profit_percentage: formData.profit_percentage ? parseFloat(formData.profit_percentage) : null,
          expected_completion_date: formData.expected_completion_date,
          status: "ACTIVE",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setFormData({
        lead_id: "",
        total_sqft: "",
        rate_per_sqft: "",
        gst_enabled: true,
        profit_percentage: "",
        expected_completion_date: "",
      });
      setShowAddDialog(false);
      await loadProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage all projects and track progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadProjects} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Lead *</label>
                    <Select value={formData.lead_id} onValueChange={(val) => setFormData({ ...formData, lead_id: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lead" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} - {lead.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Total Sqft *</label>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.total_sqft}
                      onChange={(e) => setFormData({ ...formData, total_sqft: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Rate per Sqft (₹) *</label>
                    <Input
                      type="number"
                      placeholder="e.g., 250"
                      value={formData.rate_per_sqft}
                      onChange={(e) => setFormData({ ...formData, rate_per_sqft: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">GST</label>
                    <Select value={formData.gst_enabled ? "yes" : "no"} onValueChange={(val) => setFormData({ ...formData, gst_enabled: val === "yes" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes (18% GST)</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.rate_per_sqft && (
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Base Rate per Sqft</p>
                        <p className="font-semibold">₹{parseFloat(formData.rate_per_sqft).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      </div>
                      {formData.gst_enabled && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rate with 18% GST</p>
                          <p className="font-semibold">₹{(parseFloat(formData.rate_per_sqft) * 1.18).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Final Amount {formData.gst_enabled ? "(with 18% GST)" : "(without GST)"}
                    </label>
                    <Input
                      type="text"
                      placeholder="Calculated automatically"
                      value={
                        calculateFinalAmount(formData.total_sqft, formData.rate_per_sqft, formData.gst_enabled)
                          ? "₹" + calculateFinalAmount(formData.total_sqft, formData.rate_per_sqft, formData.gst_enabled).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                          : ""
                      }
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Profit Percentage (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 15"
                      value={formData.profit_percentage}
                      onChange={(e) => setFormData({ ...formData, profit_percentage: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Expected Completion Date *</label>
                    <Input
                      type="date"
                      value={formData.expected_completion_date}
                      onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleAddProject} disabled={submitting} className="w-full">
                    {submitting ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects List */}
        <div className="grid gap-3">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No projects found</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-center">
                    {/* Lead Name */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-semibold text-sm">{project.lead_id?.name}</p>
                    </div>

                    {/* Sqft */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Area (sqft)</p>
                      <p className="font-semibold text-sm">{project.total_sqft.toLocaleString()}</p>
                    </div>

                    {/* Rate */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rate</p>
                      <p className="font-semibold text-sm">₹{parseFloat(project.rate_per_sqft).toFixed(0)}/sqft</p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
                      <p className="font-semibold text-sm">₹{(project.final_amount / 100000).toFixed(1)}L</p>
                    </div>

                    {/* Completion Date */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(project.expected_completion_date), "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Dialog open={showEditDialog && selectedProject?.id === project.id} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              setEditFormData({
                                total_sqft: project.total_sqft.toString(),
                                rate_per_sqft: project.rate_per_sqft.toString(),
                                gst_enabled: project.gst_enabled,
                                profit_percentage: project.profit_percentage?.toString() || "",
                                expected_completion_date: project.expected_completion_date,
                              });
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Project: {selectedProject?.lead_id?.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Total Sqft</label>
                              <Input
                                type="number"
                                value={editFormData.total_sqft}
                                onChange={(e) => setEditFormData({ ...editFormData, total_sqft: e.target.value })}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Rate per Sqft (₹)</label>
                              <Input
                                type="number"
                                value={editFormData.rate_per_sqft}
                                onChange={(e) => setEditFormData({ ...editFormData, rate_per_sqft: e.target.value })}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">GST</label>
                              <Select value={editFormData.gst_enabled ? "yes" : "no"} onValueChange={(val) => setEditFormData({ ...editFormData, gst_enabled: val === "yes" })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes (18% GST)</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {editFormData.rate_per_sqft && (
                              <div className="bg-muted p-3 rounded-lg space-y-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Base Rate</p>
                                  <p className="font-semibold">₹{parseFloat(editFormData.rate_per_sqft).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                                </div>
                                {editFormData.gst_enabled && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Rate with 18% GST</p>
                                    <p className="font-semibold">₹{(parseFloat(editFormData.rate_per_sqft) * 1.18).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium mb-2 block">Final Amount {editFormData.gst_enabled ? "(with 18% GST)" : "(without GST)"}</label>
                              <Input
                                type="text"
                                value={
                                  calculateWithGST(editFormData.total_sqft, editFormData.rate_per_sqft, editFormData.gst_enabled).finalAmount
                                    ? "₹" + calculateWithGST(editFormData.total_sqft, editFormData.rate_per_sqft, editFormData.gst_enabled).finalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })
                                    : ""
                                }
                                readOnly
                                className="bg-muted"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Profit Percentage (%)</label>
                              <Input
                                type="number"
                                value={editFormData.profit_percentage}
                                onChange={(e) => setEditFormData({ ...editFormData, profit_percentage: e.target.value })}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Expected Completion Date</label>
                              <Input
                                type="date"
                                value={editFormData.expected_completion_date}
                                onChange={(e) => setEditFormData({ ...editFormData, expected_completion_date: e.target.value })}
                              />
                            </div>

                            <Button onClick={handleEditProject} disabled={submitting} className="w-full">
                              {submitting ? "Updating..." : "Update Project"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showHistoryDialog && selectedProject?.id === project.id} onOpenChange={setShowHistoryDialog}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              loadAuditHistory(project.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Project Edit History</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            {auditHistory.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No changes yet</p>
                            ) : (
                              auditHistory.map((log) => {
                                const formatValue = (value: any): string => {
                                  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                                  if (typeof value === 'number') return value.toLocaleString('en-IN');
                                  if (typeof value === 'string' && value.includes('-') && value.match(/\d{4}-\d{2}-\d{2}/)) {
                                    return format(new Date(value), 'MMM d, yyyy');
                                  }
                                  return String(value);
                                };

                                const getFieldLabel = (key: string): string => {
                                  const labels: Record<string, string> = {
                                    'total_sqft': 'Total Sqft',
                                    'rate_per_sqft': 'Rate/Sqft (₹)',
                                    'gst_enabled': 'GST Enabled',
                                    'profit_percentage': 'Profit %',
                                    'expected_completion_date': 'Expected Completion',
                                    'final_amount': 'Final Amount (₹)',
                                  };
                                  return labels[key] || key.replace(/_/g, ' ').toUpperCase();
                                };

                                return (
                                  <div key={log.id} className="border-l-4 border-primary p-3 bg-muted rounded">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="font-semibold text-sm">{log.action_type}</p>
                                      <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "MMM d, HH:mm")}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">By: {log.user_id?.full_name || "Unknown"}</p>
                                    <div className="space-y-2">
                                      {log.old_value && log.new_value && (
                                        <>
                                          {Object.keys(log.new_value).map((key) => {
                                            const oldVal = log.old_value[key];
                                            const newVal = log.new_value[key];
                                            if (oldVal === newVal) return null;
                                            return (
                                              <div key={key} className="text-xs space-y-1">
                                                <p className="font-semibold text-muted-foreground">{getFieldLabel(key)}</p>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-red-600 line-through">{formatValue(oldVal)}</span>
                                                  <span>→</span>
                                                  <span className="text-green-600 font-semibold">{formatValue(newVal)}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Project Details: {project.lead_id?.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Client Info</p>
                              <p className="font-semibold text-sm">{project.lead_id?.name}</p>
                              <p className="text-xs text-muted-foreground">{project.lead_id?.phone} | {project.lead_id?.location}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Total Sqft</p>
                                <p className="font-semibold">{project.total_sqft.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Rate/Sqft</p>
                                <p className="font-semibold">₹{parseFloat(project.rate_per_sqft).toFixed(0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
                                <p className="font-semibold">₹{project.final_amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">GST</p>
                                <p className="font-semibold">{project.gst_enabled ? "Yes (18%)" : "No"}</p>
                              </div>
                              {project.profit_percentage && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Profit %</p>
                                  <p className="font-semibold">{project.profit_percentage}%</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge className={statusColors[project.status]}>
                                  {project.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Expected Completion</p>
                              <p className="font-semibold">
                                {format(new Date(project.expected_completion_date), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
