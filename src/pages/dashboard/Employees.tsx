import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Check, X, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: "active" | "inactive";
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: "present" | "absent" | "leave";
  notes: string;
}

export default function Employees() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<"employees" | "attendance">("employees");
  const [addModal, setAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: "", phone: "", role: "Sales" });
  const [attendanceFormData, setAttendanceFormData] = useState<{ employeeId: string; status: "present" | "absent" | "leave"; notes: string }>({ employeeId: "", status: "present", notes: "" });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Load employees from database
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          toast({ 
            title: "Info", 
            description: "Employees table not yet created. Please run migrations.",
            variant: "default"
          });
        } else {
          throw error;
        }
      }
      
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load employees", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Load attendance records from database
  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Attendance table not yet created');
        } else {
          throw error;
        }
      }
      
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      // Don't show error toast for attendance failures
    }
  };

  useEffect(() => {
    loadEmployees();
    loadAttendance();

    // Subscribe to real-time changes
    const employeesSubscription = supabase
      .channel("employees-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        loadEmployees();
      })
      .subscribe();

    const attendanceSubscription = supabase
      .channel("attendance-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        loadAttendance();
      })
      .subscribe();

    return () => {
      employeesSubscription.unsubscribe();
      attendanceSubscription.unsubscribe();
    };
  }, []);

  const handleAddEmployee = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: "Error", description: "Please fill name and phone number", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const generatedEmail = `${formData.name.toLowerCase().replace(/\s/g, '.')}@company.com`;

      if (editingId) {
        const { error } = await supabase
          .from("employees")
          .update({
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            email: generatedEmail,
          })
          .eq("id", editingId);

        if (error) throw error;
        
        toast({ title: "Success", description: "Employee updated successfully" });
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from("employees")
          .insert([{
            name: formData.name,
            email: generatedEmail,
            phone: formData.phone,
            role: formData.role,
            status: "active",
          }]);

        if (error) throw error;
        
        toast({ title: "Success", description: "Employee added successfully" });
      }

      await loadEmployees();
      setFormData({ name: "", phone: "", role: "Sales" });
      setAddModal(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save employee", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Employee deleted successfully" });
      await loadEmployees();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete employee", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setFormData({ name: employee.name, phone: employee.phone, role: employee.role });
    setEditingId(employee.id);
    setAddModal(true);
  };

  const handleAddAttendance = async () => {
    if (!attendanceFormData.employeeId) {
      toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .insert([{
          employee_id: attendanceFormData.employeeId,
          date: attendanceDate,
          status: attendanceFormData.status,
          notes: attendanceFormData.notes,
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Attendance marked successfully" });
      await loadAttendance();
      setAttendanceFormData({ employeeId: "", status: "present", notes: "" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to mark attendance", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Attendance record deleted" });
      await loadAttendance();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete attendance record", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (employeeId: string) => employees.find(e => e.id === employeeId)?.name || "Unknown";
  const getTodayAttendance = () => attendance.filter(a => a.date === attendanceDate);
  const getAttendanceStats = () => {
    const today = getTodayAttendance();
    return {
      present: today.filter(a => a.status === "present").length,
      absent: today.filter(a => a.status === "absent").length,
      leave: today.filter(a => a.status === "leave").length,
    };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">Manage team members, roles and attendance</p>
          </div>
          {activeTab === "employees" && (
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", phone: "", role: "Sales" }); setAddModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Employee
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "employees"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Attendance
          </button>
        </div>

        {/* Employees Tab */}
        {activeTab === "employees" && (
          <Card>
            <CardContent className="p-4">
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No employees added yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(employee => (
                        <tr key={employee.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{employee.name}</td>
                          <td className="p-3 text-muted-foreground hidden sm:table-cell text-xs">{employee.email}</td>
                          <td className="p-3 capitalize text-xs">{employee.role}</td>
                          <td className="p-3 hidden lg:table-cell text-xs">{employee.phone}</td>
                          <td className="p-3">
                            <Badge className={employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {employee.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditEmployee(employee)}
                                className="p-2 hover:bg-muted rounded transition-colors"
                                disabled={submitting}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                                disabled={submitting}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Present Today</p>
                      <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                    </div>
                    <Check className="h-6 w-6 text-green-600/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Absent Today</p>
                      <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                    </div>
                    <X className="h-6 w-6 text-red-600/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">On Leave</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.leave}</p>
                    </div>
                    <Calendar className="h-6 w-6 text-yellow-600/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mark Attendance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Employee</label>
                  <Select value={attendanceFormData.employeeId} onValueChange={(value) => setAttendanceFormData({...attendanceFormData, employeeId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={attendanceFormData.status} onValueChange={(value) => setAttendanceFormData({...attendanceFormData, status: value as "present" | "absent" | "leave"})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                  <Input placeholder="Add notes..." value={attendanceFormData.notes} onChange={(e) => setAttendanceFormData({...attendanceFormData, notes: e.target.value})} />
                </div>
                <Button onClick={handleAddAttendance} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Mark Attendance
                </Button>
              </CardContent>
            </Card>

            {/* Attendance List */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No attendance records yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Notes</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map(record => (
                          <tr key={record.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3 font-medium">{getEmployeeName(record.employee_id)}</td>
                            <td className="p-3 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                            <td className="p-3">
                              <Badge className={
                                record.status === "present" ? "bg-green-100 text-green-800" :
                                record.status === "absent" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{record.notes || "-"}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteAttendance(record.id)}
                                disabled={submitting}
                                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
        )}
      </div>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input 
                placeholder="Full Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number *</label>
              <Input 
                placeholder="Phone" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Accounts">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddEmployee} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
