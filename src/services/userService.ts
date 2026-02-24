import { supabase } from "@/lib/supabase";

export const userService = {
  // Login
  async login(email: string, password: string) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("User not found:", error);
        return { success: false, error: "Invalid credentials" };
      }

      // Verify password (in production, use bcrypt)
      const passwordHash = btoa(password);
      if (user.password_hash !== passwordHash) {
        return { success: false, error: "Invalid credentials" };
      }

      // Store session (in production, use JWT)
      localStorage.setItem("user_session", JSON.stringify(user));

      return { success: true, data: user };
    } catch (error) {
      console.error("Error logging in:", error);
      return { success: false, error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const session = localStorage.getItem("user_session");
      if (!session) return { success: false, error: "Not logged in" };

      const user = JSON.parse(session);
      return { success: true, data: user };
    } catch (error) {
      console.error("Error getting current user:", error);
      return { success: false, error };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem("user_session");
    return { success: true };
  },

  // Get all employees (admin only)
  async getEmployees() {
    try {
      const { data: employees, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return { success: true, data: employees || [] };
    } catch (error) {
      console.error("Error fetching employees:", error);
      return { success: false, error, data: [] };
    }
  },

  // Get employee
  async getEmployee(id: string) {
    try {
      const { data: employee, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { success: true, data: employee };
    } catch (error) {
      console.error("Error fetching employee:", error);
      return { success: false, error };
    }
  },

  // Get assigned leads
  async getAssignedLeads(userId: string) {
    try {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: leads || [] };
    } catch (error) {
      console.error("Error fetching assigned leads:", error);
      return { success: false, error, data: [] };
    }
  },
};
