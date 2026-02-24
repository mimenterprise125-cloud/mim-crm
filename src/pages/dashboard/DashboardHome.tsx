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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Total Leads</p>
                  <p className="text-xl font-bold">{stats.totalLeads}</p>
                </div>
                <Users className="h-5 w-5 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">New Leads</p>
                  <p className="text-xl font-bold text-orange-600">{stats.newLeads}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Converted</p>
                  <p className="text-xl font-bold text-green-600">{stats.convertedLeads}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Conv. Rate</p>
                  <p className="text-xl font-bold text-purple-600">
                    {stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Row 2: Projects */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Total Projects</p>
                  <p className="text-xl font-bold">{stats.totalProjects}</p>
                </div>
                <Briefcase className="h-5 w-5 text-indigo-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Active</p>
                  <p className="text-xl font-bold text-blue-600">{stats.activeProjects}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Completed</p>
                  <p className="text-xl font-bold text-green-600">{stats.completedProjects}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">On Track %</p>
                  <p className="text-xl font-bold text-blue-600">
                    {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Row 3: Payments */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Total Payments</p>
                  <p className="text-xl font-bold">{stats.totalPayments}</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-lg font-bold">₹{(stats.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <DollarSign className="h-5 w-5 text-indigo-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Received</p>
                  <p className="text-lg font-bold text-green-600">₹{(stats.paidAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Remaining</p>
                  <p className="text-lg font-bold text-orange-600">₹{(stats.pendingAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads Section */}
        <div>
          <h2 className="text-lg font-heading font-bold mb-2">Recent Leads</h2>
          <Card>
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No recent leads</div>
              ) : (
                <div className="divide-y">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{lead.name}</p>
                            <Badge className="text-[10px] px-1.5 py-0.5">{lead.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-0.5 truncate">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-0.5 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.location}</span>
                            </div>
                            <div className="truncate">{lead.project_type}</div>
                            <div>{format(new Date(lead.created_at), 'MMM d')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments Section */}
        <div>
          <h2 className="text-lg font-heading font-bold mb-2">Recent Payments</h2>
          <Card>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No recent payments</div>
              ) : (
                <div className="divide-y">
                  {payments.map((payment) => (
                    <div key={payment.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="font-semibold text-sm">₹{parseFloat(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            <Badge className="text-[10px] px-1.5 py-0.5">{payment.type}</Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{payment.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                            <div>Pay: {format(new Date(payment.payment_date), 'MMM d')}</div>
                            <div>
                              {payment.next_payment_due_date ? `Due: ${format(new Date(payment.next_payment_due_date), 'MMM d')}` : 'No pending'}
                            </div>
                            {payment.notes && <div className="col-span-full truncate">{payment.notes}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Section */}
        <div>
          <h2 className="text-lg font-heading font-bold mb-2">Recent Projects</h2>
          <Card>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No recent projects</div>
              ) : (
                <div className="divide-y">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="font-semibold text-sm">{project.lead_id?.name}</p>
                            <Badge className={
                              project.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                              project.status === "ACTIVE" ? "bg-blue-100 text-blue-800" :
                              project.status === "DELAYED" ? "bg-red-100 text-red-800" :
                              project.status === "ON_HOLD" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                            <div>Location: {project.lead_id?.location}</div>
                            <div>₹{(project.final_amount || 0).toLocaleString('en-IN')}</div>
                            <div>Due: {format(new Date(project.expected_completion_date), 'MMM d, yy')}</div>
                            <div>{project.total_sqft} sqft</div>
                            <div>₹{parseFloat(project.rate_per_sqft).toFixed(0)}/sqft</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={showStatusDialog && selectedProject?.id === project.id} onOpenChange={setShowStatusDialog}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => setSelectedProject(project)}
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                              >
                                Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Change Project Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={handleProjectStatusChange} disabled={statusChanging}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={selectedProject?.status || "Select status"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="DELAYED">Delayed</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={showMessageDialog && selectedProject?.id === project.id} onOpenChange={setShowMessageDialog}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedProject(project)}
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Msg
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Send WhatsApp Message</DialogTitle>
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
                                    placeholder="Type your message here..."
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              )}

                              <Button onClick={sendMessageToProject} disabled={submitting} className="w-full gap-2">
                                <Send className="h-4 w-4" />
                                {submitting ? "Sending..." : "Send Message"}
                              </Button>
                            </div>
                          </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
