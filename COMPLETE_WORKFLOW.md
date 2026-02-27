# MIM Doors & Windows CRM - Complete Workflow Guide

## 🎯 System Overview

This is a full-stack CRM system built with React + TypeScript frontend and Supabase backend. It manages:
- Lead capture from website
- WhatsApp communication with 24-hour conversation window
- Project creation and tracking
- Payment management with due date alerts
- Complete audit logging for compliance
- Role-based access control (Admin, Sales, Operations, Accounts)

---

## 📊 Complete User Journey & System Flow

### STAGE 1: CUSTOMER → WEBSITE → LEAD CREATION

#### Step 1: Customer Visits Website
```
https://localhost:5173/
↓
Sees homepage with products
Clicks "Contact Us" button
```

#### Step 2: Customer Fills Contact Form
```
Page: https://localhost:5173/contact

Form Fields:
├── Name (text input)
├── Phone (text input - unique)
├── Location (text input)
├── Project Type (dropdown: residential/commercial/industrial/renovation)
└── Message (textarea)

User clicks "Send Message"
```

#### Step 3: Form Submission Process
```
Contact.tsx component triggers:

1. INPUT VALIDATION
   ├── All fields required
   ├── Phone format checked
   └── Returns error if invalid

2. leadService.createLead({...})
   ├── Database INSERT into leads table
   │   ├── status: "NEW"
   │   ├── source: "WEBSITE"
   │   ├── assigned_to: null
   │   ├── conversation_status: "BUSINESS_INITIATED"
   │   └── open_window_expiry: null
   │
   ├── whatsappService.sendWelcomeTemplate(leadId, name)
   │   ├── Creates entry in whatsapp_logs table
   │   │   ├── direction: "OUTGOING"
   │   │   ├── type: "TEMPLATE"
   │   │   ├── template_name: "welcome_lead"
   │   │   └── body: "Hello {{name}}, welcome..."
   │   │
   │   └── [TODO] Call actual WhatsApp Business API
   │       └── Sends message to customer's phone
   │
   └── auditService.logAction(...)
       └── Logs creation in audit_logs table

4. RESPONSE TO USER
   ├── Success toast: "Message sent!"
   ├── Form clears
   └── Email confirmation [TODO: implement]
```

**Database State After Step 3:**
```sql
-- leads table
| id | name | phone | location | status | conversation_status | open_window_expiry |
|----+------+-------+----------+--------+---------------------+--------------------|
| UUID-1 | John Doe | +919876... | Hyderabad | NEW | BUSINESS_INITIATED | NULL |

-- whatsapp_logs table
| id | lead_id | direction | type | body | template_name |
|----+---------+-----------+------+------+---------------|
| UUID-log-1 | UUID-1 | OUTGOING | TEMPLATE | "Hello John..." | welcome_lead |

-- audit_logs table
| id | user_id | action_type | entity_type | entity_id |
|----+---------+-------------+-------------+-----------|
| UUID-audit-1 | system | CREATE | LEAD | UUID-1 |
```

---

### STAGE 2: SALES TEAM → MANAGE LEADS → WHATSAPP CONVERSATION

#### Step 4: Sales User Logs In
```
URL: https://localhost:5173/login

Login Page:
├── Email: sales@mim.com
├── Password: password123
└── Click "Login"

AuthContext.tsx processes:
├── userService.login(email, password)
│   ├── Queries users table
│   ├── Verifies password match
│   ├── Stores user in localStorage
│   └── Returns user object
│
└── Redirects to /dashboard
```

#### Step 5: Sales Views Dashboard
```
URL: https://localhost:5173/dashboard

DashboardHome.tsx shows:
├── Stats Cards:
│   ├── Total Leads: 1
│   ├── Converted Leads: 0
│   ├── Active Projects: 0
│   ├── Monthly Revenue: ₹0
│   ├── Pending Payments: 0
│   └── Delayed Projects: 0
│
├── Charts:
│   ├── Lead Conversion Trend
│   └── Lead Status Distribution
│
└── Recent Activity:
    ├── Recent Leads table
    └── Payment Due Alerts
```

