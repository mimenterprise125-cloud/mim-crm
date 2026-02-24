import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Briefcase, RefreshCw, DollarSign, AlertCircle, CheckCircle, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectWhatsappService } from "@/services/projectWhatsappService";

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalPayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [messageType, setMessageType] = useState("custom");
  const [customMessage, setCustomMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const sendMessageToProject = async () => {
    try {
      if (!selectedProject) return;

      setSubmitting(true);

      // Extract lead ID properly
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

  const handleProjectStatusChange = async (newStatus: string) => {
    try {
      if (!selectedProject) return;

      setStatusChanging(true);

      // Update project status
      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', selectedProject.id);

      if (projectError) throw projectError;

      // If project is marked COMPLETED, also update lead status to COMPLETED
      if (newStatus === 'COMPLETED') {
        const leadId = typeof selectedProject.lead_id === 'string'
          ? selectedProject.lead_id
          : selectedProject.lead_id?.id;

        if (leadId) {
          const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'COMPLETED' })
            .eq('id', leadId);

          if (leadError) console.error('Error updating lead status:', leadError);
        }
      }

      toast({
        title: "Success",
        description: `Project status updated to ${newStatus}${newStatus === 'COMPLETED' ? ' and lead marked as Completed' : ''}`,
        variant: "default"
      });

      setShowStatusDialog(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      });
    } finally {
      setStatusChanging(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const leadsSubscription = supabase
      .channel('leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadDashboardData();
      })
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  };

  const loadDashboardData = async () => {
    try {
      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!leadsError && leadsData) {
        setLeads(leadsData);
      }

      // Load projects with lead info
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          lead_id (
            id,
            name,
            phone,
            location
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!projectsError && projectsData) {
        // Filter to only show complete projects (with all required fields filled)
        const completeProjects = projectsData.filter(project => {
          return project.total_sqft && 
                 project.rate_per_sqft && 
                 project.expected_completion_date &&
                 project.total_sqft > 0 &&
                 project.rate_per_sqft > 0;
        });
        setProjects(completeProjects);
      }

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

      // Calculate stats
      const totalPayments = paymentsData?.length || 0;
      
      // Calculate total project amount (sum of all final_amounts from projects)
      const totalAmount = projectsData?.reduce((sum: number, p: any) => sum + parseFloat(p.final_amount || 0), 0) || 0;
      
      // Calculate received amount (sum of all payment amounts collected so far)
      const receivedAmount = paymentsData?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
      
      // Calculate pending/remaining amount (total project amount - received amount)
      const pendingAmount = totalAmount - receivedAmount;

      // Log for debugging
      console.log('Dashboard Stats:', {
        totalAmount,
        receivedAmount,
        pendingAmount,
        paymentsData: paymentsData?.map((p: any) => ({ amount: p.amount, status: p.status }))
      });

      // Filter complete projects for stats
      const completeProjectsData = projectsData?.filter(project => {
        return project.total_sqft && 
               project.rate_per_sqft && 
               project.expected_completion_date &&
               project.total_sqft > 0 &&
               project.rate_per_sqft > 0;
      }) || [];

      const newStats: DashboardStats = {
        totalLeads: leadsData?.length || 0,
        newLeads: leadsData?.filter((l: any) => l.status === 'NEW').length || 0,
        convertedLeads: leadsData?.filter((l: any) => l.status === 'CONVERTED').length || 0,
        totalProjects: completeProjectsData.length,
        activeProjects: completeProjectsData.filter((p: any) => p.status === 'ACTIVE').length,
        completedProjects: completeProjectsData.filter((p: any) => p.status === 'COMPLETED').length,
        totalPayments: totalPayments,
        totalAmount: totalAmount,
        paidAmount: receivedAmount,
        pendingAmount: pendingAmount,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-heading font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to MIM Enterprises CRM</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Grid - Row 1: Leads */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lead Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-[11px] text-muted-foreground mb-1">Total Leads</p>
                <p className="text-xl font-bold">{stats.totalLeads}</p>
              </div>

              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-[11px] text-muted-foreground mb-1">New Leads</p>
                <p className="text-xl font-bold text-orange-600">{stats.newLeads}</p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-[11px] text-muted-foreground mb-1">Converted</p>
                <p className="text-xl font-bold text-green-600">{stats.convertedLeads}</p>
              </div>

              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-[11px] text-muted-foreground mb-1">Conv. Rate</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid - Row 2: Projects */}
        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Project Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-[11px] text-muted-foreground mb-1">Total Projects</p>
                <p className="text-xl font-bold">{stats.totalProjects}</p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-[11px] text-muted-foreground mb-1">Active</p>
                <p className="text-xl font-bold text-blue-600">{stats.activeProjects}</p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-[11px] text-muted-foreground mb-1">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completedProjects}</p>
              </div>

              <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                <p className="text-[11px] text-muted-foreground mb-1">On Track %</p>
                <p className="text-xl font-bold text-cyan-600">
                  {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid - Row 3: Payments */}
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-[11px] text-muted-foreground mb-1">Total Payments</p>
                <p className="text-xl font-bold">{stats.totalPayments}</p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-[11px] text-muted-foreground mb-1">Total Amount</p>
                <p className="text-lg font-bold">₹{(stats.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-[11px] text-muted-foreground mb-1">Received</p>
                <p className="text-lg font-bold text-emerald-600">₹{(stats.paidAmount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-[11px] text-muted-foreground mb-1">Remaining</p>
                <p className="text-lg font-bold text-amber-600">₹{(stats.pendingAmount || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads Section */}
        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No recent leads</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-min">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="flex-shrink-0 w-72 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{lead.name}</p>
                            <Badge className="text-[10px] px-2 py-0.5 flex-shrink-0">{lead.status}</Badge>
                          </div>
                          <div className="space-y-1.5 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.location}</span>
                            </div>
                            <div className="text-[10px]">Type: <span className="font-medium">{lead.project_type}</span></div>
                            <div className="text-[10px]">Added: <span className="font-medium">{format(new Date(lead.created_at), 'MMM d, yyyy')}</span></div>
                          </div>
                        </div>
                        {lead.message && (
                          <div className="pt-2 border-t text-[10px] text-muted-foreground line-clamp-2">
                            "{lead.message}"
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments Section */}
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No recent payments</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-min">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="flex-shrink-0 w-72 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-bold text-sm">₹{parseFloat(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            <Badge className="text-[10px] px-2 py-0.5">{payment.type}</Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-2 py-0.5 ${
                                payment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                payment.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="space-y-1.5 text-[10px] text-muted-foreground">
                            <div>Payment: <span className="font-medium">{format(new Date(payment.payment_date), 'MMM d, yyyy')}</span></div>
                            {payment.next_payment_due_date && (
                              <div>Due: <span className="font-medium">{format(new Date(payment.next_payment_due_date), 'MMM d, yyyy')}</span></div>
                            )}
                            {payment.notes && (
                              <div className="mt-2 pt-2 border-t line-clamp-2">"{payment.notes}"</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects Section */}
        <Card className="border-t-4 border-t-rose-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No recent projects</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-min">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className={`flex-shrink-0 w-72 hover:shadow-md transition-shadow border-l-4 ${
                        project.status === "COMPLETED" ? "border-l-green-500" :
                      project.status === "ACTIVE" ? "border-l-blue-500" :
                      project.status === "DELAYED" ? "border-l-red-500" :
                      project.status === "ON_HOLD" ? "border-l-yellow-500" :
                      "border-l-gray-500"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm truncate">{project.lead_id?.name}</p>
                          <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${
                            project.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            project.status === "ACTIVE" ? "bg-blue-100 text-blue-800" :
                            project.status === "DELAYED" ? "bg-red-100 text-red-800" :
                            project.status === "ON_HOLD" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{project.lead_id?.location}</span>
                          </div>
                          <div>Sqft: <span className="font-medium">{project.total_sqft?.toLocaleString()}</span></div>
                          <div>Amount: <span className="font-medium">₹{(project.final_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
                          <div>Due: <span className="font-medium">{format(new Date(project.expected_completion_date), 'MMM d, yyyy')}</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
