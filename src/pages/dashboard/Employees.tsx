import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { mockUsers } from "@/data/mockData";

export default function Employees() {
  const [addModal, setAddModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">Manage team members and roles</p>
          </div>
          <Button onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Employee</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3 capitalize">{u.role}</td>
                      <td className="p-3">
                        <Badge className={u.active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                          {u.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Full Name" />
            <Input placeholder="Email" type="email" />
            <Select>
              <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="accounts">Accounts</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={() => setAddModal(false)}>Add Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