**How Stats Are Calculated:**
```typescript
// DashboardHome.tsx
const loadDashboardData = async () => {
  // Get all leads
  const leadsResult = await leadService.getLeads();
  setStats(prev => ({
    totalLeads: leadsResult.data.length,
    convertedLeads: leadsResult.data.filter(l => l.status === 'CONVERTED').length
  }));
  
  // Get projects
  const projectsResult = await projectService.getProjects();
  setStats(prev => ({
    activeProjects: projectsResult.data.filter(p => p.status === 'ACTIVE').length,
    delayedProjects: projectsResult.data.filter(p => p.status === 'DELAYED').length
  }));
  
  // Get revenue
  const revenue = await paymentService.getRevenueThis();
  setStats(prev => ({ monthlyRevenue: revenue }));
};
```

#### Step 6: Sales Views All Leads
```
URL: https://localhost:5173/dashboard/leads

Leads.tsx shows:
├── Search Bar (by name or phone)
├── Status Filter Dropdown (All/New/Contacted/etc.)
│
└── Table of Leads:
    | Name | Phone | Location | Status | Actions |
    |------|-------|----------|--------|---------|
    | John Doe | +919876... | Hyderabad | NEW | View | Message |

Sales clicks "View" icon (eye)
```

#### Step 7: Sales Views Lead Details
```
Dialog opens showing:
├── Lead Details:
│   ├── Name: John Doe
│   ├── Phone: +919876543210
│   ├── Location: Hyderabad
│   ├── Project Type: Residential
│   ├── Message: "Interested in windows"
│
├── Status Dropdown (can change)
│   ├── NEW
│   ├── CONTACTED (sales clicks this)
│   ├── FOLLOW_UP
│   ├── SITE_VISIT
│   ├── QUOTATION_SENT
│   ├── NEGOTIATION
│   ├── CONVERTED
│   └── LOST

Sales clicks "CONTACTED"
```

**Status Change Process:**
```typescript
const handleStatusChange = async (leadId, status) => {
  // Update lead status
  const result = await leadService.updateLeadStatus(
    leadId, 
    'CONTACTED', 
    user.id
  );
  
  // Behind the scenes:
  // 1. UPDATE leads SET status = 'CONTACTED' WHERE id = ...
  // 2. INSERT into audit_logs (who changed it, when, old value, new value)
  // 3. Refresh lead list UI
};
```

**Database State:**
```sql
-- leads table (UPDATED)
| id | name | status | assigned_to | updated_at |
|----+------+--------+-------------+------------|
| UUID-1 | John Doe | CONTACTED | NULL | 2026-02-24 14:30:00 |

-- audit_logs table (NEW ENTRY)
| user_id | action_type | entity_type | old_value | new_value |
|---------|-------------|-------------|-----------|-----------|
| sales-user-uuid | STATUS_CHANGE | LEAD | {status: NEW} | {status: CONTACTED} |
```

#### Step 8: Sales Sends WhatsApp Message
```
Sales clicks "Message" icon (chat bubble) on lead

Dialog opens:
├── To: John Doe (+919876543210)
├── Message textarea: "Hi John, thanks for reaching out..."
└── "Send Message" button

System checks:
├── Is conversation window OPEN?
│   ├── If YES → Allow free text message
│   ├── If NO → Force template-only message
│
└── Messages recorded in whatsapp_logs table

Sales clicks "Send Message"
```

**Message Sending Logic:**
```typescript
// whatsappService.ts
const handleSendWhatsApp = async () => {
  // Step 1: Check conversation window
  const windowOpen = await leadService.isConversationWindowOpen(leadId);
  
  if (!windowOpen && !useTemplate) {
    // Error: Can't send free text after 24h
    return {
      success: false,
      error: "Conversation window closed. Only templates allowed."
    };
  }
  
  // Step 2: Log the message
  await supabase.from('whatsapp_logs').insert({
    lead_id: leadId,
    direction: 'OUTGOING',
    type: useTemplate ? 'TEMPLATE' : 'TEXT',
    body: message,
    template_name: useTemplate ? templateName : null
  });
  
  // Step 3: Log to audit
  await auditService.logAction({
    user_id: userId,
    action_type: 'SEND_MESSAGE',
    entity_type: 'WHATSAPP_MESSAGE',
    new_value: { body, type }
  });
  
  // Step 4: [TODO] Call actual WhatsApp API
  // await callWhatsAppAPI(phone, message);
};
```

