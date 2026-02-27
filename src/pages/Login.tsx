import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@mim.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast({ title: "Success", description: "Logged in successfully!" });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="font-heading font-bold text-2xl">MIM Enterprises</h1>
              <p className="text-sm text-muted-foreground mt-1">CRM Dashboard</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="admin@mim.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <Input
                  type="password"
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <h3 className="font-semibold text-sm">Demo Credentials</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-xs text-muted-foreground">ADMIN</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  admin@mim.com / password123
                </p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground">SALES</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  sales@mim.com / password123
                </p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground">OPERATIONS</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  operations@mim.com / password123
                </p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground">ACCOUNTS</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  accounts@mim.com / password123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
