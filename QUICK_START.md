# Quick Start Guide

## 5-Minute Setup

### Step 1: Supabase Project
1. Go to https://supabase.com and create a new project
2. Wait for the project to initialize
3. Copy your Project URL and Anon Key from Settings → API

### Step 2: Database Setup
1. Go to SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire content from `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Wait for it to complete ✅

### Step 3: Environment Variables
Create `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase credentials

### Step 4: Install & Run
```bash
npm install
npm run dev
```

Open http://localhost:5173

### Step 5: Test Login
The system uses a simple demo password system. Create test users through Supabase SQL:

```sql
-- Create test admin user
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@mim.com', 'cGFzc3dvcmQxMjM=', 'Admin User', 'admin');

-- Create test sales user
INSERT INTO users (email, password_hash, full_name, role) VALUES
('sales@mim.com', 'cGFzc3dvcmQxMjM=', 'Sales User', 'sales');

-- Create test operations user
INSERT INTO users (email, password_hash, full_name, role) VALUES
('operations@mim.com', 'cGFzc3dvcmQxMjM=', 'Operations User', 'operations');

-- Create test accounts user
INSERT INTO users (email, password_hash, full_name, role) VALUES
('accounts@mim.com', 'cGFzc3dvcmQxMjM=', 'Accounts User', 'accounts');
```

**Password for all test accounts**: `password123`

## Testing Workflow

### 1. Test Lead Creation
- Visit http://localhost:5173 (home page)
- Click "Contact Us"
- Fill the form and submit
- Check Supabase: `leads` table should have new record
- Check: `whatsapp_logs` table has template message

### 2. Test Dashboard Access
- Go to http://localhost:5173/login
- Login with `sales@mim.com` / `password123`
- See dashboard with stats
- Go to Leads page
- View and manage leads

### 3. Test Lead Status Update
- In Leads page, click eye icon on any lead
- Change status from dropdown
- Status updates in real-time
- Check `audit_logs` table for the change

### 4. Test WhatsApp Message
- From Leads page, click message icon
- Type a message
- Send
- Check `whatsapp_logs` table for new message

### 5. Test Project Creation
- Edit a lead status to "CONVERTED"
- Go back to that lead
- Click "Create Project" button
- Fill financial details
- Submit
- Check `projects` table

### 6. Test Payment Addition
- Login as `accounts@mim.com`
- Go to Payments page
- Add payment to a project
- Update payment status
- Check dashboard for "Payment Due" alerts

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| users | Employee accounts with roles |
| leads | Customer inquiries from website |
| projects | Converted leads with financials |
| project_updates | Progress and delay tracking |
| payments | Manual payment records |
| whatsapp_logs | Message history |
| audit_logs | Change tracking for compliance |

## Key Features

### ✅ Implemented
- Lead management with status workflow
- Contact form with lead creation
- Dashboard with real-time stats
- WhatsApp message logging (24h window)
- Payment tracking with due dates
- Project management
- Audit logging
- Role-based access control
- Beautiful UI with shadcn/ui

### 🔄 TODO (Optional Enhancements)
- Integrate actual WhatsApp Business API
- Implement cron job for daily payment alerts
- Add email notifications
- Implement proper password hashing (bcrypt)
- Add JWT authentication
- WhatsApp webhook for incoming messages
- Image upload for project updates
- PDF quote generation
- SMS alerts

## File Structure

```
src/
├── services/
│   ├── leadService.ts       ← Lead CRUD & workflow
│   ├── projectService.ts    ← Project management
│   ├── paymentService.ts    ← Payment tracking
│   ├── whatsappService.ts   ← WhatsApp logic
│   ├── userService.ts       ← User management
│   └── auditService.ts      ← Audit logging
├── contexts/
│   └── AuthContext.tsx      ← Auth state & login
├── pages/
│   ├── Contact.tsx          ← Public contact form
│   └── dashboard/
│       ├── DashboardHome.tsx
│       ├── Leads.tsx
│       ├── Projects.tsx
│       ├── Payments.tsx
│       └── ...
└── lib/
    └── supabase.ts          ← Supabase client
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Supabase connection failing
- Check `.env.local` has correct credentials
- Verify Supabase project is active
- Check browser console for error messages

### RLS policy errors
- Go to Supabase dashboard → Authentication → Policies
- Verify RLS policies are enabled
- Check policy conditions for your role

### Login not working
- Verify test users exist in `users` table
- Check password matches what you set
- Password should be base64 encoded (temporary system)

## Next Steps

1. **Setup WhatsApp**: Get API credentials and implement actual sending
2. **Deploy**: Push to Vercel, Netlify, or Docker
3. **Automate**: Set up cron job for daily alerts
4. **Email**: Add email notifications via SendGrid or Resend
5. **Analytics**: Add advanced reporting dashboard

## Support Files

- `IMPLEMENTATION_GUIDE.md` - Detailed technical documentation
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `.env.example` - Environment variable template

Happy coding! 🚀