**Database State:**
```sql
-- whatsapp_logs table (NEW ENTRY)
| lead_id | direction | type | body | created_at |
|---------+-----------+------+------+------------|
| UUID-1 | OUTGOING | TEXT | "Hi John, thanks..." | 2026-02-24 14:32:00 |

-- audit_logs table (NEW ENTRY)
| user_id | action_type | entity_type | new_value |
|---------+-------------+-------------+-----------|
| sales-user-uuid | SEND_MESSAGE | WHATSAPP_MESSAGE | {body, type: TEXT} |
```

#### Step 9: Customer Replies (Incoming Message)
```
Customer sends message via WhatsApp to business number:
"Yes, I'm interested in tilt-turn windows"

[TODO] Webhook receives message from WhatsApp API
↓
whatsappService.receiveMessage(leadId, messageBody)
├── Logs incoming message in whatsapp_logs
│   ├── direction: "INCOMING"
│   ├── type: "TEXT"
│   ├── body: "Yes, I'm interested..."
│   └── timestamp: now
│
└── Opens conversation window
    ├── leadService.openConversationWindow(leadId)
    │   ├── conversation_status: "OPEN"
    │   ├── open_window_expiry: now + 24 hours
    │   └── UPDATE leads SET open_window_expiry = ...
    │
    └── Now sales can send FREE TEXT messages for 24h
        (after 24h, only templates allowed)
```

**Database State:**
```sql
-- whatsapp_logs table (NEW ENTRY)
| lead_id | direction | type | body |
|---------+-----------+------+------|
| UUID-1 | INCOMING | TEXT | "Yes, I'm interested..." |

-- leads table (UPDATED)
| id | conversation_status | open_window_expiry |
|----+---------------------+--------------------|
| UUID-1 | OPEN | 2026-02-25 14:32:00 (24h from now) |
```

---

### STAGE 3: LEAD → PROJECT CONVERSION

#### Step 10: Sales Updates Lead to "CONVERTED"
```
Sales views lead details
├── Sees status dropdown
├── Selects "CONVERTED"
├── Status updates in database
└── Lead can now become a project

Sales then clicks "Create Project" button [NEW BUTTON - TODO: add]
```

#### Step 11: Create Project with Financial Details
```
Dialog/Page opens: "Create Project"

Form Fields:
├── Total SQFT (e.g., 5000)
├── Rate per SQFT (e.g., 1500)
├── GST Enabled (toggle: true/false)
├── Final Amount (e.g., 7500000) - MANUAL ENTRY
├── Profit Percentage (e.g., 15%) - OPTIONAL
└── Expected Completion Date (e.g., 2026-06-30)

All financial fields are MANUALLY entered.
NO auto-calculation.

Sales clicks "Create Project"
```

**Project Creation Process:**
```typescript
// projectService.ts
const createProject = async (leadId, data, userId) => {
  // Step 1: Insert into projects table
  const { data: project } = await supabase
    .from('projects')
    .insert({
      lead_id: leadId,
      total_sqft: data.totalSqft,
      rate_per_sqft: data.ratePerSqft,
      gst_enabled: data.gstEnabled,
      final_amount: data.finalAmount, // MANUAL
      profit_percentage: data.profitPercentage, // MANUAL
      expected_completion_date: data.expectedCompletionDate,
      status: 'ACTIVE'
    })
    .select()
    .single();
  
  // Step 2: Log to audit
  await auditService.logAction({
    user_id: userId,
    action_type: 'CREATE',
    entity_type: 'PROJECT',
    new_value: { lead_id, final_amount, status: 'ACTIVE' }
  });
  
  return project;
};
```

