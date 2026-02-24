import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface CompletedProject {
  id: string;
  name: string;
  location: string;
  sqft: string;
  image_url?: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export default function CompletedProjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    sqft: "",
    description: "",
    imageFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("completed_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading completed projects:", error);
      toast({
        title: "Error",
        description: "Failed to load completed projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.sqft) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";

      // Upload image if provided
      if (formData.imageFile) {
        const fileName = `${Date.now()}-${formData.imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(`completed/${fileName}`, formData.imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from("project-images")
          .getPublicUrl(`completed/${fileName}`);
        imageUrl = data.publicUrl;
      }

      // Create project record
      const { error } = await supabase.from("completed_projects").insert([
        {
          name: formData.name,
          location: formData.location,
          sqft: formData.sqft,
          description: formData.description,
          image_url: imageUrl,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Project added successfully",
      });

      // Reset form
      setFormData({
        name: "",
        location: "",
        sqft: "",
        description: "",
        imageFile: null,
      });
      setImagePreview("");
      setOpenDialog(false);

      // Reload projects
      await loadProjects();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("completed_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      await loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-primary mx-auto animate-spin mb-2" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-bold">Completed Projects</h1>
          <div className="h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground">
            Manage and showcase your completed projects
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total projects: <span className="font-semibold text-foreground">{projects.length}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => loadProjects()}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Completed Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name *</label>
                    <Input
                      placeholder="e.g., Residential Complex - Tower A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Location *</label>
                    <Input
                      placeholder="e.g., Hyderabad, Telangana"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Square Feet (sqft) *</label>
                    <Input
                      placeholder="e.g., 5000"
                      value={formData.sqft}
                      onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Project details, features, etc."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Image</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-40 w-full object-cover rounded-lg"
                          />
                          <label className="flex items-center justify-center cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                            <Button type="button" variant="outline" size="sm" className="w-full">
                              Change Image
                            </Button>
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <span className="text-sm text-muted-foreground text-center">
                            Click to upload project image
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Adding Project..." : "Add Project"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No completed projects yet</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {project.image_url && (
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium text-sm">{project.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p className="font-medium text-sm">{project.sqft} sqft</p>
                  </div>
                  {project.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm line-clamp-2">{project.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Added on</p>
                    <p className="font-medium text-sm">
                      {format(new Date(project.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDelete(project.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
