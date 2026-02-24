import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { mockPayments } from "@/data/mockData";

const statusColors: Record<string, string> = {
  paid: "bg-success text-success-foreground",
  partial: "bg-warning text-warning-foreground",
  pending: "bg-info text-info-foreground",
  overdue: "bg-destructive text-destructive-foreground",
};

export default function Payments() {
  const [addModal, setAddModal] = useState(false);
  const overduePayments = mockPayments.filter(p => p.status === "overdue");

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
                <p className="font-medium text-sm">Payment Due Today</p>
                <p className="text-xs text-muted-foreground">
                  {overduePayments.map(p => p.client).join(", ")} — ₹{overduePayments.reduce((s, p) => s + p.balance, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Project</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Paid</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Next Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPayments.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{p.client}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">{p.project}</td>
                      <td className="p-3">₹{(p.totalAmount / 100000).toFixed(1)}L</td>
                      <td className="p-3 hidden md:table-cell">₹{(p.paidAmount / 100000).toFixed(1)}L</td>
                      <td className="p-3">₹{(p.balance / 100000).toFixed(1)}L</td>
                      <td className="p-3 hidden lg:table-cell">{p.nextPaymentDate}</td>
                      <td className="p-3"><Badge className={statusColors[p.status]}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Add Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea placeholder="Payment notes..." rows={2} />
            </div>
            <Button className="w-full" onClick={() => setAddModal(false)}>Save Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