**Database State:**
```sql
-- projects table (NEW ENTRY)
| id | lead_id | total_sqft | rate_per_sqft | final_amount | status | expected_completion_date |
|----+---------+------------+---------------+--------------+--------+--------------------------|
| UUID-proj-1 | UUID-1 | 5000 | 1500 | 7500000 | ACTIVE | 2026-06-30 |

-- leads table (UPDATED - implicit, for reference)
| status |
|--------|
| CONVERTED |

-- audit_logs table (NEW ENTRY)
| entity_type | action_type | new_value |
|-------------|-------------|-----------|
| PROJECT | CREATE | {final_amount: 7500000, status: ACTIVE} |
```

---

### STAGE 4: PROJECT MANAGEMENT

#### Step 12: Operations Views Projects
```
URL: https://localhost:5173/dashboard/projects

Projects.tsx shows:
├── Status Filter (All/Active/Delayed/Completed)
├── Table of Projects:
│   | Client | SQFT | Rate | Amount | Status | Actions |
│   |--------|------|------|--------|--------|---------|
│   | John Doe | 5000 | 1500 | 75L | ACTIVE | View |

Operations clicks "View"
```

#### Step 13: Operations Adds Progress Update
```
Project Details Dialog shows:
├── Project Info (read-only)
├── "Add Update" button
└── "Report Delay" button

Operations clicks "Add Update"

Form appears:
├── Description (textarea): "Frame installation started"
├── Images (file upload) [TODO: implement file upload]
└── "Submit Update" button

Database logs:
├── project_updates table INSERT
│   ├── type: 'PROGRESS'
│   ├── description: "Frame installation started"
│   ├── created_by: operations-user-uuid
│   └── timestamp: now
│
└── audit_logs table INSERT
    └── Logs who added the update
```

#### Step 14: Project Gets Delayed
```
Operations detects delay (material shortage, etc.)

Operations clicks "Report Delay"

Dialog shows:
├── Reason (textarea): "Supplier delayed glass delivery"
├── New Expected Date (date picker): 2026-07-15
└── "Submit" button

Operations submits
```

**Delay Reporting Process:**
```typescript
// projectService.ts
const addDelayUpdate = async (projectId, data, userId) => {
  // Step 1: Update project status to DELAYED
  await supabase
    .from('projects')
    .update({ status: 'DELAYED', expected_completion_date: data.newExpectedDate })
    .eq('id', projectId);
  
  // Step 2: Log delay update
  await supabase.from('project_updates').insert({
    project_id: projectId,
    type: 'DELAY',
    delay_reason: data.delayReason,
    old_expected_date: data.oldExpectedDate,
    new_expected_date: data.newExpectedDate,
    created_by: userId
  });
  
  // Step 3: Send WhatsApp notification to customer
  // Get lead associated with project
  const { leads } = await getProject(projectId);
  
  // Check if conversation window is open
  const windowOpen = await leadService.isConversationWindowOpen(leads.id);
  
  if (windowOpen) {
    // Send free text message
    await whatsappService.sendMessage(
      leads.id,
      `We wanted to inform you about a slight delay in your project. New expected completion date: ${data.newExpectedDate}.`,
      userId,
      false // not a template
    );
  } else {
    // Send template message (24h window closed)
    await whatsappService.sendMessage(
      leads.id,
      templateBody,
      userId,
      true, // is a template
      'project_delay'
    );
  }
  
  // Step 4: Log to audit
  await auditService.logAction({
    user_id: userId,
    action_type: 'STATUS_CHANGE',
    entity_type: 'PROJECT',
    old_value: { status: 'ACTIVE' },
    new_value: { status: 'DELAYED', reason: data.delayReason }
  });
};
```

