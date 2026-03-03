import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="font-heading font-bold text-xl">MIM Enterprises</span>
          </div>
          <p className="text-sm opacity-70 mb-4">
            Premium UPVC doors and windows solutions for residential and commercial projects.
          </p>
          <div className="inline-block bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5">
            <span className="text-xs font-medium text-primary">Authorised Partner of Prominance UPVC</span>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-4">Contact</h4>
          <div className="space-y-3 text-sm opacity-70">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Hyderabad, Telangana, India</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98765 43210</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@mimenterprises.com</div>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
          <div className="space-y-3 text-sm">
            <div><a href="/" className="opacity-70 hover:opacity-100 transition-opacity">Home</a></div>
            <div><a href="/contact" className="opacity-70 hover:opacity-100 transition-opacity">Contact</a></div>
            <div><a href="/my-works" className="opacity-70 hover:opacity-100 transition-opacity">My Works</a></div>
            <div><Link to="/login" className="opacity-70 hover:opacity-100 transition-opacity">Login</Link></div>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs opacity-50">
        © 2026 MIM Enterprises. All rights reserved.
      </div>
    </footer>
  );
}
