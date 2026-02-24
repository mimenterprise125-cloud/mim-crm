# 🔐 Admin Login Guide

## Quick Start

### Admin Credentials

```
EMAIL: admin@mim.com
PASSWORD: password123
```

**Login URL:** http://localhost:5173/login

---

## All Test User Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mim.com | password123 |
| Sales | sales@mim.com | password123 |
| Operations | operations@mim.com | password123 |
| Accounts | accounts@mim.com | password123 |

---

## 📋 Setup Steps

### 1. Create Database (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your **Supabase URL** and **Anon Key**
3. Go to **SQL Editor** in Supabase dashboard
4. Run this SQL to create test users:

```sql
-- Insert test users with password123 hashed
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('admin@mim.com', 'cGFzc3dvcmQxMjM=', 'Admin User', 'admin', true),
('sales@mim.com', 'cGFzc3dvcmQxMjM=', 'Sales Rep', 'sales', true),
('operations@mim.com', 'cGFzc3dvcmQxMjM=', 'Operations Manager', 'operations', true),
('accounts@mim.com', 'cGFzc3dvcmQxMjM=', 'Accounts Lead', 'accounts', true);
```

> **Note:** Password hash `cGFzc3dvcmQxMjM=` is base64 encoding of "password123"

### 2. Setup Environment Variables

Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Start Dev Server

```bash
npm run dev
```

Then open http://localhost:5173

---

## 🎯 What to Test

### 1. Admin Login
- ✅ Go to http://localhost:5173/login
- ✅ Enter `admin@mim.com` / `password123`
- ✅ Click "Login"
- ✅ Should see Dashboard

### 2. Create a Lead
- ✅ Go to http://localhost:5173 (public site)
- ✅ Click "Contact Us"
- ✅ Fill form with:
  - Name: Test Customer
  - Phone: 9876543210
  - Location: Hyderabad
  - Project Type: Residential
  - Message: Interested in windows
- ✅ Click "Send Message"
- ✅ Go to Dashboard → Leads tab
- ✅ See your new lead with status "NEW"

### 3. Update Lead Status
- ✅ From Admin dashboard, go to Leads tab
- ✅ Click on a lead
- ✅ Change status from NEW → CONTACTED
- ✅ See it update in the table

### 4. View Statistics
- ✅ Dashboard shows:
  - Total Leads
  - New Leads
  - Converted Leads

---

## 🔑 Admin Capabilities

### Admin User Can:
- ✅ View all leads in the system
- ✅ View all projects
- ✅ View all payments
- ✅ Update lead status
- ✅ Create projects from leads
- ✅ Track payments
- ✅ See dashboard with real-time stats
- ✅ View all activities

### To Test Each Role:

**SALES (sales@mim.com)**
- Can only see assigned leads
- Can send messages
- Can update lead status
- Can create projects

**OPERATIONS (operations@mim.com)**
- Can add project updates
- Can report project delays
- Can track project progress

**ACCOUNTS (accounts@mim.com)**
- Can add payments
- Can update payment status
- Can view payment history

---

## 📊 Database Overview

### Tables Created:
1. **users** - Store employee accounts
2. **leads** - Customer inquiries from website
3. **projects** - Projects created from converted leads
4. **payments** - Payment tracking
5. **whatsapp_logs** - Message history (placeholder)
6. **audit_logs** - All actions logged for compliance
7. **project_updates** - Progress tracking

### Sample Data:
- 1 Admin user
- 3 Regular employees (Sales, Ops, Accounts)
- No leads yet (create via Contact form)

---

## 🚀 How Workflow Works

```
1. Customer fills "Contact Us" form
   ↓
2. Lead created in database with status "NEW"
   ↓
3. Admin/Sales views lead in dashboard
   ↓
4. Sales updates status: NEW → CONTACTED → ... → CONVERTED
   ↓
5. Admin creates PROJECT from converted lead
   ↓
6. Operations adds progress updates
   ↓
7. Accounts tracks payments
   ↓
8. All actions logged in audit_logs
```

---

## 📝 Troubleshooting

### "Invalid credentials" error
- Check email spelling (case-sensitive)
- Password must be exactly: `password123`
- Make sure user exists in database (run SQL INSERT above)

### "Cannot connect to database"
- Check SUPABASE_URL in .env.local
- Check SUPABASE_ANON_KEY in .env.local
- Verify Supabase project is active

### "Leads not showing"
- Make sure you created at least one lead via Contact form
- Go to http://localhost:5173/contact
- Fill and submit the form
- Then refresh dashboard

### "Port 5173 already in use"
```bash
# Kill the process on port 5173 and start again
npm run dev -- --port 3000
```

---

## 🎓 Key Features to Explore

1. **Dashboard** - Real-time statistics from database
2. **Contact Form** - Public page to create leads
3. **Leads Management** - View and manage all leads
4. **Lead Status Workflow** - NEW → CONTACTED → CONVERTED
5. **Database Integration** - All data persists in Supabase

---

## 📧 Support

For issues:
1. Check browser console (F12) for errors
2. Check terminal where `npm run dev` is running
3. Verify database connection in Supabase dashboard
4. Check that all .env.local variables are correct

---

**Created:** Feb 24, 2026  
**Last Updated:** Feb 24, 2026  
**Status:** ✅ Production Ready for Testing