**Database State:**
```sql
-- projects table (UPDATED)
| status | expected_completion_date | updated_at |
|--------|--------------------------|------------|
| DELAYED | 2026-07-15 | 2026-02-24 15:00:00 |

-- project_updates table (NEW ENTRY)
| project_id | type | delay_reason | old_expected_date | new_expected_date |
|------------|------|------|------|------|
| UUID-proj-1 | DELAY | Supplier delayed glass delivery | 2026-06-30 | 2026-07-15 |

-- whatsapp_logs table (NEW ENTRY)
| lead_id | direction | type | body |
|---------+-----------+------+------|
| UUID-1 | OUTGOING | TEXT | We wanted to inform you about a slight delay... |

-- audit_logs table (NEW ENTRY)
| action_type | entity_type | old_value | new_value |
|-------------|-------------|-----------|-----------|
| STATUS_CHANGE | PROJECT | {status: ACTIVE} | {status: DELAYED, reason: ...} |
```

---

### STAGE 5: PAYMENT MANAGEMENT

#### Step 15: Accounts User Logs In & Views Payments
```
URL: https://localhost:5173/login

Login:
├── Email: accounts@mim.com
├── Password: password123
└── Click "Login"

Redirects to:
https://localhost:5173/dashboard/payments
```

#### Step 16: Accounts Adds Payment
```
Payments.tsx shows:
├── Button: "+ Add Payment"
├── Table of Payments (filters by status)
└── Search bar

Accounts clicks "+ Add Payment"

Dialog appears:
├── Project Selector (dropdown of active projects)
├── Amount (₹ input): 2500000
├── Payment Type (dropdown):
│   ├── ADVANCE
│   ├── PARTIAL (selected)
│   └── FINAL
├── Payment Date (date): 2026-02-24
├── Next Payment Due Date (date): 2026-04-30
├── Notes (textarea): "Advance payment for frame"
└── "Add Payment" button
```

**Payment Creation:**
```typescript
// paymentService.ts
const addPayment = async (projectId, data, userId) => {
  // Step 1: Insert into payments table
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      project_id: projectId,
      amount: data.amount,
      type: data.type, // ADVANCE/PARTIAL/FINAL
      payment_date: data.paymentDate,
      status: 'PENDING', // Default
      next_payment_due_date: data.nextPaymentDueDate,
      notes: data.notes,
      created_by: userId
    })
    .select()
    .single();
  
  // Step 2: Log to audit
  await auditService.logAction({
    user_id: userId,
    action_type: 'CREATE',
    entity_type: 'PAYMENT',
    new_value: {
      amount: data.amount,
      type: data.type,
      nextPaymentDue: data.nextPaymentDueDate
    }
  });
  
  return payment;
};
```

**Database State:**
```sql
-- payments table (NEW ENTRY)
| id | project_id | amount | type | payment_date | status | next_payment_due_date |
|----+------------+--------+------+--------------+--------+-----------------------|
| UUID-pay-1 | UUID-proj-1 | 2500000 | PARTIAL | 2026-02-24 | PENDING | 2026-04-30 |

-- audit_logs table (NEW ENTRY)
| user_id | action_type | entity_type | new_value |
|---------+-------------+-------------+-----------|
| accounts-uuid | CREATE | PAYMENT | {amount: 2500000, type: PARTIAL} |
```

#### Step 17: Daily Alert System (Scheduled Job - TODO)
```
[This requires server-side cron job implementation]

Daily at midnight:
├── Check payments where next_payment_due_date == TODAY
│   └── Update status = 'DUE'
│
├── Check projects where expected_completion_date < TODAY
│   └── Update status = 'OVERDUE' (if not COMPLETED)
│
└── Dashboard automatically shows:
    ├── Payment Due Today card
    ├── Delayed Projects card
    └── Alerts for admin/accounts users
```

#### Step 18: Accounts Updates Payment Status
```
Payments Table shows:
| Amount | Type | Due Date | Status | Actions |
|--------|------|----------|--------|---------|
| 25L | PARTIAL | 2026-04-30 | PENDING | Mark Paid |

Accounts clicks "Mark Paid"

Status updates from PENDING → PAID

Database Updates:
├── UPDATE payments SET status = 'PAID' WHERE id = ...
└── INSERT into audit_logs (who marked it paid, when)
```

---

### STAGE 6: DASHBOARD OVERVIEW

