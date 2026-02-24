import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-heading font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold mb-4">Company Information</h3>
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
              <div>
                <p className="font-heading font-bold">MIM Enterprises</p>
                <p className="text-xs text-muted-foreground">Authorised Partner of Prominance UPVC Doors & Windows</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1.5 block">Company Name</label><Input defaultValue="MIM Enterprises" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Phone</label><Input defaultValue="+91 98765 43210" /></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Address</label><Input defaultValue="123 Industrial Area, Hyderabad" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold mb-4">WhatsApp Settings</h3>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">WhatsApp Business Number</label><Input defaultValue="+91 98765 43210" /></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-send Welcome Message</p>
                  <p className="text-xs text-muted-foreground">Send automatic greeting to new leads</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Current Password</label><Input type="password" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">New Password</label><Input type="password" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Confirm Password</label><Input type="password" /></div>
              <Button>Update Password</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold mb-4">User Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email alerts for important updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
