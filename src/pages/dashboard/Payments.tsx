import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { leadService } from "@/services/leadService";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const { toast } = useToast();
  const [addModal, setAddModal] = useState(false);
  const [partialModal, setPartialModal] = useState(false);
  const [convertedLeads, setConvertedLeads] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedProjectForPartial, setSelectedProjectForPartial] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState("");

  useEffect(() => {
    getCurrentUser();
    loadConvertedLeads();
    loadPayments();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('No authenticated user');
        setCurrentUserId(null);
      } else {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setCurrentUserId(null);
    }
  };

  const loadConvertedLeads = async () => {
    try {
      const result = await leadService.getLeads({ status: 'CONVERTED' });
      if (result.success && result.data) {
        setConvertedLeads(result.data);
      } else {
        setConvertedLeads([]);
      }
    } catch (error) {
      console.error('Error loading converted leads:', error);
      setConvertedLeads([]);
    }
  };

  const loadPayments = async () => {
    try {
      // Load payments with project and lead details
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          project:projects(
            lead_id,
            total_sqft,
            rate_per_sqft,
            final_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich payment data with lead information
      const enrichedPayments = await Promise.all(
        (data || []).map(async (payment: any) => {
          const leadId = payment.project.lead_id;
          const { data: leadData } = await supabase
            .from('leads')
            .select('name, phone')
            .eq('id', leadId)
            .single();

          return {
            ...payment,
            lead_id: leadId,
            lead_name: leadData?.name || 'Unknown',
            lead_phone: leadData?.phone || 'N/A',
            project_total: payment.project.final_amount
          };
        })
      );
      
      setPayments(enrichedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedLead || !amount || !type || !date) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const leadDetails = convertedLeads.find(l => l.id === selectedLead);
      if (!leadDetails) {
        toast({
          title: "Error",
          description: "Selected lead not found",
          variant: "destructive"
        });
        return;
      }

      // Get the project ID for this lead
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, final_amount')
        .eq('lead_id', selectedLead)
        .single();

      if (projectError || !projectData) {
        toast({
          title: "Error",
          description: "Project not found for this lead",
          variant: "destructive"
        });
        return;
      }

      const paymentAmount = parseFloat(amount);
      const projectTotal = projectData.final_amount || 0;
      const projectPayments = payments.filter(p => p.project_id === projectData.id);
      const totalPaid = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = projectTotal - totalPaid;

      // Validate payment amount doesn't exceed remaining balance
      if (paymentAmount > remaining) {
        toast({
          title: "Error",
          description: `Payment cannot exceed remaining balance of ₹${remaining.toLocaleString('en-IN')}`,
          variant: "destructive"
        });
        return;
      }

      if (paymentAmount <= 0) {
        toast({
          title: "Error",
          description: "Payment amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      const paymentStatus = type === 'FINAL' ? 'PAID' : 'PENDING';

      // Insert into payments table with correct schema
      const { error } = await supabase
        .from('payments')
        .insert([{
          project_id: projectData.id,
          amount: paymentAmount,
          type: type,
          payment_date: date,
          status: paymentStatus,
          notes: notes || null,
          created_by: currentUserId || null
        }]);

      if (error) throw error;

      // Reset form
      setSelectedLead("");
      setAmount("");
      setType("");
      setDate("");
      setNotes("");
      setAddModal(false);

      // Reload payments
      loadPayments();

      toast({
        title: "Success",
        description: `Payment of ₹${amount} added successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAddPayment = async (projectId: string, paymentType: 'PARTIAL' | 'FINAL') => {
    try {
      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('final_amount')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive"
        });
        return;
      }

      const projectPayments = payments.filter(p => p.project_id === projectId);
      const totalPaid = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const projectTotal = projectData.final_amount || 0;
      const remaining = projectTotal - totalPaid;

      if (remaining <= 0) {
        toast({
          title: "Info",
          description: "No remaining amount to collect",
          variant: "default"
        });
        return;
      }

      if (paymentType === 'PARTIAL') {
        // Open modal for partial payment input
        setSelectedProjectForPartial(projectId);
        setPartialAmount("");
        setPartialModal(true);
      } else {
        // Add full remaining amount as final payment
        const { error } = await supabase
          .from('payments')
          .insert([{
            project_id: projectId,
            amount: remaining,
            type: 'FINAL',
            payment_date: new Date().toISOString().split('T')[0],
            status: 'PAID',
            notes: 'Auto-generated final payment for remaining amount',
            created_by: currentUserId || null
          }]);

        if (error) throw error;

        loadPayments();

        toast({
          title: "Success",
          description: `Final payment of ₹${remaining.toLocaleString('en-IN')} added`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive"
      });
    }
  };

  const handleAddPartialPayment = async () => {
    if (!selectedProjectForPartial || !partialAmount) {
      toast({
        title: "Error",
        description: "Please enter partial amount",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(partialAmount);
      const projectPayments = payments.filter(p => p.project_id === selectedProjectForPartial);
      const totalPaid = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const { data: projectData } = await supabase
        .from('projects')
        .select('final_amount')
        .eq('id', selectedProjectForPartial)
        .single();

      const projectTotal = projectData?.final_amount || 0;
      const remaining = projectTotal - totalPaid - amount;

      if (amount > (projectTotal - totalPaid)) {
        toast({
          title: "Error",
          description: `Amount cannot exceed remaining balance of ₹${(projectTotal - totalPaid).toLocaleString('en-IN')}`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('payments')
        .insert([{
          project_id: selectedProjectForPartial,
          amount: amount,
          type: 'PARTIAL',
          payment_date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          notes: `Partial payment: ₹${amount.toLocaleString('en-IN')} | Remaining: ₹${remaining.toLocaleString('en-IN')}`,
          created_by: currentUserId || null
        }]);

      if (error) throw error;

      loadPayments();
      setPartialModal(false);
      setSelectedProjectForPartial(null);
      setPartialAmount("");

      toast({
        title: "Success",
        description: `Partial payment of ₹${amount.toLocaleString('en-IN')} added | Remaining: ₹${remaining.toLocaleString('en-IN')}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding partial payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive"
      });
    }
  };
  const getOutstandingBalance = (projectId: string) => {
    const projectPayments = payments.filter(p => p.project_id === projectId);
    const totalPaid = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const payment = projectPayments[0];
    const projectTotal = payment?.project_total || 0;
    const outstanding = projectTotal - totalPaid;
    return Math.max(0, outstanding);
  };

  const overduePayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const today = new Date();
    return paymentDate < today && p.status !== 'PAID';
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">Track and manage all payments</p>
          </div>
          <Button onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Payment</Button>
        </div>

        {overduePayments.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-sm">Overdue Payments</p>
                <p className="text-xs text-muted-foreground">
                  {overduePayments.map(p => p.lead_name).join(", ")} — ₹{overduePayments.reduce((s, p) => s + (p.outstanding_balance || 0), 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">Lead</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Outstanding</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{p.lead_name}</td>
                        <td className="p-3">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3"><Badge variant="outline">{p.type}</Badge></td>
                        <td className="p-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{p.notes ? p.notes.substring(0, 30) + (p.notes.length > 30 ? '...' : '') : '-'}</td>
                        <td className="p-3">₹{(getOutstandingBalance(p.project_id) || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3"><Badge className={p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{p.status}</Badge></td>
                        <td className="p-3 hidden lg:table-cell">
                          {p.status !== 'PAID' && getOutstandingBalance(p.project_id) > 0 && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleQuickAddPayment(p.project_id, 'PARTIAL')}
                              >
                                + Partial
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickAddPayment(p.project_id, 'FINAL')}
                              >
                                + Final
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Add Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Lead <span className="text-destructive">*</span></label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger><SelectValue placeholder="Select converted lead" /></SelectTrigger>
                <SelectContent>
                  {convertedLeads.length > 0 ? (
                    convertedLeads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} ({lead.phone})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No converted leads found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount (₹) <span className="text-destructive">*</span></label>
              <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type <span className="text-destructive">*</span></label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date <span className="text-destructive">*</span></label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea placeholder="Payment notes..." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleAddPayment}>Save Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Modal */}
      <Dialog open={partialModal} onOpenChange={setPartialModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Add Partial Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Partial Amount (₹) <span className="text-destructive">*</span></label>
              <Input 
                type="number" 
                placeholder="Enter partial payment amount" 
                value={partialAmount} 
                onChange={(e) => setPartialAmount(e.target.value)} 
              />
            </div>
            <Button className="w-full" onClick={handleAddPartialPayment}>Add Partial Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
