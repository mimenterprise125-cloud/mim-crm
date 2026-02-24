import { supabase, InsertTables } from "@/lib/supabase";

export const leadService = {
  // Create a new lead from website form
  async createLead(data: {
    name: string;
    phone: string;
    location: string;
    projectType: string;
    message: string;
  }) {
    try {
      const leadData: InsertTables<"leads"> = {
        name: data.name,
        phone: data.phone,
        location: data.location,
        project_type: data.projectType,
        message: data.message,
        status: "NEW",
        source: "WEBSITE",
        assigned_to: null,
        conversation_status: "BUSINESS_INITIATED",
        open_window_expiry: null,
      };

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert([leadData])
        .select()
        .single();

      if (leadError) throw leadError;

      return { success: true, lead };
    } catch (error) {
      console.error("Error creating lead:", error);
      return { success: false, error };
    }
  },

  // Get all leads (admin/sales)
  async getLeads(filters?: {
    status?: string;
    assignedTo?: string;
    limit?: number;
  }) {
    try {
      let query = supabase.from("leads").select("*");

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }

      const { data: leads, error } = await query
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 50);

      if (error) throw error;
      return { success: true, data: leads || [] };
    } catch (error) {
      console.error("Error fetching leads:", error);
      return { success: false, error, data: [] };
    }
  },

  // Get single lead
  async getLead(id: string) {
    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { success: true, data: lead };
    } catch (error) {
      console.error("Error fetching lead:", error);
      return { success: false, error };
    }
  },

  // Update lead status
  async updateLeadStatus(
    leadId: string,
    newStatus: string,
    userId?: string
  ) {
    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: lead };
    } catch (error) {
      console.error("Error updating lead status:", error);
      return { success: false, error };
    }
  },

  // Assign lead to sales user
  async assignLead(leadId: string, userId: string) {
    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .update({
          assigned_to: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: lead };
    } catch (error) {
      console.error("Error assigning lead:", error);
      return { success: false, error };
    }
  },

  // Open conversation window (customer replied to template)
  async openConversationWindow(leadId: string) {
    try {
      const openWindowExpiry = new Date();
      openWindowExpiry.setHours(openWindowExpiry.getHours() + 24);

      const { data: lead, error } = await supabase
        .from("leads")
        .update({
          conversation_status: "OPEN",
          open_window_expiry: openWindowExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: lead };
    } catch (error) {
      console.error("Error opening conversation window:", error);
      return { success: false, error };
    }
  },

  // Check if conversation is within 24-hour window
  async isConversationWindowOpen(leadId: string): Promise<boolean> {
    try {
      const { data: lead, error } = await this.getLead(leadId);
      if (error || !lead) return false;

      if (lead.conversation_status !== "OPEN" || !lead.open_window_expiry) {
        return false;
      }

      const now = new Date();
      const expiry = new Date(lead.open_window_expiry);
      return now < expiry;
    } catch (error) {
      console.error("Error checking conversation window:", error);
      return false;
    }
  },

  // Get lead with related data (projects, payments, messages)
  async getLeadWithContext(leadId: string) {
    try {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (leadError) throw leadError;

      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("lead_id", leadId);

      const { data: whatsappLogs } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      return {
        success: true,
        data: {
          lead,
          projects,
          whatsappLogs,
        },
      };
    } catch (error) {
      console.error("Error fetching lead context:", error);
      return { success: false, error };
    }
  },
};
