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
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, CheckCircle, XCircle, Search, RefreshCw, Eye, Plus } from "lucide-react";
import { format } from "date-fns";

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

export default function Sales() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    project_type: "",
    message: "",
  });

  useEffect(() => {
    loadLeads();
    setupRealtimeSubscription();
  }, []);

  const isLeadCompleted = (leadId: string) => {
    const leadProject = projects.find(p => p.lead_id === leadId);
    return leadProject?.status === 'COMPLETED' || false;
  };

  const loadLeads = async () => {
    try {
      setRefreshing(true);
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Load projects to check for COMPLETED status
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*");

      setLeads(leadsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const leadsSubscription = supabase
      .channel("leads-sales")
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

    const projectsSubscription = supabase
      .channel("projects-sales")
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
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));

      toast({
        title: "Success",
        description: "Lead status updated",
      });

      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const handleAddLead = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.location || !formData.project_type) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

      const { error } = await supabase.from("leads").insert([
        {
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          project_type: formData.project_type,
          message: formData.message,
          status: "NEW",
          source: "MANUAL",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead created successfully",
      });

      setFormData({
        name: "",
        phone: "",
        location: "",
        project_type: "",
        message: "",
      });
      setShowAddDialog(false);
      await loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    converted: leads.filter((l) => l.status === "CONVERTED").length,
    lost: leads.filter((l) => l.status === "LOST").length,
    conversionRate:
      leads.length > 0
        ? ((leads.filter((l) => l.status === "CONVERTED").length / leads.length) * 100).toFixed(1)
        : 0,
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
          <h1 className="text-4xl font-heading font-bold">Sales Dashboard</h1>
          <div className="h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground">Track all leads and manage sales pipeline</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">New Leads</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-green-600">{stats.converted}</div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Lost</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-red-600">{stats.lost}</div>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Conv. Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-purple-600">{stats.conversionRate}%</div>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
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
          <Button onClick={loadLeads} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name *</label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone *</label>
                  <Input
                    placeholder="e.g., 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location *</label>
                  <Input
                    placeholder="e.g., Delhi, Mumbai"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Project Type *</label>
                  <Select value={formData.project_type} onValueChange={(val) => setFormData({ ...formData, project_type: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOOR">Door</SelectItem>
                      <SelectItem value="WINDOW">Window</SelectItem>
                      <SelectItem value="PARTITION">Partition</SelectItem>
                      <SelectItem value="SLIDING_SYSTEM">Sliding System</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                  <Textarea
                    placeholder="Additional notes or message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddLead} disabled={submitting} className="w-full">
                  {submitting ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leads Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mr-3" />
                <p className="text-muted-foreground">No leads found</p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                    {/* Name */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="font-semibold text-sm">{lead.name}</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="font-semibold text-sm">{lead.phone}</p>
                    </div>

                    {/* Location */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-semibold text-sm">{lead.location}</p>
                    </div>

                    {/* Project Type */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Project</p>
                      <p className="font-semibold text-sm capitalize">{lead.project_type}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      {lead.status === 'COMPLETED' || isLeadCompleted(lead.id) ? (
                        <div className="h-8 px-3 py-1 rounded border border-input bg-muted text-sm text-muted-foreground flex items-center">
                          Project Completed
                        </div>
                      ) : (
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) => updateLeadStatus(lead.id, newStatus)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                            <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
                            <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
                            <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                            <SelectItem value="LOST">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Dialog open={showDetails && selectedLead?.id === lead.id} onOpenChange={setShowDetails}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedLead(lead)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Lead Details</DialogTitle>
                          </DialogHeader>
                          {selectedLead && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Name</p>
                                <p className="font-semibold">{selectedLead.name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                <p className="font-semibold">{selectedLead.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Location</p>
                                <p className="font-semibold">{selectedLead.location}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Project Type</p>
                                <p className="font-semibold capitalize">{selectedLead.project_type}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                {selectedLead.status !== 'COMPLETED' && (
                                  <Badge className={statusColors[selectedLead.status]}>
                                    {selectedLead.status}
                                  </Badge>
                                )}
                                {selectedLead.status === 'COMPLETED' && (
                                  <p className="text-sm text-muted-foreground">Project Completed</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Message</p>
                                <p className="font-semibold text-sm">{selectedLead.message}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Source</p>
                                <Badge variant="outline">{selectedLead.source}</Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Date</p>
                                <p className="font-semibold">
                                  {format(new Date(selectedLead.created_at), "MMM d, yyyy HH:mm")}
                                </p>
                              </div>
                            </div>
                          )}
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
