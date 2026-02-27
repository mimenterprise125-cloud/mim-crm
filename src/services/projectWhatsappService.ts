import { supabase, InsertTables } from "@/lib/supabase";

export const projectWhatsappService = {
  // Send prefilled message based on project status
  async sendStatusMessage(
    projectId: string,
    leadId: string,
    phone: string,
    status: string,
    userId: string
  ) {
    try {
      const templates: Record<string, string> = {
        ACTIVE: `Thank you for choosing MIM Doors & Windows! Your project is now active and underway. Our team will keep you updated on the progress.`,
        DELAYED: `We wanted to inform you that your project has encountered a delay. Our team is working diligently to minimize the impact and complete your project as soon as possible.`,
        COMPLETED: `🎉 Great news! Your MIM Doors & Windows project has been completed successfully. Thank you for your business! We hope you enjoy your new installation.`,
        ON_HOLD: `Your project is currently on hold. Please contact us if you have any questions or when you're ready to resume.`,
        CANCELLED: `Your project has been cancelled as per your request. Thank you for considering MIM Doors & Windows.`,
      };

      const body = templates[status] || `Your project status has been updated to: ${status}`;

      // Log the message to whatsapp_logs
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: "TEMPLATE",
        body,
        template_name: `status_${status.toLowerCase()}`,
      };

      await supabase.from("whatsapp_logs").insert([logData]);

      // Log to audit
      const { auditService } = await import("./auditService");
      await auditService.logAction({
        user_id: userId,
        action_type: "SEND_MESSAGE",
        entity_type: "WHATSAPP_MESSAGE",
        entity_id: projectId,
        new_value: {
          type: "TEMPLATE",
          message: body,
          template: `status_${status.toLowerCase()}`,
          leadId,
          phone,
        },
      });

      // Generate WhatsApp link and open it
      const whatsappLink = this.generateWhatsAppLink(phone, body);
      window.open(whatsappLink, "_blank");

      return { success: true };
    } catch (error) {
      console.error("Error sending status message:", error);
      return { success: false, error };
    }
  },

  // Send custom message
  async sendCustomMessage(
    projectId: string,
    leadId: string,
    phone: string,
    message: string,
    userId: string
  ) {
    try {
      // Log the message to whatsapp_logs
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: "TEXT",
        body: message,
        template_name: null,
      };

      await supabase.from("whatsapp_logs").insert([logData]);

      // Log to audit
      const { auditService } = await import("./auditService");
      await auditService.logAction({
        user_id: userId,
        action_type: "SEND_MESSAGE",
        entity_type: "WHATSAPP_MESSAGE",
        entity_id: projectId,
        new_value: {
          type: "TEXT",
          message,
          leadId,
          phone,
        },
      });

      // Generate WhatsApp link and open it
      const whatsappLink = this.generateWhatsAppLink(phone, message);
      window.open(whatsappLink, "_blank");

      return { success: true };
    } catch (error) {
      console.error("Error sending custom message:", error);
      return { success: false, error };
    }
  },

  // Send message with image
  async sendMessageWithImage(
    projectId: string,
    leadId: string,
    phone: string,
    message: string,
    imageUrl: string,
    userId: string
  ) {
    try {
      // First log the text message
      const logData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: "TEXT",
        body: message,
        template_name: null,
      };

      await supabase.from("whatsapp_logs").insert([logData]);

      // Then log the image
      const imageLogData: InsertTables<"whatsapp_logs"> = {
        lead_id: leadId,
        direction: "OUTGOING",
        type: "MEDIA",
        body: "Project update image",
        media_url: imageUrl,
      };

      const { error } = await supabase
        .from("whatsapp_logs")
        .insert([imageLogData]);

      if (error) throw error;

      // Log to audit
      const { auditService } = await import("./auditService");
      await auditService.logAction({
        user_id: userId,
        action_type: "SEND_MESSAGE",
        entity_type: "WHATSAPP_MESSAGE",
        entity_id: projectId,
        new_value: {
          type: "MESSAGE_WITH_IMAGE",
          message,
          imageUrl,
          leadId,
        },
      });

      // TODO: Call actual WhatsApp API
      // await sendViaWhatsAppAPI(phone, message, imageUrl);

      return { success: true };
    } catch (error) {
      console.error("Error sending message with image:", error);
      return { success: false, error };
    }
  },


  // Generate WhatsApp Web link for manual messaging
  generateWhatsAppLink(phone: string, message: string): string {
    // Clean phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, "");

    // Format phone number with country code
    let phoneWithCode: string;
    if (cleanPhone.length === 10) {
      // 10-digit Indian number - add country code
      phoneWithCode = `91${cleanPhone}`;
    } else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      // Already has country code
      phoneWithCode = cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      // Already formatted
      phoneWithCode = cleanPhone;
    } else {
      // Use as-is (assume it's already formatted)
      phoneWithCode = cleanPhone;
    }

    // URL encode the message
    const encodedMessage = encodeURIComponent(message);

    // Return WhatsApp Web link
    return `https://wa.me/${phoneWithCode}?text=${encodedMessage}`;
  },

  // Internal: Send message (legacy - can be removed if not used)
  async sendMessage(
    leadId: string,
    phone: string,
    body: string,
    userId: string,
    useTemplate: boolean = false,
    templateName?: string
  ) {
    try {
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

      // Log to audit
      const { auditService } = await import("./auditService");
      await auditService.logAction({
        user_id: userId,
        action_type: "SEND_MESSAGE",
        entity_type: "WHATSAPP_MESSAGE",
        entity_id: leadId,
        new_value: {
          type: useTemplate ? "TEMPLATE" : "TEXT",
          body,
          template: useTemplate ? templateName : null,
        },
      });

      // TODO: Call actual WhatsApp API
      // await sendViaWhatsAppAPI(phone, body, templateName);

      return { success: true };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return { success: false, error };
    }
  },

  // Get conversation history for a project/lead
  async getConversationHistory(leadId: string) {
    try {
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return { success: false, error };
    }
  },
};
