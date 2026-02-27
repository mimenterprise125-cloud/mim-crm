import { supabase, InsertTables, UpdateTables } from "@/lib/supabase";
import { auditService } from "./auditService";

export const paymentService = {
  // Add payment
  async addPayment(
    projectId: string,
    data: {
      amount: number;
      type: "ADVANCE" | "PARTIAL" | "FINAL";
      paymentDate: string;
      nextPaymentDueDate?: string;
      notes?: string;
    },
    userId: string
  ) {
    try {
      const paymentData: InsertTables<"payments"> = {
        project_id: projectId,
        amount: data.amount,
        type: data.type,
        payment_date: data.paymentDate,
        status: "PENDING",
        next_payment_due_date: data.nextPaymentDueDate || null,
        notes: data.notes || null,
        created_by: userId,
      };

      const { data: payment, error } = await supabase
        .from("payments")
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "CREATE",
        entity_type: "PAYMENT",
        entity_id: payment.id,
        new_value: paymentData,
      });

      return { success: true, data: payment };
    } catch (error) {
      console.error("Error adding payment:", error);
      return { success: false, error };
    }
  },

  // Get payments for project
  async getProjectPayments(projectId: string) {
    try {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: payments };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error };
    }
  },

  // Get all payments
  async getPayments(filters?: {
    status?: string;
    dueToday?: boolean;
    limit?: number;
  }) {
    try {
      let query = supabase.from("payments").select("*, projects(*, leads(*))");

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data: payments, error } = await query
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (error) throw error;

      // Filter due today if requested
      if (filters?.dueToday) {
        const today = new Date().toISOString().split("T")[0];
        return {
          success: true,
          data: payments.filter((p) => p.next_payment_due_date === today),
        };
      }

      return { success: true, data: payments };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error };
    }
  },

  // Update payment status
  async updatePaymentStatus(
    paymentId: string,
    status: "PENDING" | "DUE" | "PAID" | "OVERDUE",
    userId: string
  ) {
    try {
      const { data: currentPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      const { data: payment, error } = await supabase
        .from("payments")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "STATUS_CHANGE",
        entity_type: "PAYMENT",
        entity_id: paymentId,
        old_value: { status: currentPayment?.status },
        new_value: { status },
      });

      return { success: true, data: payment };
    } catch (error) {
      console.error("Error updating payment status:", error);
      return { success: false, error };
    }
  },

  // Get revenue summary
  async getRevenueThis(month?: number, year?: number) {
    try {
      const now = new Date();
      const currentMonth = month || now.getMonth() + 1;
      const currentYear = year || now.getFullYear();

      // Get all paid payments for the month
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "PAID")
        .gte("payment_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
        .lte(
          "payment_date",
          `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`
        );

      if (error) throw error;

      const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
      return { success: true, data: revenue };
    } catch (error) {
      console.error("Error calculating revenue:", error);
      return { success: false, error };
    }
  },

  // Get pending payments
  async getPendingPayments() {
    try {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*, projects(*, leads(*))")
        .in("status", ["PENDING", "DUE", "OVERDUE"])
        .order("next_payment_due_date", { ascending: true });

      if (error) throw error;
      return { success: true, data: payments };
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      return { success: false, error };
    }
  },
};
