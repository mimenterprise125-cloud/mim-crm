import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Phone, MapPin, RefreshCw, Calendar, MessageSquare, PhoneCall, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface Lead {
  id: string;
  name: string;
  phone: string;
  location: string;
  project_type: string;
  message: string;
  status: string;
  source: string;
  created_at: string;
}

export default function Contacts() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { toast } = useToast();

  const loadContacts = async () => {
    try {
      setRefreshing(true);
      
      let leadsData = [];
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          leadsData = data;
          setLeads(data);
        }
      } catch (err) {
        // Error loading leads
      }
      
      // Load projects to check for COMPLETED status
      try {
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*");

        if (projectsData) {
          setProjects(projectsData);
        }
      } catch (err) {
        setProjects([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const isLeadCompleted = (leadId: string) => {
    const leadProject = projects.find(p => p.lead_id === leadId);
    return leadProject?.status === 'COMPLETED' || false;
  };

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      setUpdatingId(contactId);
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", contactId);

      if (error) throw error;

      setLeads(
        leads.map((lead) =>
          lead.id === contactId ? { ...lead, status: newStatus } : lead
        )
      );

      toast({
        title: "Success",
        description: `Contact status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadContacts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload: any) => {
          const newLead = payload.new as Lead;
          setLeads((prevLeads) => [newLead, ...prevLeads]);
          toast({
            title: "New Contact",
            description: `${newLead.name} has submitted a contact form`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload: any) => {
          const updatedLead = payload.new as Lead;
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
          const deletedLead = payload.old as Lead;
          setLeads((prevLeads) =>
            prevLeads.filter((lead) => lead.id !== deletedLead.id)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      NEW: "bg-red-500",
      CONTACTED: "bg-blue-500",
      FOLLOW_UP: "bg-yellow-500",
      SITE_VISIT: "bg-purple-500",
      QUOTATION_SENT: "bg-indigo-500",
      NEGOTIATION: "bg-orange-500",
      CONVERTED: "bg-green-500",
      LOST: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-primary mx-auto animate-spin mb-2" />
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-bold">Contact Submissions</h1>
          <div className="h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground">
            Manage all customer inquiries and track their status
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total submissions: <span className="font-semibold text-foreground">{leads.length}</span>
          </div>
          <Button
            onClick={() => loadContacts()}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Contacts Grid */}
        <div className="space-y-6">
          {leads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No contact submissions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map((lead) => (
                <Card
                  key={lead.id}
                  className="hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowDetailModal(true);
                  }}
                >
                  <div className={`h-1 ${lead.status === 'COMPLETED' ? 'bg-emerald-500' : lead.status === 'CONVERTED' ? 'bg-green-500' : lead.status === 'CONTACTED' ? 'bg-yellow-500' : lead.status === 'FOLLOW_UP' ? 'bg-purple-500' : lead.status === 'SITE_VISIT' ? 'bg-indigo-500' : lead.status === 'QUOTATION_SENT' ? 'bg-orange-500' : lead.status === 'NEGOTIATION' ? 'bg-cyan-500' : lead.status === 'LOST' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CardTitle className="text-lg truncate">{lead.name}</CardTitle>
                          {lead.status !== 'COMPLETED' && (
                            <Badge className={`${statusColors[lead.status]} shrink-0`}>
                              {lead.status}
                            </Badge>
                          )}
                        </div>
                        {lead.message && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            "{lead.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{lead.phone}</p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{lead.location}</p>
                    </div>

                    {/* Project Type */}
                    <div>
                      <p className="text-xs text-muted-foreground">Project Type</p>
                      <p className="font-medium text-sm capitalize">{lead.project_type}</p>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-xs">
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>{selectedLead?.name}</DialogTitle>
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Status Section */}
              <div className="space-y-2">
                <h3 className="font-semibold">Status</h3>
                {selectedLead.status === 'COMPLETED' || isLeadCompleted(selectedLead.id) ? (
                  <div className="p-3 bg-green-100 rounded text-green-800">
                    Project Completed
                  </div>
                ) : (
                  <Select
                    value={selectedLead.status}
                    onValueChange={(newStatus) => {
                      updateContactStatus(selectedLead.id, newStatus);
                      setShowDetailModal(false);
                    }}
                    disabled={updatingId === selectedLead.id}
                  >
                    <SelectTrigger>
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

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Phone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{selectedLead.phone}</p>
                    <Button
                      onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Call this number"
                    >
                      <PhoneCall className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Location</span>
                  </div>
                  <p className="text-sm">{selectedLead.location}</p>
                </div>

                {/* Project Type */}
                <div className="space-y-2">
                  <span className="font-semibold">Project Type</span>
                  <p className="text-sm capitalize">{selectedLead.project_type}</p>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <span className="font-semibold">Source</span>
                  <p className="text-sm capitalize">{selectedLead.source}</p>
                </div>

                {/* Submitted Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Submitted</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(selectedLead.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Message</span>
                  </div>
                  <p className="text-sm bg-muted p-3 rounded">{selectedLead.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
