# MIM Doors & Windows - CRM System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [API Services](#api-services)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Workflows](#workflows)
8. [WhatsApp Integration](#whatsapp-integration)
9. [Deployment](#deployment)

## System Overview

This is a comprehensive CRM system for MIM Doors & Windows Hub designed to manage:
- **Lead Management**: Capture leads from website, assign to sales team
- **WhatsApp Communication**: Template-based initial contact with 24-hour free messaging window
- **Project Management**: Convert leads to projects with financial tracking
- **Payment Tracking**: Manual financial management with due date alerts
- **Audit Logging**: Complete transparency on all changes
- **Role-Based Access Control**: Admin, Sales, Operations, Accounts

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui + TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Session-based (localStorage)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Supabase JS SDK

### Folder Structure
```
src/
├── components/
│   ├── layout/          # Dashboard & public layouts
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts (Auth)
├── hooks/               # Custom hooks
├── lib/                 # Utilities & Supabase client
├── services/            # Business logic
│   ├── leadService.ts
│   ├── projectService.ts
│   ├── paymentService.ts
│   ├── whatsappService.ts
│   ├── userService.ts
│   └── auditService.ts
└── pages/               # Route pages
    ├── Contact.tsx      # Public contact form
    └── dashboard/       # Dashboard pages
```

## Database Schema

### Users Table
Stores employee accounts with role-based access
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  password_hash: VARCHAR,
  full_name: VARCHAR,
  role: admin|sales|operations|accounts,
  phone: VARCHAR,
  is_active: BOOLEAN
)
```

### Leads Table
All customer inquiries captured from the website
```sql
leads (
  id: UUID PRIMARY KEY,
  name: VARCHAR,
  phone: VARCHAR UNIQUE,
  location: VARCHAR,
  project_type: VARCHAR,
  message: TEXT,
  status: NEW|CONTACTED|FOLLOW_UP|SITE_VISIT|QUOTATION_SENT|NEGOTIATION|CONVERTED|LOST,
  source: WEBSITE|PHONE|REFERRAL|SOCIAL_MEDIA,
  assigned_to: UUID (FK users),
  conversation_status: BUSINESS_INITIATED|OPEN|CLOSED,
  open_window_expiry: TIMESTAMP (24h from customer reply)
)
```

### Projects Table
Converted leads with financial tracking
```sql
projects (
  id: UUID PRIMARY KEY,
  lead_id: UUID UNIQUE (FK leads),
  total_sqft: DECIMAL,
  rate_per_sqft: DECIMAL,
  gst_enabled: BOOLEAN,
  final_amount: DECIMAL (manual),
  profit_percentage: DECIMAL (manual),
  expected_completion_date: DATE,
  status: ACTIVE|DELAYED|COMPLETED|ON_HOLD|CANCELLED
)
```

### Project Updates Table
Track progress and delays
```sql
project_updates (
  id: UUID PRIMARY KEY,
  project_id: UUID (FK projects),
  type: PROGRESS|DELAY,
  description: TEXT,
  delay_reason: TEXT,
  old_expected_date: DATE,
  new_expected_date: DATE,
  image_urls: TEXT[] (array of URLs),
  created_by: UUID (FK users)
)
```

### Payments Table
Manual payment tracking with due date alerts
```sql
payments (
  id: UUID PRIMARY KEY,
  project_id: UUID (FK projects),
  amount: DECIMAL,
  type: ADVANCE|PARTIAL|FINAL,
  payment_date: DATE,
  status: PENDING|DUE|PAID|OVERDUE,
  next_payment_due_date: DATE,
  notes: TEXT,
  created_by: UUID (FK users)
)
```

### WhatsApp Logs Table
Complete conversation history
```sql
whatsapp_logs (
  id: UUID PRIMARY KEY,
  lead_id: UUID (FK leads),
  direction: INCOMING|OUTGOING,
  type: TEXT|TEMPLATE|MEDIA,
  body: TEXT,
  template_name: VARCHAR,
  media_url: VARCHAR,
  created_at: TIMESTAMP
)
```

### Audit Logs Table
Complete change tracking for compliance
```sql
audit_logs (
  id: UUID PRIMARY KEY,
  user_id: UUID (FK users),
  action_type: CREATE|UPDATE|DELETE|STATUS_CHANGE|SEND_MESSAGE,
  entity_type: LEAD|PROJECT|PAYMENT|EMPLOYEE|WHATSAPP_MESSAGE,
  entity_id: UUID,
  old_value: JSONB,
  new_value: JSONB,
  timestamp: TIMESTAMP
)
```

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. In SQL Editor, run the migration file:
   ```bash
   supabase/migrations/001_initial_schema.sql
   ```
3. Get your credentials:
   - Go to Settings → API
   - Copy `Project URL` and `anon public key`

### 2. Environment Configuration

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WHATSAPP_API_URL=https://api.whatsapp.com/send
```

### 3. Install Dependencies

```bash
npm install
# or
bun install
```

### 4. Run Development Server

```bash
npm run dev
# or
bun dev
```

### 5. Initialize Sample Data (Optional)

Access Supabase dashboard and manually create test users:
- admin@mim.com (Admin)
- sales@mim.com (Sales)
- operations@mim.com (Operations)
- accounts@mim.com (Accounts)

## API Services

### leadService
```typescript
// Create new lead from website form
await leadService.createLead({
  name, phone, location, projectType, message
})

// Get all leads with filters
await leadService.getLeads({ 
  status?: string, 
  assignedTo?: string, 
  limit?: number 
})

// Update lead status (creates audit log)
await leadService.updateLeadStatus(leadId, newStatus, userId)

// Assign lead to sales user
await leadService.assignLead(leadId, userId, assignedByUserId)

// Open 24-hour conversation window
await leadService.openConversationWindow(leadId)

// Check if conversation window is still open
await leadService.isConversationWindowOpen(leadId)
```

### projectService
```typescript
// Create project from converted lead
await projectService.createProject(leadId, {
  totalSqft, ratePerSqft, gstEnabled, finalAmount, 
  profitPercentage, expectedCompletionDate
}, userId)

// Add progress update
await projectService.addProgressUpdate(projectId, {
  description, imageUrls
}, userId)

// Add delay update (sends WhatsApp notification)
await projectService.addDelayUpdate(projectId, {
  delayReason, oldExpectedDate, newExpectedDate
}, userId)

// Update project status
await projectService.updateProjectStatus(projectId, status, userId)
```

### whatsappService
```typescript
// Send welcome template automatically on lead creation
await whatsappService.sendWelcomeTemplate(leadId, leadName)

// Log incoming message from customer
await whatsappService.receiveMessage(leadId, body)

// Send message from sales user
// If window closed → template only
// If window open → free text allowed
await whatsappService.sendMessage(
  leadId, body, userId, useTemplate, templateName
)

// Get conversation history
await whatsappService.getConversationHistory(leadId)

// Send delay notification (auto template if window closed)
await whatsappService.sendDelayNotification(
  leadId, userId, delayReason, newDate
)
```

### paymentService
```typescript
// Add payment
await paymentService.addPayment(projectId, {
  amount, type, paymentDate, nextPaymentDueDate, notes
}, userId)

// Get payments for project
await paymentService.getProjectPayments(projectId)

// Get all payments (Accounts only)
await paymentService.getPayments({
  status?: string, 
  dueToday?: boolean, 
  limit?: number 
})

// Update payment status
await paymentService.updatePaymentStatus(paymentId, status, userId)

// Get monthly revenue
await paymentService.getRevenueThis(month, year)

// Get pending payments
await paymentService.getPendingPayments()
```

### userService
```typescript
// Create employee (Admin only)
await userService.createEmployee({
  email, password, fullName, role, phone
}, adminUserId)

// Login user
await userService.login(email, password)

// Get current user
await userService.getCurrentUser()

// Logout
userService.logout()

// Get all employees (Admin)
await userService.getEmployees()

// Update employee role
await userService.updateEmployeeRole(employeeId, newRole, adminUserId)

// Deactivate employee
await userService.deactivateEmployee(employeeId, adminUserId)

// Get assigned leads for sales user
await userService.getAssignedLeads(userId)
```

### auditService
```typescript
// Log an action
await auditService.logAction({
  user_id, action_type, entity_type, entity_id, 
  old_value, new_value
})

// Get audit logs
await auditService.getAuditLogs({
  userId?: string,
  entityType?: string,
  entityId?: string,
  limit?: number
})

// Get entity history
await auditService.getEntityHistory(entityType, entityId)
```

## User Roles & Permissions

### ADMIN
- ✅ View all leads
- ✅ Assign leads
- ✅ Edit leads
- ✅ Create employees
- ✅ Change employee roles
- ✅ View audit logs
- ✅ View financial summaries
- ✅ Override settings

### SALES
- ✅ View assigned leads
- ✅ Change lead status
- ✅ Add notes to leads
- ✅ Send WhatsApp messages (respects 24h window)
- ✅ Convert lead to project
- ❌ Edit financial records of others
- ❌ View audit logs

### OPERATIONS
- ✅ View active projects
- ✅ Add project updates
- ✅ Add delay updates with reason
- ✅ Upload site images
- ✅ Send project notifications
- ❌ Modify payments
- ❌ Modify lead assignments

### ACCOUNTS
- ✅ Add payments
- ✅ Update payment status
- ✅ View payment due alerts
- ✅ View revenue reports
- ❌ Edit projects
- ❌ Edit leads

## Workflows

### Lead Creation Workflow
1. Customer fills contact form on website
2. **leadService.createLead()** validates input
3. Lead created with status="NEW"
4. **whatsappService.sendWelcomeTemplate()** sends template via WhatsApp
5. **auditService.logAction()** logs creation
6. Success response shown to customer

### Lead to Project Conversion
1. Sales updates lead status to "CONVERTED"
2. Admin/Sales clicks "Create Project"
3. Enter financial details (all manual):
   - Total Sqft
   - Rate per Sqft
   - GST enabled/disabled
   - Final amount
   - Profit percentage
   - Expected completion date
4. **projectService.createProject()** creates project
5. **leadService.updateLeadStatus()** prevents editing lead

### WhatsApp Conversation Logic
**Initial Message (Business → Customer)**
- Template required
- Sent automatically on lead creation
- Triggers 24-hour window

**Customer Reply**
- **whatsappService.receiveMessage()** logs incoming message
- **leadService.openConversationWindow()** sets expiry = now + 24h
- Conversation status = "OPEN"

**Sales → Customer (Within 24h)**
- Free text allowed
- Can send without template

**Sales → Customer (After 24h)**
- Template required only
- Free text rejected with error message

### Project Delay Workflow
1. Operations detects delay
2. **projectService.addDelayUpdate()** logs delay with reason
3. Project status changed to "DELAYED"
4. **whatsappService.sendDelayNotification()** sends notification:
   - If 24h window open → free text
   - If closed → template message
5. **auditService.logAction()** tracks change

### Payment Due Alert
1. Daily scheduled job (TODO: implement cron)
2. Check: `payment.next_payment_due_date == today`
3. Update: `payment.status = "DUE"`
4. Check: `project.expected_completion_date < today AND status != COMPLETED`
5. Update: `project.status = "OVERDUE"`
6. Dashboard shows due payments and overdue projects

## WhatsApp Integration

### Templates
Pre-approved templates stored in database:

1. **welcome_lead**
   ```
   Hello {{name}}, welcome to MIM Doors & Windows! We are excited 
   to help you with your project. Our team will be in touch shortly.
   ```

2. **quotation_sent**
   ```
   Hi {{name}}, we have prepared a detailed quotation for your 
   project. Please review and let us know if you have any questions.
   ```

3. **thank_you**
   ```
   Thank you {{name}} for choosing MIM Doors & Windows! We look 
   forward to a successful project together.
   ```

4. **payment_due**
   ```
   Hi {{name}}, this is a reminder that your payment of {{amount}} 
   is due on {{date}}.
   ```

### Integration Steps
1. Get WhatsApp Business Phone Number ID
2. Create WhatsApp Cloud API access token
3. Register templates with Meta/WhatsApp
4. Update `.env` with credentials
5. Implement actual API calls in `whatsappService.ts`

### Current Status
- ✅ Message logging structure
- ✅ 24-hour window logic
- ✅ Template vs free text rules
- ❌ Actual WhatsApp API calls (TODO: implement)

## Deployment

### Building for Production
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment Options
1. **Vercel** (Recommended)
   ```bash
   vercel deploy
   ```

2. **Netlify**
   ```bash
   netlify deploy
   ```

3. **Docker**
   ```bash
   docker build -t mim-crm .
   docker run -p 3000:3000 mim-crm
   ```

### Production Checklist
- [ ] Update Supabase RLS policies for production
- [ ] Implement proper password hashing (bcrypt)
- [ ] Add JWT token-based authentication
- [ ] Enable HTTPS
- [ ] Set up WhatsApp API credentials
- [ ] Configure CORS for production domain
- [ ] Implement rate limiting on WhatsApp endpoint
- [ ] Set up daily cron job for payment/project alerts
- [ ] Add email notifications for alerts
- [ ] Backup Supabase database regularly
- [ ] Set up monitoring and error tracking
- [ ] Implement proper error logging

## Testing

### Test Accounts
```
Admin:      admin@mim.com / password123
Sales:      sales@mim.com / password123
Operations: operations@mim.com / password123
Accounts:   accounts@mim.com / password123
```

### Manual Testing Flow
1. Login as admin, create employees
2. Login as sales, view assigned leads
3. Create test lead via contact form
4. Update lead status through dashboard
5. Convert to project with financial details
6. Add project updates with images
7. Create payments with due dates
8. Add delay update and verify WhatsApp message

## Troubleshooting

### Leads not showing
- Check Supabase connection in browser console
- Verify RLS policies allow access
- Check user role permissions

### WhatsApp messages not sending
- Verify API credentials in `.env`
- Check message validation and format
- Review WhatsApp logs in database

### Performance issues
- Check database indexes in Supabase
- Limit query results with pagination
- Cache frequently accessed data

## Future Enhancements
- [ ] Email notifications
- [ ] SMS integration
- [ ] Google Calendar sync
- [ ] Advanced reporting/analytics
- [ ] Mobile app (React Native)
- [ ] AI-powered lead scoring
- [ ] Automated follow-up sequences
- [ ] Multi-language support
- [ ] Two-factor authentication
- [ ] Role-based dashboard customization
