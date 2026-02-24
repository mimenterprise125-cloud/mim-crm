import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for database tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          role: "admin" | "sales" | "operations" | "accounts";
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          location: string;
          project_type: string;
          message: string | null;
          status: "NEW" | "CONTACTED" | "FOLLOW_UP" | "SITE_VISIT" | "QUOTATION_SENT" | "NEGOTIATION" | "CONVERTED" | "LOST";
          source: "WEBSITE" | "PHONE" | "REFERRAL" | "SOCIAL_MEDIA";
          assigned_to: string | null;
          conversation_status: "BUSINESS_INITIATED" | "OPEN" | "CLOSED";
          open_window_expiry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      projects: {
        Row: {
          id: string;
          lead_id: string;
          total_sqft: number;
          rate_per_sqft: number;
          gst_enabled: boolean;
          final_amount: number;
          profit_percentage: number | null;
          expected_completion_date: string;
          status: "ACTIVE" | "DELAYED" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          description: string | null;
          old_expected_date: string | null;
          new_expected_date: string | null;
          delay_reason: string | null;
          created_by: string;
          image_urls: string[] | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          type: string;
          description?: string | null;
          old_expected_date?: string | null;
          new_expected_date?: string | null;
          delay_reason?: string | null;
          created_by: string;
          image_urls?: string[] | null;
        };
        Update: Partial<Database["public"]["Tables"]["project_updates"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          project_id: string;
          amount: number;
          type: "ADVANCE" | "PARTIAL" | "FINAL";
          payment_date: string;
          status: "PENDING" | "DUE" | "PAID" | "OVERDUE";
          next_payment_due_date: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      whatsapp_logs: {
        Row: {
          id: string;
          lead_id: string;
          direction: "INCOMING" | "OUTGOING";
          type: "TEXT" | "TEMPLATE" | "MEDIA";
          body: string;
          template_name: string | null;
          media_url: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          direction: "INCOMING" | "OUTGOING";
          type: "TEXT" | "TEMPLATE" | "MEDIA";
          body: string;
          template_name?: string | null;
          media_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_logs"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action_type: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "SEND_MESSAGE";
          entity_type: "LEAD" | "PROJECT" | "PAYMENT" | "EMPLOYEE" | "WHATSAPP_MESSAGE";
          entity_id: string;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          timestamp: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "timestamp">;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
