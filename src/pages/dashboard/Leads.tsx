import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Eye, MessageSquare } from "lucide-react";
import { leadService } from "@/services/leadService";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  FOLLOW_UP: "bg-purple-100 text-purple-800",
  SITE_VISIT: "bg-indigo-100 text-indigo-800",
  QUOTATION_SENT: "bg-orange-100 text-orange-800",
  NEGOTIATION: "bg-cyan-100 text-cyan-800",
  CONVERTED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  LOST: "bg-red-100 text-red-800",
};

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    total_sqft: "",
    rate_per_sqft: "",
    gst_enabled: true,
    profit_percentage: "",
    expected_completion_date: "",
  });
  const [submittingProject, setSubmittingProject] = useState(false);

  useEffect(() => {
    loadLeads();

    // Subscribe to real-time changes in leads
    const leadsSubscription = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload: any) => {
          const newLead = payload.new;
          setLeads((prevLeads) => [newLead, ...prevLeads]);
          toast({
            title: "New Lead",
            description: `${newLead.name} has submitted a contact form`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload: any) => {
          const updatedLead = payload.new;
          setLeads((prevLeads) =>
            prevLeads.map((lead) =>
              lead.id === updatedLead.id ? updatedLead : lead
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload: any) => {
          const deletedLead = payload.old;
          setLeads((prevLeads) =>
            prevLeads.filter((lead) => lead.id !== deletedLead.id)
          );
        }
      )
      .subscribe();

    // Subscribe to real-time changes in projects
    const projectsSubscription = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        async () => {
          const { data: projectsData } = await supabase
            .from("projects")
            .select("*");
          setProjects(projectsData || []);
        }
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
    };
  }, [statusFilter]);

  const isLeadCompleted = (leadId: string) => {
    const leadProject = projects.find(p => p.lead_id === leadId);
    return leadProject?.status === 'COMPLETED' || false;
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      try {
        const filters: any = { limit: 100 };
        if (statusFilter !== "ALL") {
          filters.status = statusFilter;
        }
        const result = await leadService.getLeads(filters);
        if (result.success && result.data) {
          setLeads(result.data);
        }
      } catch (err) {
        setLeads([]);
      }

      // Load projects to check for COMPLETED status
      try {
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*");
        setProjects(projectsData || []);
      } catch (err) {
        setProjects([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    return matchSearch;
  });

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      if (!user) return;
      
      // If status is CONVERTED, show project creation dialog instead
      if (status === "CONVERTED") {
        const lead = leads.find(l => l.id === leadId);
        setSelectedLead(lead);
        setShowProjectDialog(true);
        // Reset form
        setProjectFormData({
          total_sqft: "",
          rate_per_sqft: "",
          gst_enabled: true,
          profit_percentage: "",
          expected_completion_date: "",
        });
        return;
      }

      // For other statuses, just update the lead status
      const result = await leadService.updateLeadStatus(
        leadId,
        status,
        user.id
      );
      if (result.success) {
        toast({ title: "Success", description: "Lead status updated" });
        loadLeads();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!selectedLead || !user) return;
      
      // Validate all required fields
      if (!projectFormData.total_sqft || !projectFormData.rate_per_sqft || !projectFormData.expected_completion_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Sqft, Rate, Completion Date)",
          variant: "destructive",
        });
        return;
      }

      // Validate fields are valid numbers
      const sqft = parseFloat(projectFormData.total_sqft);
      const rate = parseFloat(projectFormData.rate_per_sqft);
      
      if (isNaN(sqft) || sqft <= 0) {
        toast({
          title: "Error",
          description: "Sqft must be a valid positive number",
          variant: "destructive",
        });
        return;
      }

      if (isNaN(rate) || rate <= 0) {
        toast({
          title: "Error",
          description: "Rate must be a valid positive number",
          variant: "destructive",
        });
        return;
      }

      setSubmittingProject(true);

      const { supabase } = await import("@/lib/supabase");

      // Calculate final amount with GST
      const baseAmount = sqft * rate;
      const finalAmount = projectFormData.gst_enabled ? baseAmount * 1.18 : baseAmount;

      // First, create the project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            lead_id: selectedLead.id,
            total_sqft: sqft,
            rate_per_sqft: rate,
            gst_enabled: projectFormData.gst_enabled,
            final_amount: finalAmount,
            profit_percentage: projectFormData.profit_percentage ? parseFloat(projectFormData.profit_percentage) : null,
            expected_completion_date: projectFormData.expected_completion_date,
            status: "ACTIVE",
          },
        ])
        .select();

      if (projectError) throw projectError;

      // Then update the lead status to CONVERTED
      const statusResult = await leadService.updateLeadStatus(
        selectedLead.id,
        "CONVERTED",
        user.id
      );

      if (statusResult.success) {
        toast({
          title: "Success",
          description: `Project created and lead converted to CONVERTED status`,
        });
        setShowProjectDialog(false);
        loadLeads();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      if (!user || !selectedLead || !whatsappMessage.trim()) return;
      setSendingMessage(true);
      const result = await whatsappService.sendMessage(
        selectedLead.id,
        whatsappMessage,
        user.id
      );
      if (result.success) {
        toast({
          title: "Success",
          description: "Message sent via WhatsApp",
        });
        setWhatsappMessage("");
        setSelectedLead(null);
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading leads...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Leads</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your sales leads
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
                  <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">
                      Location
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Project Type
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">{lead.name}</td>
                      <td className="p-3 hidden md:table-cell">{lead.phone}</td>
                      <td className="p-3 hidden md:table-cell">{lead.location}</td>
                      <td className="p-3">
                        {lead.status === 'COMPLETED' || isLeadCompleted(lead.id) ? (
                          <span className="text-xs text-muted-foreground">Project Completed</span>
                        ) : (
                          <Badge
                            className={
                              statusColors[lead.status] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {lead.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 hidden lg:table-cell capitalize">
                        {lead.project_type}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="font-heading">
                                  Lead Details: {selectedLead?.name}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedLead && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Phone:
                                      </span>{" "}
                                      {selectedLead.phone}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Location:
                                      </span>{" "}
                                      {selectedLead.location}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Project:
                                      </span>{" "}
                                      {selectedLead.project_type}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Created:
                                      </span>{" "}
                                      {new Date(
                                        selectedLead.created_at
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-1.5 block">
                                      Status
                                    </label>
                                    {selectedLead?.status === 'COMPLETED' || isLeadCompleted(selectedLead?.id) ? (
                                      <div className="px-3 py-2 rounded border border-input bg-muted text-sm text-muted-foreground">
                                        Project Completed
                                      </div>
                                    ) : (
                                      <Select
                                        defaultValue={selectedLead.status}
                                        onValueChange={(status) =>
                                          handleStatusChange(
                                            selectedLead.id,
                                            status
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="NEW">New</SelectItem>
                                          <SelectItem value="CONTACTED">
                                            Contacted
                                          </SelectItem>
                                          <SelectItem value="FOLLOW_UP">
                                            Follow Up
                                          </SelectItem>
                                          <SelectItem value="SITE_VISIT">
                                            Site Visit
                                          </SelectItem>
                                          <SelectItem value="QUOTATION_SENT">
                                            Quotation Sent
                                          </SelectItem>
                                          <SelectItem value="NEGOTIATION">
                                            Negotiation
                                          </SelectItem>
                                          <SelectItem value="CONVERTED">
                                            Converted
                                          </SelectItem>
                                          <SelectItem value="LOST">Lost</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-1.5 block">
                                      Message
                                    </label>
                                    <p className="text-sm p-2 rounded bg-muted/50">
                                      {selectedLead.message || "No message"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="font-heading">
                                  Send WhatsApp Message
                                </DialogTitle>
                              </DialogHeader>
                              {selectedLead && (
                                <div className="space-y-4">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      To:
                                    </span>{" "}
                                    {selectedLead.name} ({selectedLead.phone})
                                  </div>
                                  <Textarea
                                    placeholder="Type your message..."
                                    value={whatsappMessage}
                                    onChange={(e) =>
                                      setWhatsappMessage(e.target.value)
                                    }
                                    rows={4}
                                  />
                                  <Button
                                    onClick={handleSendWhatsApp}
                                    disabled={
                                      !whatsappMessage.trim() ||
                                      sendingMessage
                                    }
                                    className="w-full"
                                  >
                                    {sendingMessage
                                      ? "Sending..."
                                      : "Send Message"}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                No leads found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Project Dialog */}
        <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project for {selectedLead?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Total Sqft *</label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={projectFormData.total_sqft}
                  onChange={(e) => setProjectFormData({ ...projectFormData, total_sqft: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rate per Sqft (₹) *</label>
                <Input
                  type="number"
                  placeholder="e.g., 250"
                  value={projectFormData.rate_per_sqft}
                  onChange={(e) => setProjectFormData({ ...projectFormData, rate_per_sqft: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">GST</label>
                <Select value={projectFormData.gst_enabled ? "yes" : "no"} onValueChange={(val) => setProjectFormData({ ...projectFormData, gst_enabled: val === "yes" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes (18% GST)</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {projectFormData.rate_per_sqft && projectFormData.total_sqft && (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Base Amount</p>
                    <p className="font-semibold">₹{(parseFloat(projectFormData.total_sqft) * parseFloat(projectFormData.rate_per_sqft)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  {projectFormData.gst_enabled && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Final Amount (with 18% GST)</p>
                      <p className="font-semibold">₹{(parseFloat(projectFormData.total_sqft) * parseFloat(projectFormData.rate_per_sqft) * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Profit Percentage (%)</label>
                <Input
                  type="number"
                  placeholder="e.g., 15"
                  value={projectFormData.profit_percentage}
                  onChange={(e) => setProjectFormData({ ...projectFormData, profit_percentage: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Expected Completion Date *</label>
                <Input
                  type="date"
                  value={projectFormData.expected_completion_date}
                  onChange={(e) => setProjectFormData({ ...projectFormData, expected_completion_date: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleCreateProject} 
                disabled={
                  submittingProject || 
                  !projectFormData.total_sqft || 
                  !projectFormData.rate_per_sqft || 
                  !projectFormData.expected_completion_date ||
                  parseFloat(projectFormData.total_sqft) <= 0 ||
                  parseFloat(projectFormData.rate_per_sqft) <= 0
                } 
                className="w-full"
              >
                {submittingProject ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