#### Step 19: Admin Views Complete Dashboard
```
URL: https://localhost:5173/dashboard

DashboardHome shows REAL-TIME STATS:
├── Total Leads: 1 (from leads table)
├── Converted Leads: 1 (status = CONVERTED)
├── Active Projects: 1 (status = ACTIVE)
├── Delayed Projects: 0 (status = DELAYED)
├── Monthly Revenue: ₹2,500,000 (sum of PAID payments)
├── Pending Payments: ₹5,000,000 (sum of PENDING/DUE/OVERDUE)
│
├── Charts:
│   ├── Lead Conversion Trend (recharts)
│   └── Lead Status Distribution (pie chart)
│
├── Alerts:
│   ├── "1 delayed project needs attention" (RED)
│   └── "2 payments are pending" (YELLOW)
│
└── Recent Activity:
    ├── Last 4 leads created
    └── Last 4 due payments
```

---

### STAGE 7: AUDIT LOGGING & COMPLIANCE

Every action creates an audit log entry:

```
When: Lead created
├── user_id: system (lead from website)
├── action_type: CREATE
├── entity_type: LEAD
├── entity_id: UUID-1
└── new_value: {name, phone, status: NEW}

When: Status changed
├── user_id: sales-user-uuid
├── action_type: STATUS_CHANGE
├── entity_type: LEAD
├── entity_id: UUID-1
├── old_value: {status: NEW}
└── new_value: {status: CONTACTED}

When: Message sent
├── user_id: sales-user-uuid
├── action_type: SEND_MESSAGE
├── entity_type: WHATSAPP_MESSAGE
├── entity_id: lead-uuid
└── new_value: {body, type, direction: OUTGOING}

When: Payment added
├── user_id: accounts-user-uuid
├── action_type: CREATE
├── entity_type: PAYMENT
├── entity_id: payment-uuid
└── new_value: {amount, type, status}

When: Project delayed
├── user_id: operations-user-uuid
├── action_type: STATUS_CHANGE
├── entity_type: PROJECT
├── entity_id: project-uuid
├── old_value: {status: ACTIVE, date: 2026-06-30}
└── new_value: {status: DELAYED, date: 2026-07-15, reason: ...}
```

Admin can view all audit logs:
```
URL: https://localhost:5173/dashboard/audit-logs [TODO: create page]

Shows timeline:
├── 2026-02-24 15:00 | Ahmed Khan (Admin) | Updated lead status to CONTACTED
├── 2026-02-24 14:32 | Rahul Sharma (Sales) | Sent WhatsApp message
├── 2026-02-24 14:30 | Rahul Sharma (Sales) | Created project from lead
└── 2026-02-24 10:00 | System | Created lead from website
```

---

## 🏗️ Technical Architecture

### Frontend Flow
```
User Browser
├── React Components
│   ├── Pages
│   │   ├── Contact.tsx (public)
│   │   ├── Login.tsx (public)
│   │   └── dashboard/
│   │       ├── DashboardHome.tsx
│   │       ├── Leads.tsx
│   │       ├── Projects.tsx
│   │       ├── Payments.tsx
│   │       └── Settings.tsx
│   │
│   └── Contexts
│       └── AuthContext.tsx (manages user session)
│
├── Services Layer (Business Logic)
│   ├── leadService.ts
│   ├── projectService.ts
│   ├── paymentService.ts
│   ├── whatsappService.ts
│   ├── userService.ts
│   └── auditService.ts
│
└── Supabase Client (lib/supabase.ts)
    └── Connects to PostgreSQL via REST API
```

### Data Flow Example: Create Lead
```
User submits form
↓
Contact.tsx validates input
↓
leadService.createLead() calls:
  ├── supabase.from('leads').insert()        [INSERT to DB]
  ├── whatsappService.sendWelcomeTemplate()  [Log message]
  └── auditService.logAction()               [Log action]
↓
Services make HTTP requests to Supabase REST API
↓
Supabase executes:
  ├── INSERT into leads
  ├── INSERT into whatsapp_logs
  ├── INSERT into audit_logs
  ├── Check RLS policies
  └── Apply indexes
↓
Returns JSON response to frontend
↓
Frontend updates UI with toast notification
```

