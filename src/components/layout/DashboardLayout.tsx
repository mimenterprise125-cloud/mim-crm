import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Briefcase, CreditCard, UserCog, Settings, LogOut,
  Menu, X, Building2, ChevronLeft, Mail, ImagePlus, TrendingUp, Wrench, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const allMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "sales", "operations", "accounts"] },
  { title: "Contacts", icon: Mail, path: "/dashboard/contacts", roles: ["admin", "sales"], badgeKey: "new_contacts" },
  { title: "Leads", icon: Users, path: "/dashboard/leads", roles: ["admin", "sales"], badgeKey: "converted_leads" },
  { title: "Projects", icon: Briefcase, path: "/dashboard/projects", roles: ["admin", "operations"], badgeKey: "total_projects" },
  { title: "Operations", icon: Wrench, path: "/dashboard/operations", roles: ["admin", "operations"], badgeKey: "active_projects" },
  { title: "Payments", icon: CreditCard, path: "/dashboard/payments", roles: ["admin", "accounts"] },
  { title: "Completed Projects", icon: ImagePlus, path: "/dashboard/completed-projects", roles: ["admin"], badgeKey: "completed_projects" },
  { title: "Sales Dashboard", icon: TrendingUp, path: "/dashboard/sales", roles: ["admin", "sales"] },
  { title: "Accounts", icon: DollarSign, path: "/dashboard/accounts", roles: ["admin", "accounts"] },
  { title: "Employees", icon: UserCog, path: "/dashboard/employees", roles: ["admin"] },
  { title: "Settings", icon: Settings, path: "/dashboard/settings", roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({
    new_contacts: 0,
    converted_leads: 0,
    active_projects: 0,
    total_projects: 0,
    completed_projects: 0,
  });

  const menuItems = allMenuItems.filter(item => user && item.roles.includes(user.role));

  // Load and subscribe to counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // New contacts
        const { data: contactsData } = await supabase
          .from("leads")
          .select("id", { count: "exact" })
          .eq("status", "NEW");

        // Converted leads (ready for project creation)
        const { data: convertedData } = await supabase
          .from("leads")
          .select("id", { count: "exact" })
          .eq("status", "CONVERTED");

        // Active projects
        const { data: activeData } = await supabase
          .from("projects")
          .select("id", { count: "exact" })
          .neq("status", "COMPLETED");

        // Total projects
        const { data: totalData } = await supabase
          .from("projects")
          .select("id", { count: "exact" });

        // Completed projects
        const { data: completedData } = await supabase
          .from("projects")
          .select("id", { count: "exact" })
          .eq("status", "COMPLETED");

        setCounts({
          new_contacts: contactsData?.length || 0,
          converted_leads: convertedData?.length || 0,
          active_projects: activeData?.length || 0,
          total_projects: totalData?.length || 0,
          completed_projects: completedData?.length || 0,
        });
      } catch (error) {
        console.error("Error loading counts:", error);
      }
    };

    loadCounts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('all_tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => loadCounts())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <Building2 className="h-7 w-7 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <div className="leading-tight">
            <span className="font-heading font-bold text-sm text-sidebar-foreground">MIM Enterprises</span>
            <span className="block text-[10px] text-sidebar-foreground/60">CRM Dashboard</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          const badgeCount = item.badgeKey ? counts[item.badgeKey as keyof typeof counts] : 0;
          const showBadge = badgeCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
              {showBadge && (
                <span className="ml-auto inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-sidebar-foreground">{user.full_name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <button className="hidden lg:block" onClick={() => setCollapsed(!collapsed)}>
              <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
