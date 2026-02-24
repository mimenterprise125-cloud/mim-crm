import { supabase, InsertTables } from "@/lib/supabase";

export const whatsappService = {
  // Send welcome template to new lead
  async sendWelcomeTemplate(leadId: string, leadName: string) {
    try {
      const templateName = "welcome_lead";
      const body = `Hello ${leadName}, welcome to MIM Doors & Windows! We are excited to help you with your project. Our team will be in touch shortly.`;

      // Save outgoing template message
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: "TEMPLATE",
        body,
        template_name: templateName,
      };

      const { error } = await supabase
        .from("whatsapp_logs")
        .insert([logData]);

      if (error) throw error;

      // TODO: Call actual WhatsApp API to send message
      // await callWhatsAppAPI(phone, templateName, [leadName]);

      return { success: true };
    } catch (error) {
      console.error("Error sending welcome template:", error);
      return { success: false, error };
    }
  },

  // Receive incoming WhatsApp message
  async receiveMessage(leadId: string, body: string) {
    try {
      // Save incoming message
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "INCOMING",
        type: "TEXT",
        body,
      };

      const { error } = await supabase
        .from("whatsapp_logs")
        .insert([logData]);

      if (error) throw error;

      // Open conversation window
      const { leadService } = await import("./leadService");
      await leadService.openConversationWindow(leadId);

      return { success: true };
    } catch (error) {
      console.error("Error receiving message:", error);
      return { success: false, error };
    }
  },

  // Send message from sales user
  async sendMessage(
    leadId: string,
    body: string,
    userId: string,
    useTemplate: boolean = false,
    templateName?: string
  ) {
    try {
      // Check if conversation window is open
      const { leadService } = await import("./leadService");
      const windowOpen = await leadService.isConversationWindowOpen(leadId);

      // If window is closed and trying to send free text, reject
      if (!useTemplate && !windowOpen) {
        return {
          success: false,
          error: "Conversation window closed. Only template messages allowed.",
        };
      }

      // Save message log
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: useTemplate ? "TEMPLATE" : "TEXT",
        body,
        template_name: useTemplate ? templateName : null,
      };

      const { error } = await supabase
        .from("whatsapp_logs")
        .insert([logData]);

      if (error) throw error;

      // TODO: Call actual WhatsApp API
      // if (useTemplate) {
      //   await callWhatsAppAPI(phone, templateName, variables);
      // } else {
      //   await callWhatsAppAPI(phone, body);
      // }

      // Log to audit
      const { auditService } = await import("./auditService");
      await auditService.logAction({
        user_id: userId,
        action_type: "SEND_MESSAGE",
        entity_type: "WHATSAPP_MESSAGE",
        entity_id: leadId,
        new_value: {
          body,
          type: useTemplate ? "TEMPLATE" : "TEXT",
          templateName,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error };
    }
  },

  // Get conversation history for a lead
  async getConversationHistory(leadId: string) {
    try {
      const { data: logs, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { success: true, data: logs };
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return { success: false, error };
    }
  },

  // Send message when project delayed (uses template or free text based on window)
  async sendDelayNotification(
    leadId: string,
    userId: string,
    delayReason: string,
    newDate: string
  ) {
    try {
      const { leadService } = await import("./leadService");
      const windowOpen = await leadService.isConversationWindowOpen(leadId);

      const body = windowOpen
        ? `We wanted to inform you about a slight delay in your project. New expected completion date: ${newDate}. Reason: ${delayReason}`
        : `Project Delay Notification - Your project has been delayed. New expected date: ${newDate}`;

      await this.sendMessage(
        leadId,
        body,
        userId,
        !windowOpen,
        !windowOpen ? "project_delay" : undefined
      );

      return { success: true };
    } catch (error) {
      console.error("Error sending delay notification:", error);
      return { success: false, error };
    }
  },
};
