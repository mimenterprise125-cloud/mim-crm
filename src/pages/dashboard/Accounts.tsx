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
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  DUE: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const paymentTypeColors: Record<string, string> = {
  ADVANCE: "bg-blue-100 text-blue-800",
  PARTIAL: "bg-purple-100 text-purple-800",
  FINAL: "bg-indigo-100 text-indigo-800",
};

export default function Accounts() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPayments();
    setupRealtimeSubscription();
  }, []);

  const loadPayments = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          project_id (
            total_sqft,
            rate_per_sqft,
            final_amount,
            lead_id (
              name,
              phone,
              location
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        loadPayments();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    paidAmount: payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    pendingAmount: payments
      .filter((p) => p.status === "PENDING" || p.status === "DUE")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    overdueAmount: payments
      .filter((p) => p.status === "OVERDUE")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
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
          <p className="text-muted-foreground">Track payments and financial status</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold text-primary">
                ₹{(stats.totalAmount / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-lg font-bold text-green-600">
                  ₹{(stats.paidAmount / 100000).toFixed(1)}L
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-lg font-bold text-yellow-600">
                  ₹{(stats.pendingAmount / 100000).toFixed(1)}L
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-1">
                <div className="text-lg font-bold text-red-600">
                  ₹{(stats.overdueAmount / 100000).toFixed(1)}L
                </div>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <Button onClick={loadPayments} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        {/* Payments Grid */}
        <div className="grid gap-4">
          {payments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground/30 mr-3" />
                <p className="text-muted-foreground">No payments found</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-center">
                    {/* Amount */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="font-bold text-lg">
                        ₹{parseFloat(payment.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <Badge className={paymentTypeColors[payment.type]}>
                        {payment.type}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge className={paymentStatusColors[payment.status]}>
                        {payment.status}
                      </Badge>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Due Date */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Next Due</p>
                      <p className="font-semibold text-sm">
                        {payment.next_payment_due_date
                          ? format(new Date(payment.next_payment_due_date), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm truncate">{payment.notes || "N/A"}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Dialog open={showDetails && selectedPayment?.id === payment.id} onOpenChange={setShowDetails}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedPayment(payment)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                          </DialogHeader>
                          {selectedPayment && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                <p className="font-bold text-xl">
                                  ₹{parseFloat(selectedPayment.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Type</p>
                                <Badge className={paymentTypeColors[selectedPayment.type]}>
                                  {selectedPayment.type}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                                <Badge className={paymentStatusColors[selectedPayment.status]}>
                                  {selectedPayment.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                                <p className="font-semibold">
                                  {format(new Date(selectedPayment.payment_date), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Next Due Date</p>
                                <p className="font-semibold">
                                  {selectedPayment.next_payment_due_date
                                    ? format(new Date(selectedPayment.next_payment_due_date), "MMM d, yyyy")
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p className="font-semibold">{selectedPayment.notes || "N/A"}</p>
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
