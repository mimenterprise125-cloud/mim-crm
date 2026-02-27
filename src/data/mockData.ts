export type UserRole = "admin" | "sales" | "operations" | "accounts";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  location: string;
  status: "new" | "contacted" | "converted" | "lost";
  assignedEmployee: string;
  projectType: string;
  notes: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  clientName: string;
  totalSqft: number;
  ratePerSqft: number;
  gst: boolean;
  finalAmount: number;
  profitPercent: number;
  status: "planning" | "in-progress" | "completed" | "delayed";
  updates: { date: string; note: string }[];
}

export interface Payment {
  id: string;
  client: string;
  project: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  nextPaymentDate: string;
  status: "paid" | "partial" | "pending" | "overdue";
}

export const mockUsers: User[] = [
  { id: "U001", name: "Ahmed Khan", email: "ahmed@mim.com", role: "admin", active: true },
  { id: "U002", name: "Rahul Sharma", email: "rahul@mim.com", role: "sales", active: true },
  { id: "U003", name: "Priya Patel", email: "priya@mim.com", role: "operations", active: true },
  { id: "U004", name: "Sanjay Gupta", email: "sanjay@mim.com", role: "accounts", active: true },
  { id: "U005", name: "Fatima Begum", email: "fatima@mim.com", role: "sales", active: false },
];

export const mockLeads: Lead[] = [
  { id: "L001", name: "Rajesh Kumar", phone: "9876543210", location: "Hyderabad", status: "new", assignedEmployee: "Rahul Sharma", projectType: "Residential", notes: ["Initial inquiry for 3BHK windows"], createdAt: "2026-02-20" },
  { id: "L002", name: "Suresh Reddy", phone: "9876543211", location: "Secunderabad", status: "contacted", assignedEmployee: "Rahul Sharma", projectType: "Commercial", notes: ["Office building project", "Sent quotation"], createdAt: "2026-02-18" },
  { id: "L003", name: "Meena Devi", phone: "9876543212", location: "Bangalore", status: "converted", assignedEmployee: "Fatima Begum", projectType: "Residential", notes: ["Villa project confirmed"], createdAt: "2026-02-15" },
  { id: "L004", name: "Vikram Singh", phone: "9876543213", location: "Chennai", status: "lost", assignedEmployee: "Rahul Sharma", projectType: "Commercial", notes: ["Budget constraints"], createdAt: "2026-02-10" },
  { id: "L005", name: "Anita Joshi", phone: "9876543214", location: "Pune", status: "new", assignedEmployee: "Fatima Begum", projectType: "Residential", notes: ["Interested in sliding doors"], createdAt: "2026-02-22" },
  { id: "L006", name: "Deepak Mehta", phone: "9876543215", location: "Mumbai", status: "contacted", assignedEmployee: "Rahul Sharma", projectType: "Commercial", notes: ["Hotel project"], createdAt: "2026-02-19" },
];

export const mockProjects: Project[] = [
  { id: "P001", clientName: "Meena Devi", totalSqft: 1200, ratePerSqft: 450, gst: true, finalAmount: 637200, profitPercent: 18, status: "in-progress", updates: [{ date: "2026-02-20", note: "Frame installation started" }, { date: "2026-02-18", note: "Material delivered to site" }] },
  { id: "P002", clientName: "Star Hotels Pvt Ltd", totalSqft: 5000, ratePerSqft: 400, gst: true, finalAmount: 2360000, profitPercent: 22, status: "planning", updates: [{ date: "2026-02-21", note: "Site measurement completed" }] },
  { id: "P003", clientName: "Green Valley Apartments", totalSqft: 8000, ratePerSqft: 380, gst: true, finalAmount: 3585600, profitPercent: 15, status: "completed", updates: [{ date: "2026-02-10", note: "Project completed and handed over" }] },
  { id: "P004", clientName: "Sunshine Mall", totalSqft: 3500, ratePerSqft: 420, gst: false, finalAmount: 1470000, profitPercent: 20, status: "delayed", updates: [{ date: "2026-02-22", note: "Delayed due to material shortage" }] },
];

export const mockPayments: Payment[] = [
  { id: "PAY001", client: "Meena Devi", project: "P001", totalAmount: 637200, paidAmount: 300000, balance: 337200, nextPaymentDate: "2026-02-25", status: "partial" },
  { id: "PAY002", client: "Star Hotels Pvt Ltd", project: "P002", totalAmount: 2360000, paidAmount: 500000, balance: 1860000, nextPaymentDate: "2026-03-01", status: "partial" },
  { id: "PAY003", client: "Green Valley Apartments", project: "P003", totalAmount: 3585600, paidAmount: 3585600, balance: 0, nextPaymentDate: "-", status: "paid" },
  { id: "PAY004", client: "Sunshine Mall", project: "P004", totalAmount: 1470000, paidAmount: 0, balance: 1470000, nextPaymentDate: "2026-02-23", status: "overdue" },
];

export const products = [
  { name: "UPVC Sliding Windows", description: "Smooth gliding windows with excellent insulation and modern aesthetics.", icon: "sliding-window" },
  { name: "UPVC Casement Windows", description: "Hinged windows that open outward, providing maximum ventilation and clear views.", icon: "casement-window" },
  { name: "UPVC Sliding Doors", description: "Space-saving sliding doors with premium hardware and weatherproof seals.", icon: "sliding-door" },
  { name: "UPVC Tilt & Turn Windows", description: "Versatile windows that tilt for ventilation or turn for easy cleaning.", icon: "tilt-turn" },
];

export const whyChooseUs = [
  { title: "Energy Efficient", description: "Multi-chambered profiles that provide excellent thermal insulation, reducing energy costs.", icon: "Zap" },
  { title: "Noise Reduction", description: "Advanced sound insulation technology for peaceful interiors in any environment.", icon: "VolumeX" },
  { title: "Long Lasting", description: "Weather-resistant UPVC material with 25+ years of maintenance-free performance.", icon: "Shield" },
  { title: "Professional Installation", description: "Expert installation teams ensuring perfect fitting and finish every time.", icon: "Wrench" },
];

export const testimonials = [
  { name: "Arjun Kapoor", role: "Homeowner, Hyderabad", text: "MIM Enterprises transformed our home with beautiful UPVC windows. The noise reduction is incredible and the team was very professional." },
  { name: "Lakshmi Narayan", role: "Builder, Bangalore", text: "We've partnered with MIM for 3 residential projects. Their quality and timely delivery make them our go-to UPVC partner." },
  { name: "Mohammed Fazil", role: "Architect, Chennai", text: "The Prominance UPVC products are top-notch. MIM's installation team understands architectural requirements perfectly." },
];

export const completedProjects = [
  { name: "Green Valley Residency", location: "Hyderabad", sqft: "8,000 sqft" },
  { name: "Skyline Towers", location: "Bangalore", sqft: "12,000 sqft" },
  { name: "Ocean View Villas", location: "Goa", sqft: "5,500 sqft" },
  { name: "Metro Business Park", location: "Chennai", sqft: "15,000 sqft" },
  { name: "Royal Heritage Homes", location: "Pune", sqft: "6,200 sqft" },
  { name: "Diamond Plaza", location: "Mumbai", sqft: "20,000 sqft" },
];