---

## 🔐 Security & Role-Based Access

### Role Permissions Matrix

| Action | Admin | Sales | Operations | Accounts |
|--------|-------|-------|------------|----------|
| View all leads | ✅ | ✅* | ❌ | ❌ |
| Create lead | ✅ | ✅ | ❌ | ❌ |
| Change lead status | ✅ | ✅* | ❌ | ❌ |
| Send WhatsApp | ✅ | ✅ | ✅ | ❌ |
| Create project | ✅ | ✅* | ❌ | ❌ |
| Add project update | ✅ | ❌ | ✅ | ❌ |
| Report delay | ✅ | ❌ | ✅ | ❌ |
| Add payment | ✅ | ❌ | ❌ | ✅ |
| View payments | ✅ | ❌ | ❌ | ✅ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| Create employee | ✅ | ❌ | ❌ | ❌ |

*Sales can only view/manage assigned leads

### Authentication Flow
```
1. User enters email/password on /login
2. userService.login() queries users table
3. Password verified (currently base64, TODO: bcrypt)
4. User object stored in localStorage
5. AuthContext updates
6. useAuth() hook available throughout app
7. ProtectedRoute wraps pages
8. RLS policies enforce DB-level access
```

---

## 🚀 How to Run

### 1. Setup
```bash
# Navigate to project
cd "C:\Users\Mujahid Islam Khan\Downloads\mim-doors-windows-hub-main\mim-doors-windows-hub-main"

# Create .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Install dependencies (already done)
npm install --legacy-peer-deps
```

### 2. Database Setup
```bash
# In Supabase dashboard:
# 1. Create new project
# 2. Go to SQL Editor
# 3. Paste content of supabase/migrations/001_initial_schema.sql
# 4. Click "Run"
```

### 3. Create Test Users
```sql
-- Run in Supabase SQL Editor
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@mim.com', 'cGFzc3dvcmQxMjM=', 'Admin User', 'admin'),
('sales@mim.com', 'cGFzc3dvcmQxMjM=', 'Sales Rep', 'sales'),
('operations@mim.com', 'cGFzc3dvcmQxMjM=', 'Ops Manager', 'operations'),
('accounts@mim.com', 'cGFzc3dvcmQxMjM=', 'Accounts Lead', 'accounts');
```

### 4. Start Dev Server
```bash
npm run dev
```

Visits:
- Public site: http://localhost:5173
- Contact form: http://localhost:5173/contact
- Login: http://localhost:5173/login
- Dashboard: http://localhost:5173/dashboard (after login)

---

## 📱 Complete User Journey Timeline

```
TIME          EVENT                                    TABLE
────────────────────────────────────────────────────────────────
10:00 AM    Customer fills contact form              leads ✓
            Welcome template sent                    whatsapp_logs ✓
            Lead created                             audit_logs ✓

10:30 AM    Sales logs in                           (no DB change)

11:00 AM    Sales updates lead to CONTACTED         leads ✓
                                                    audit_logs ✓

11:15 AM    Sales sends message "Hi, interested?"   whatsapp_logs ✓
                                                    audit_logs ✓

11:30 AM    Customer replies "Yes, tell me more"    whatsapp_logs ✓
            24h window opens                        leads ✓

12:00 PM    Sales sends quotation details           whatsapp_logs ✓

2:00 PM     Sales updates lead to QUOTATION_SENT    leads ✓
                                                    audit_logs ✓

4:00 PM     Customer agrees → Status CONVERTED      leads ✓
                                                    audit_logs ✓

4:30 PM     Sales creates project with financials  projects ✓
                                                    audit_logs ✓

NEXT DAY:
9:00 AM     Operations adds progress update         project_updates ✓
                                                    audit_logs ✓

3:00 PM     Operations reports 3-day delay          project_updates ✓
            Customer notified                       whatsapp_logs ✓
            Project marked DELAYED                  projects ✓
                                                    audit_logs ✓

NEXT WEEK:
10:00 AM    Accounts adds advance payment           payments ✓
                                                    audit_logs ✓

NEXT MONTH:
Due Date    Payment due alert triggered             (cron job)
            Dashboard shows payment due             (calculations)

COMPLETION:
Project     Project marked COMPLETED                projects ✓
            Thank you message sent                  whatsapp_logs ✓
            Final payment recorded                  payments ✓
```

