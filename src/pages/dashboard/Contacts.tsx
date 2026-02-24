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
import { supabase } from "@/lib/supabase";
import { Phone, MapPin, RefreshCw, Calendar, MessageSquare, PhoneCall } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadContacts = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
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
      console.error("Error updating status:", error);
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
        { event: "*", schema: "public", table: "leads" },
        () => {
          loadContacts();
          toast({
            title: "Updated",
            description: "New contact received",
          });
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
        <div className="grid gap-6">
          {leads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No contact submissions yet</p>
              </CardContent>
            </Card>
          ) : (
            leads.map((lead) => (
              <Card
                key={lead.id}
                className="hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className={`h-1 ${getStatusColor(lead.status)}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{lead.name}</CardTitle>
                        <Badge variant="secondary" className={`${getStatusColor(lead.status)} text-white`}>
                          {lead.status}
                        </Badge>
                      </div>
                      {lead.message && (
                        <p className="text-sm text-muted-foreground italic">
                          "{lead.message}"
                        </p>
                      )}
                    </div>
                    <div className="w-48">
                      <Select
                        value={lead.status}
                        onValueChange={(newStatus) => updateContactStatus(lead.id, newStatus)}
                        disabled={updatingId === lead.id}
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Phone */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{lead.phone}</p>
                        <Button
                          onClick={() => window.location.href = `tel:${lead.phone}`}
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                      <p className="font-medium text-sm">{lead.location}</p>
                    </div>

                    {/* Project Type */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Project Type</p>
                      <p className="font-medium text-sm capitalize">{lead.project_type}</p>
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted</span>
                      </div>
                      <p className="font-medium text-sm">
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </p>
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
