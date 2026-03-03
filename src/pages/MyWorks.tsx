import { useState } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Phone, Search, Home, Loader2, MapPin, Ruler, DollarSign, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface CustomerData {
  lead: {
    id: string;
    name: string;
    phone: string;
    location: string;
    project_type: string;
    status: string;
  };
  project: {
    id: string;
    total_sqft: number;
    rate_per_sqft: number;
    final_amount: number;
    profit_percentage: number | null;
    expected_completion_date: string;
    status: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    type: string;
    payment_date: string;
    status: string;
    notes: string | null;
  }>;
}

export default function MyWorks() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch lead by phone number
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", phone)
        .single();

      if (leadError || !leadData) {
        toast({
          title: "Not Found",
          description: "No customer found with this phone number",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if lead is CONVERTED
      if (leadData.status !== "CONVERTED") {
        toast({
          title: "Not Eligible",
          description: "Your inquiry has not been converted to a project yet. Please contact our sales team.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch associated project
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("lead_id", leadData.id)
        .single();

      // Fetch associated payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("project_id", projectData?.id || "")
        .order("payment_date", { ascending: false });

      setCustomerData({
        lead: leadData,
        project: projectData || null,
        payments: paymentsData || [],
      });
      setAuthenticated(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCustomerData(null);
    setAuthenticated(false);
    setPhone("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "DELAYED":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "ON_HOLD":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "DELAYED":
        return "bg-red-100 text-red-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "DUE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate total paid including advance payments
  const totalPaid = customerData?.payments.filter(p => p.status === "PAID" || p.type === "ADVANCE").reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalBalance = (customerData?.project?.final_amount || 0) - totalPaid;
  const paidPercentage = customerData?.project?.final_amount ? (totalPaid / customerData.project.final_amount) * 100 : 0;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {!authenticated ? (
            // Login Form
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-heading font-bold">My Works</h1>
                <p className="text-muted-foreground">View your project details, payments, and status</p>
              </div>

              <Card className="border-2">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Enter Your Phone Number
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">We'll retrieve your project information</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number (e.g., 9876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-lg h-12"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-12 text-base"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          View My Works
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Project Details</p>
                    <p className="text-xs text-muted-foreground">View all project information</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Payment History</p>
                    <p className="text-xs text-muted-foreground">Track all payments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Project Status</p>
                    <p className="text-xs text-muted-foreground">Real-time updates</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : customerData ? (
            // Customer Dashboard
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Welcome, {customerData.lead.name}!</h1>
                  <p className="text-primary-foreground/80">Your project dashboard and status tracker</p>
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => navigate("/")}
                  className="gap-2 mt-4 md:mt-0"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 font-medium mb-1">Name</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 truncate">{customerData.lead.name}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 font-medium mb-1">Phone</p>
                  <p className="text-sm md:text-base font-bold text-slate-900">{customerData.lead.phone}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 font-medium mb-1">Location</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 truncate">{customerData.lead.location}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 font-medium mb-1">Project Type</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 truncate">{customerData.lead.project_type}</p>
                </div>
              </div>

              {/* Project Details Card */}
              {customerData.project ? (
                <div className="space-y-6">
                  <Card className="border-2 border-slate-300/50 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-50/50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-2 bg-slate-200 rounded-lg">
                            <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          Project Details
                        </CardTitle>
                        <Badge className={`text-sm font-semibold ${getStatusColor(customerData.project.status)}`}>
                          {customerData.project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1 font-medium">TOTAL SQFT</p>
                          <p className="text-lg md:text-xl font-bold text-slate-900">
                            {customerData.project.total_sqft.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">sq.ft</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1 font-medium">RATE/SQFT</p>
                          <p className="text-lg md:text-xl font-bold text-slate-900">
                            ₹{(customerData.project.rate_per_sqft).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">per sq.ft</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1 font-medium">TOTAL AMOUNT</p>
                          <p className="text-lg md:text-xl font-bold text-slate-900">
                            ₹{(customerData.project.final_amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">project value</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1 font-medium">DUE DATE</p>
                          <p className="text-lg md:text-xl font-bold text-slate-900">
                            {format(new Date(customerData.project.expected_completion_date), "MMM dd")}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{format(new Date(customerData.project.expected_completion_date), "yyyy")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Summary */}
                  <Card className="border-2 border-slate-300/50">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-50/50 border-b">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs sm:text-sm text-slate-600 font-medium mb-2 truncate">PAID & ADVANCE</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
                              ₹{totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-600 mt-1 font-semibold">{paidPercentage.toFixed(0)}%</p>
                          </div>
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs sm:text-sm text-slate-600 font-medium mb-2 truncate">PENDING</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
                              ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-600 mt-1 font-semibold">{(100 - paidPercentage).toFixed(0)}%</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700">Payment Progress</p>
                            <p className="text-sm font-bold text-primary">{paidPercentage.toFixed(1)}%</p>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-sm">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-500 shadow-md"
                              style={{ width: `${paidPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  {customerData.payments.length > 0 ? (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Payment History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {customerData.payments.map((payment, index) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm md:text-base truncate">
                                    {payment.type === "ADVANCE" ? "Advance Payment" : payment.type === "PARTIAL" ? "Partial Payment" : "Final Payment"}
                                  </p>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    #{index + 1}
                                  </Badge>
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  {format(new Date(payment.payment_date), "MMM d, yyyy")}
                                </p>
                                {payment.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="font-bold text-base md:text-lg text-primary">₹{payment.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                                <Badge className={`text-xs mt-1 ${getPaymentStatusColor(payment.status)}`}>
                                  {payment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-dashed bg-muted/30">
                      <CardContent className="pt-8 text-center pb-8">
                        <svg className="h-12 w-12 text-muted-foreground mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-semibold mb-1">No Payments Yet</p>
                        <p className="text-sm text-muted-foreground">Payment records will appear here once your project starts.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="border-2 border-dashed bg-muted/30">
                  <CardContent className="pt-8 text-center pb-8">
                    <svg className="h-12 w-12 text-muted-foreground mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.343 17.657l1.414-1.414M4.929 16.243l1.414-1.414m10.606-10.606l1.414-1.414M17.657 6.343l1.414-1.414" />
                    </svg>
                    <p className="text-base font-semibold mb-1">No Project Yet</p>
                    <p className="text-sm text-muted-foreground">Your inquiry is being processed. We'll create your project soon.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PublicLayout>
  );
}
