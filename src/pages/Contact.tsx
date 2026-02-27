import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { leadService } from "@/services/leadService";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ 
    name: "", 
    phone: "", 
    location: "", 
    projectType: "", 
    message: "" 
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      if (!form.name || !form.phone || !form.location || !form.projectType) {
        toast({ 
          title: "Validation Error", 
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create lead
      const result = await leadService.createLead({
        name: form.name,
        phone: form.phone,
        location: form.location,
        projectType: form.projectType,
        message: form.message,
      });

      if (result.success) {
        // Show confirmation modal
        setShowConfirmation(true);
        // Clear form
        setForm({ name: "", phone: "", location: "", projectType: "", message: "" });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to submit form. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-20">
        <div className="container">
          <h1 className="text-3xl font-heading font-bold text-center mb-4">Contact Us</h1>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold text-xl mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required 
                    disabled={loading}
                  />
                  <Input 
                    placeholder="Phone Number" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                    required
                    disabled={loading}
                  />
                  <Input 
                    placeholder="Location" 
                    value={form.location} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    required
                    disabled={loading}
                  />
                  <Select value={form.projectType} onValueChange={v => setForm({ ...form, projectType: v })}>
                    <SelectTrigger disabled={loading}><SelectValue placeholder="Project Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea 
                    placeholder="Your Message" 
                    value={form.message} 
                    onChange={e => setForm({ ...form, message: e.target.value })} 
                    rows={4}
                    disabled={loading}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold text-xl mb-6">Company Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-sm opacity-80">123 Industrial Area, Hyderabad, Telangana 500001, India</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <p className="text-sm opacity-80">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <p className="text-sm opacity-80">info@mimenterprises.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Business Hours</p>
                      <p className="text-sm opacity-80">Mon - Sat: 9:00 AM - 6:00 PM</p>
                      <p className="text-sm opacity-80">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Message Sent Successfully!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Thank you for reaching out to MIM Enterprises. We've received your inquiry and will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              📧 We'll send you updates via email and SMS
            </p>
            <p className="text-sm text-muted-foreground text-center">
              ☎️ You can also call us at +91 98765 43210
            </p>
          </div>
          <Button 
            onClick={() => setShowConfirmation(false)} 
            className="w-full mt-6"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
