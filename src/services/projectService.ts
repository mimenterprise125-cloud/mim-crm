import { supabase, InsertTables, UpdateTables } from "@/lib/supabase";
import { auditService } from "./auditService";

export const projectService = {
  // Create project from converted lead
  async createProject(
    leadId: string,
    data: {
      totalSqft: number;
      ratePerSqft: number;
      gstEnabled: boolean;
      finalAmount: number;
      profitPercentage?: number;
      expectedCompletionDate: string;
    },
    userId: string
  ) {
    try {
      const projectData: InsertTables<"projects"> = {
        lead_id: leadId,
        total_sqft: data.totalSqft,
        rate_per_sqft: data.ratePerSqft,
        gst_enabled: data.gstEnabled,
        final_amount: data.finalAmount,
        profit_percentage: data.profitPercentage || null,
        expected_completion_date: data.expectedCompletionDate,
        status: "ACTIVE",
      };

      const { data: project, error } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "CREATE",
        entity_type: "PROJECT",
        entity_id: project.id,
        new_value: projectData,
      });

      return { success: true, data: project };
    } catch (error) {
      console.error("Error creating project:", error);
      return { success: false, error };
    }
  },

  // Get all projects
  async getProjects(filters?: { status?: string; limit?: number }) {
    try {
      let query = supabase.from("projects").select("*, leads(*)");

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data: projects, error } = await query
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 50);

      if (error) throw error;
      return { success: true, data: projects };
    } catch (error) {
      console.error("Error fetching projects:", error);
      return { success: false, error };
    }
  },

  // Get single project with context
  async getProject(id: string) {
    try {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*, leads(*)")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;

      const { data: updates } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      return {
        success: true,
        data: {
          project,
          updates,
          payments,
        },
      };
    } catch (error) {
      console.error("Error fetching project:", error);
      return { success: false, error };
    }
  },

  // Add progress update
  async addProgressUpdate(
    projectId: string,
    data: {
      description: string;
      imageUrls?: string[];
    },
    userId: string
  ) {
    try {
      const updateData: InsertTables<"project_updates"> = {
        project_id: projectId,
        type: "PROGRESS",
        description: data.description,
        image_urls: data.imageUrls || null,
        created_by: userId,
      };

      const { data: update, error } = await supabase
        .from("project_updates")
        .insert([updateData])
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "UPDATE",
        entity_type: "PROJECT",
        entity_id: projectId,
        new_value: { updateType: "PROGRESS", description: data.description },
      });

      return { success: true, data: update };
    } catch (error) {
      console.error("Error adding progress update:", error);
      return { success: false, error };
    }
  },

  // Add delay update
  async addDelayUpdate(
    projectId: string,
    data: {
      delayReason: string;
      oldExpectedDate: string;
      newExpectedDate: string;
    },
    userId: string
  ) {
    try {
      // Update project status to DELAYED
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          status: "DELAYED",
          expected_completion_date: data.newExpectedDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // Add delay record
      const delayData: InsertTables<"project_updates"> = {
        project_id: projectId,
        type: "DELAY",
        delay_reason: data.delayReason,
        old_expected_date: data.oldExpectedDate,
        new_expected_date: data.newExpectedDate,
        created_by: userId,
      };

      const { data: update, error } = await supabase
        .from("project_updates")
        .insert([delayData])
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "STATUS_CHANGE",
        entity_type: "PROJECT",
        entity_id: projectId,
        old_value: {
          status: "ACTIVE",
          expectedDate: data.oldExpectedDate,
        },
        new_value: {
          status: "DELAYED",
          expectedDate: data.newExpectedDate,
          reason: data.delayReason,
        },
      });

      // Send WhatsApp notification
      const { leadService } = await import("./leadService");
      const { data: project } = await this.getProject(projectId);
      if (project?.project?.lead_id) {
        const { whatsappService } = await import("./whatsappService");
        await whatsappService.sendDelayNotification(
          project.project.lead_id,
          userId,
          data.delayReason,
          data.newExpectedDate
        );
      }

      return { success: true, data: update };
    } catch (error) {
      console.error("Error adding delay update:", error);
      return { success: false, error };
    }
  },

  // Update project status
  async updateProjectStatus(
    projectId: string,
    status: string,
    userId: string
  ) {
    try {
      const { data: currentProject } = await this.getProject(projectId);

      const { data: project, error } = await supabase
        .from("projects")
        .update({
          status: status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await auditService.logAction({
        user_id: userId,
        action_type: "STATUS_CHANGE",
        entity_type: "PROJECT",
        entity_id: projectId,
        old_value: { status: currentProject?.project?.status },
        new_value: { status },
      });

      return { success: true, data: project };
    } catch (error) {
      console.error("Error updating project status:", error);
      return { success: false, error };
    }
  },
};
