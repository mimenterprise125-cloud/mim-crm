import { Link } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div className="leading-tight">
            <span className="font-heading font-bold text-lg text-foreground">MIM Enterprises</span>
            <span className="block text-[10px] text-muted-foreground">Prominance UPVC Partner</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Home</Link>
          <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Contact</Link>
          <Link to="/login">
            <Button size="sm">Login</Button>
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/" className="block text-sm font-medium" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/contact" className="block text-sm font-medium" onClick={() => setOpen(false)}>Contact</Link>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full">Login</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
