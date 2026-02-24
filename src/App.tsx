import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Leads from "./pages/dashboard/Leads";
import Projects from "./pages/dashboard/Projects";
import CompletedProjects from "./pages/dashboard/CompletedProjects";
import Payments from "./pages/dashboard/Payments";
import Contacts from "./pages/dashboard/Contacts";
import Employees from "./pages/dashboard/Employees";
import SettingsPage from "./pages/dashboard/Settings";
import Sales from "./pages/dashboard/Sales";
import Operations from "./pages/dashboard/Operations";
import Accounts from "./pages/dashboard/Accounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/dashboard/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/dashboard/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
            <Route path="/dashboard/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/dashboard/completed-projects" element={<ProtectedRoute><CompletedProjects /></ProtectedRoute>} />
            <Route path="/dashboard/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/dashboard/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
