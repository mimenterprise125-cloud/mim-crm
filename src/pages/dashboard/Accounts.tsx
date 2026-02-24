import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Eye, Phone, MapPin, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function Accounts() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadLeads();
    setupRealtimeSubscription();
  }, []);

  const loadLeads = async () => {
    try {
      setRefreshing(true);
      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("status", "CONVERTED")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Load projects and payments
      if (leadsData && leadsData.length > 0) {
        const leadIds = leadsData.map((l) => l.id);
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .in("lead_id", leadIds);

        // Load payments for these projects
        const allPayments: any[] = [];
        if (projectsData && projectsData.length > 0) {
          const projectIds = projectsData.map((p) => p.id);
          const { data: paymentsData } = await supabase
            .from("payments")
            .select("*")
            .in("project_id", projectIds);

          if (paymentsData) allPayments.push(...paymentsData);
        }

        // Attach projects to leads
        const leadsWithProjects = leadsData.map((lead) => ({
          ...lead,
          projects: projectsData?.filter((p) => p.lead_id === lead.id) || [],
        }));

        setLeads(leadsWithProjects);
        setPayments(allPayments);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("accounts")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        loadLeads();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const getProjectPayments = (projectId: string) => {
    return payments.filter((p) => p.project_id === projectId);
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
          <h1 className="text-4xl font-heading font-bold">Accounts Dashboard</h1>
          <div className="h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground">Track all converted leads with project details and payment history</p>
        </div>

        {/* Refresh Button */}
        <Button onClick={loadLeads} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {leads.length === 0 ? (
            <Card className="border-dashed col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No converted leads found</p>
              </CardContent>
            </Card>
          ) : (
            leads.map((lead) => (
              <Dialog key={lead.id} open={showDetails && selectedLead?.id === lead.id} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <div
                    onClick={() => setSelectedLead(lead)}
                    className="p-4 rounded-lg border border-muted hover:shadow-md cursor-pointer transition-all hover:border-primary/50"
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{lead.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {lead.location}
                      </div>
                      <Badge className="bg-green-100 text-green-800">CONVERTED</Badge>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{lead.name} - Account Details</DialogTitle>
                  </DialogHeader>

                  {selectedLead && (
                    <div className="space-y-6">
                      {/* Lead Information */}
                      <div>
                        <h3 className="font-semibold mb-3">Lead Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Name</p>
                            <p className="font-medium">{selectedLead.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Phone</p>
                            <p className="font-medium">{selectedLead.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Location</p>
                            <p className="font-medium">{selectedLead.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge className="bg-green-100 text-green-800">CONVERTED</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Projects Section */}
                      <div>
                        <h3 className="font-semibold mb-3">Projects</h3>
                        <div className="space-y-3">
                          {leads.find((l) => l.id === selectedLead.id)?.projects && leads.find((l) => l.id === selectedLead.id)?.projects.length > 0 ? (
                            leads
                              .find((l) => l.id === selectedLead.id)
                              ?.projects.map((project: any) => {
                                const projectPayments = getProjectPayments(project.id);
                                const totalPaid = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                                const outstanding = (project.final_amount || 0) - totalPaid;

                                return (
                                  <Card key={project.id} className="p-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-sm">₹{(project.final_amount || 0).toLocaleString("en-IN")}</p>
                                          <p className="text-xs text-muted-foreground">{project.total_sqft} sqft @ ₹{parseFloat(project.rate_per_sqft).toFixed(0)}/sqft</p>
                                        </div>
                                        <Badge
                                          className={
                                            project.status === "COMPLETED"
                                              ? "bg-green-100 text-green-800"
                                              : project.status === "ACTIVE"
                                              ? "bg-blue-100 text-blue-800"
                                              : project.status === "DELAYED"
                                              ? "bg-red-100 text-red-800"
                                              : project.status === "ON_HOLD"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-gray-100 text-gray-800"
                                          }
                                        >
                                          {project.status}
                                        </Badge>
                                      </div>

                                      {/* Payment Summary */}
                                      <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                                        <div>
                                          <p className="text-muted-foreground mb-1">Total</p>
                                          <p className="font-semibold">₹{(project.final_amount || 0).toLocaleString("en-IN")}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground mb-1">Paid</p>
                                          <p className="font-semibold text-green-600">₹{totalPaid.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground mb-1">Outstanding</p>
                                          <p className="font-semibold text-red-600">₹{outstanding.toLocaleString("en-IN")}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })
                          ) : (
                            <p className="text-xs text-muted-foreground">No projects found</p>
                          )}
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <h3 className="font-semibold mb-3">Payment History</h3>
                        <div className="space-y-2">
                          {payments.length > 0 && payments.some((p) => p.project_id) ? (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="p-2 text-left font-medium text-xs">Date</th>
                                    <th className="p-2 text-left font-medium text-xs">Amount</th>
                                    <th className="p-2 text-left font-medium text-xs">Type</th>
                                    <th className="p-2 text-left font-medium text-xs">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments
                                    .filter((p) =>
                                      leads
                                        .find((l) => l.id === selectedLead.id)
                                        ?.projects?.some((proj: any) => proj.id === p.project_id)
                                    )
                                    .map((payment) => (
                                      <tr key={payment.id} className="border-t hover:bg-muted/50">
                                        <td className="p-2">{format(new Date(payment.payment_date), "MMM d, yy")}</td>
                                        <td className="p-2 font-semibold">₹{(payment.amount || 0).toLocaleString("en-IN")}</td>
                                        <td className="p-2 text-xs">{payment.type}</td>
                                        <td className="p-2">
                                          <Badge
                                            className={
                                              payment.status === "PAID"
                                                ? "bg-green-100 text-green-800"
                                                : payment.status === "PENDING"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : payment.status === "DUE"
                                                ? "bg-orange-100 text-orange-800"
                                                : payment.status === "OVERDUE"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                            }
                                          >
                                            {payment.status}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No payments recorded yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
