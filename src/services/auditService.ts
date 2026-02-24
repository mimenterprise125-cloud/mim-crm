import { supabase, InsertTables } from "@/lib/supabase";

export const auditService = {
  // Log an action
  async logAction(data: {
    user_id: string;
    action_type: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "SEND_MESSAGE";
    entity_type: "LEAD" | "PROJECT" | "PAYMENT" | "EMPLOYEE" | "WHATSAPP_MESSAGE";
    entity_id: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
  }) {
    try {
      const logData: InsertTables<"audit_logs"> = {
        user_id: data.user_id,
        action_type: data.action_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        old_value: data.old_value || null,
        new_value: data.new_value || null,
      };

      const { error } = await supabase
        .from("audit_logs")
        .insert([logData]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error logging action:", error);
      return { success: false, error };
    }
  },

  // Get audit logs
  async getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }) {
    try {
      let query = supabase.from("audit_logs").select("*");

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters?.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }

      if (filters?.entityId) {
        query = query.eq("entity_id", filters.entityId);
      }

      const { data: logs, error } = await query
        .order("timestamp", { ascending: false })
        .limit(filters?.limit || 100);

      if (error) throw error;
      return { success: true, data: logs };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return { success: false, error };
    }
  },

  // Get entity history
  async getEntityHistory(entityType: string, entityId: string) {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return { success: true, data: logs };
    } catch (error) {
      console.error("Error fetching entity history:", error);
      return { success: false, error };
    }
  },
};