---

## 📊 Data Size Estimates

After 1 year of operation (assuming 100 leads/month):

```
Leads:              1,200 rows        ~100 KB
Projects:           240 rows          ~50 KB
Payments:           600 rows          ~50 KB
WhatsApp Logs:      5,000 rows        ~500 KB
Audit Logs:         15,000 rows       ~2 MB
Project Updates:    500 rows          ~100 KB
────────────────────────────────────
TOTAL:                              ~3.3 MB
```

Supabase provides 500MB free tier, so no issues for years.

---

## ✅ Implementation Checklist

### Completed ✓
- [x] Database schema with RLS
- [x] Lead creation & status workflow
- [x] WhatsApp message logging
- [x] 24-hour conversation window logic
- [x] Project creation & management
- [x] Payment tracking
- [x] Audit logging
- [x] Role-based access control
- [x] Dashboard with real-time stats
- [x] User authentication
- [x] Frontend pages & components
- [x] Service layer with business logic

### TODO 🔄
- [ ] Actual WhatsApp Business API integration
- [ ] Webhook for incoming WhatsApp messages
- [ ] Cron job for daily payment/project alerts
- [ ] Email notifications
- [ ] File upload for project images
- [ ] PDF quote generation
- [ ] Password hashing (bcrypt)
- [ ] JWT authentication
- [ ] Settings/Admin pages completion
- [ ] Advanced reporting
- [ ] SMS integration
- [ ] Mobile app (React Native)

---

## 🎓 Key Concepts

### 24-Hour Conversation Window
```
Timeline:
├── Customer receives welcome template (Business sends first)
│
├── [Conversation starts - window CLOSED]
│   └── Sales can only send TEMPLATES
│
├── Customer replies (customer sends first reply)
│   └── Window OPENS: open_window_expiry = now + 24 hours
│
├── [24 hours - window OPEN]
│   └── Sales can send FREE TEXT or TEMPLATES
│
└── After 24 hours - window CLOSED
    └── Sales can only send TEMPLATES again
```

### Manual Financial Calculations
```
NO formulas.
NO auto-calculations.

❌ Wrong:
final_amount = total_sqft × rate_per_sqft

✅ Right:
Accounts user manually enters all amounts:
├── final_amount: 7,500,000
├── advance_payment: 2,500,000
├── remaining: user calculates themselves
└── profit: optional manual field
```

### Role-Based Dashboard
```
Admin sees:     All leads, all projects, all payments, audit logs
Sales sees:     Assigned leads, their conversions, sent messages
Operations sees: Active projects, can add updates and report delays
Accounts sees:  Payments, due dates, revenue calculations
```

---

## 📚 Files Structure

```
src/
├── services/               # Business logic
│   ├── leadService.ts      # Lead CRUD & workflow
│   ├── projectService.ts   # Project management
│   ├── paymentService.ts   # Financial tracking
│   ├── whatsappService.ts  # WhatsApp logic
│   ├── userService.ts      # User authentication
│   └── auditService.ts     # Audit logging
│
├── pages/                  # Route components
│   ├── Contact.tsx         # Public form
│   ├── Login.tsx           # Auth page
│   └── dashboard/
│       ├── DashboardHome.tsx
│       ├── Leads.tsx
│       ├── Projects.tsx
│       ├── Payments.tsx
│       └── Settings.tsx
│
├── components/
│   ├── layout/
│   │   ├── PublicLayout.tsx
│   │   └── DashboardLayout.tsx
│   └── ui/                 # shadcn components
│
├── contexts/
│   └── AuthContext.tsx     # Global auth state
│
└── lib/
    └── supabase.ts         # DB client & types
```

---

This complete workflow shows how the system manages the entire customer journey from initial contact to project completion with full financial and audit tracking.
