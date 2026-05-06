# MIM CRM - Complete Workflow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Login & Authentication](#user-login--authentication)
3. [Lead Management](#lead-management)
4. [Project Management](#project-management)
5. [Payment Management](#payment-management)
6. [Contact & Customer Portal](#contact--customer-portal)
7. [Employee Management](#employee-management)
8. [Completed Projects Showcase](#completed-projects-showcase)
9. [Admin Dashboard](#admin-dashboard)
10. [Sales Dashboard](#sales-dashboard)
11. [Operations Dashboard](#operations-dashboard)
12. [Accounts Dashboard](#accounts-dashboard)

---

## System Overview

MIM CRM is a comprehensive Customer Relationship Management system designed for managing leads, projects, payments, and customer interactions. The system follows a complete workflow from lead acquisition to project completion and customer follow-up.

### Key Features:
- Lead tracking and management
- Project planning and execution
- Payment tracking and management
- WhatsApp integration for customer communication
- Real-time employee attendance tracking
- Customer portal for project status viewing
- Comprehensive admin and departmental dashboards
- Audit logging for all activities

---

## User Login & Authentication

### Accessing the System

**URL**: `http://localhost:5173/login` (Development) or your production domain

### Login Credentials

```
Admin Account:
Email: admin@mim.com
Password: password123

Sales Account:
Email: sales@mim.com
Password: password123

Operations Account:
Email: operations@mim.com
Password: password123

Accounts Account:
Email: accounts@mim.com
Password: password123
```

### Login Process

1. **Navigate to Login Page**
   - Enter email address
   - Enter password
   - Click "Sign In" button

2. **Authentication Flow**
   - System validates credentials against users table
   - If valid, JWT token is generated
   - User is redirected to Dashboard
   - Auth context stores user role for access control

3. **Session Management**
   - Session persists until logout
   - Token stored in browser storage
   - Automatic logout on token expiration

### User Roles & Permissions

| Role | Access | Permissions |
|------|--------|-------------|
| **Admin** | All pages | Full system access, all operations |
| **Sales** | Sales, Leads | Create leads, manage leads, view projects |
| **Operations** | Operations, Projects | Manage projects, track progress |
| **Accounts** | Accounts, Payments | Manage payments, invoicing |

---

## Lead Management

### Lead Lifecycle Flow

```
NEW → CONTACTED → FOLLOW_UP → SITE_VISIT → QUOTATION_SENT → NEGOTIATION → CONVERTED
                                                                              ↓
                                                                         PROJECT CREATED
```

### Creating a Lead

#### Via Contact Form (Public Page)

1. **Access Contact Page**
   - Navigate to `/contact` on public site
   - Fill in the form:
     - Name (required)
     - Phone (required)
     - Location
     - Project Type
     - Message

2. **Submit Lead**
   - Click "Submit Lead"
   - Form validates data
   - Lead is created in database with NEW status
   - Confirmation message shown

#### Via Leads Dashboard

1. **Navigate to Leads Page**
   - Login to dashboard
   - Click "Leads" in sidebar
   - Click "Add Lead" button

2. **Fill Lead Form**
   - **Name**: Customer full name
   - **Phone**: Contact number (unique)
   - **Location**: Project location
   - **Project Type**: Type of project (e.g., Windows, Doors)
   - **Source**: How they contacted (Website, Phone, Referral, Social Media)
   - **Message**: Initial inquiry details

3. **Save Lead**
   - Click "Add Lead"
   - Lead appears in list with NEW status
   - Can now be contacted and managed

### Managing Leads

#### View Lead Details

1. **From Leads List**
   - Click eye icon or lead name
   - Opens detailed view showing:
     - Lead information
     - Contact history
     - Project status (if converted)
     - Payment details (if project exists)

#### Update Lead Status

1. **Change Status**
   - Click status badge or dropdown
   - Select new status from list
   - Available transitions:
     - NEW → CONTACTED
     - CONTACTED → FOLLOW_UP
     - FOLLOW_UP → SITE_VISIT
     - SITE_VISIT → QUOTATION_SENT
     - QUOTATION_SENT → NEGOTIATION
     - NEGOTIATION → CONVERTED
     - Any → LOST

2. **Status Meanings**
   - **NEW**: Lead just created, not contacted
   - **CONTACTED**: Initial contact made
   - **FOLLOW_UP**: Second contact, waiting for response
   - **SITE_VISIT**: Site visit scheduled/completed
   - **QUOTATION_SENT**: Quote provided to customer
   - **NEGOTIATION**: In price negotiation phase
   - **CONVERTED**: Deal closed, project ready to create
   - **LOST**: Lead rejected or no longer interested

#### Send WhatsApp Message

1. **Open WhatsApp Dialog**
   - Click message icon on lead
   - Two options:
     a. **Prefilled Template**: Select message type (greeting, quotation, etc.)
     b. **Custom Message**: Write custom message

2. **Send Message**
   - WhatsApp API validates phone number
   - Message sent via WhatsApp Business API
   - Log entry created in audit trail
   - Confirmation shown to user

#### Search and Filter

1. **Search Leads**
   - Use search box to filter by:
     - Name
     - Phone number
     - Location

2. **Filter by Status**
   - Select status from dropdown
   - View only leads with that status
   - Helps prioritize follow-ups

### Lead Statistics

**Leads Dashboard Shows:**
- Total Leads count
- New Leads (not yet contacted)
- Converted Leads count
- Conversion Rate %

---

## Project Management

### Creating a Project from Converted Lead

#### Prerequisites
- Lead status must be CONVERTED
- Lead must have phone number and details

#### Process

1. **Navigate to Projects Page**
   - Click "Projects" in dashboard sidebar
   - Click "Add Project" button

2. **Select Lead**
   - Choose converted lead from dropdown
   - Only CONVERTED leads are available
   - System validates lead exists

3. **Enter Project Details**
   - **Total SqFt**: Total square feet of project
   - **Rate per SqFt**: Cost per square foot
   - **Expected Completion Date**: When project should finish
   - **GST Enabled**: Toggle if GST applies
   - **Profit Percentage**: Expected profit margin (optional)

4. **Calculate Amount**
   - System auto-calculates: `Total SqFt × Rate per SqFt = Final Amount`
   - Displays with GST if enabled
   - Shows profit calculation

5. **Save Project**
   - Click "Create Project"
   - Project created with ACTIVE status
   - Lead status updated to CONVERTED
   - Notification sent to operations team

### Managing Projects

#### View Project Details

1. **Click Project**
   - See all project information
   - View associated lead details
   - Check project timeline
   - View payment status

#### Update Project Status

**Project Statuses:**
- **ACTIVE**: Ongoing project
- **DELAYED**: Behind schedule
- **COMPLETED**: Finished successfully
- **ON_HOLD**: Temporarily paused
- **CANCELLED**: Cancelled project

**Update Process:**
1. Click status dropdown
2. Select new status
3. If delayed, add reason and new expected date
4. Save changes
5. Audit log entry created

#### Add Project Updates

1. **Click "Add Update"**
   - Type: PROGRESS or DELAY
   - Description of work done/issue
   - If delay: old date, new date, reason
   - Upload photos (optional)

2. **Update visible to:**
   - Admin dashboard
   - Project details page
   - Customer via My Works portal

#### Project Timeline

**Typical Project Workflow:**
```
Day 1: Project Created (ACTIVE)
  ↓
Day 5: First progress update
  ↓
Day 15: Delay occurs, status → DELAYED, new date set
  ↓
Day 25: Back on track, status → ACTIVE
  ↓
Day 30: Project completion, status → COMPLETED
  ↓
Admin creates "Completed Project" entry for portfolio
```

### Project Statistics

**Projects Dashboard Shows:**
- Total projects
- Active projects
- Completed projects
- Projects by status

---

## Payment Management

### Payment Types and Flow

#### 1. Advance Payment
- Paid when project starts
- Typically 20-30% of total
- Must be marked before project begins
- Shows as paid in customer portal progress bar

#### 2. Partial Payment
- Intermediate payments during project
- Can be multiple payments
- Tied to project milestones
- Shows progress toward completion

#### 3. Final Payment
- Paid upon project completion
- Remaining balance
- Marks project as fully paid

### Creating Payment Records

#### Via Payments Page

1. **Navigate to Payments**
   - Click "Payments" in sidebar
   - Click "Add Payment" button

2. **Select Project**
   - Choose project from dropdown
   - System shows:
     - Lead name
     - Total project amount
     - Already paid amount
     - Remaining balance

3. **Enter Payment Details**
   - **Type**: ADVANCE, PARTIAL, or FINAL
   - **Amount**: Payment amount in rupees
   - **Payment Date**: When payment was received
   - **Status**: PENDING, DUE, PAID, or OVERDUE
   - **Notes**: Payment reference, method, etc.

4. **Save Payment**
   - Click "Record Payment"
   - Payment saved to database
   - Audit log entry created
   - Customer portal updated

### Payment Tracking

#### View All Payments

1. **Payments Dashboard**
   - Shows all payments by:
     - Project name
     - Payment type
     - Amount
     - Status
     - Date

2. **Filter Options**
   - By status (PAID, PENDING, etc.)
   - By payment type
   - By date range
   - By project

#### Payment Status Tracking

**Status Colors:**
- 🟢 **PAID** (Green): Payment received
- 🟡 **PENDING** (Yellow): Waiting for payment
- 🟠 **DUE** (Orange): Payment due date approaching
- 🔴 **OVERDUE** (Red): Payment past due date

#### Payment Statistics

**Accounts Dashboard Shows:**
- Total payment amount
- Amount received
- Amount pending
- Overdue amount
- Payment collection rate %

---

## Contact & Customer Portal (My Works)

### Customer Access (Without Login)

#### My Works Portal

**URL**: `http://localhost:5173/my-works`

1. **Enter Phone Number**
   - Customer enters their phone number
   - System searches leads table
   - Must have CONVERTED status

2. **View Project Details**
   - Project information:
     - Total square feet
     - Rate per square foot
     - Total project amount
     - Expected completion date
   - All amounts shown in full rupee format (e.g., ₹15,00,000)

3. **Track Payments**
   - **Paid & Advance**: Shows all paid amounts
   - **Remaining**: Shows pending amount
   - **Progress Bar**: Visual representation of payment progress
   - **Payment History**: List of all payments with:
     - Date
     - Type (Advance/Partial/Final)
     - Amount
     - Status

#### Customer Contact Page

**URL**: `http://localhost:5173/contact`

**Available Sections:**
1. **Contact Form**
   - Name, phone, location, project type
   - Submits new lead to system

2. **Company Information**
   - Phone number
   - Email address
   - Physical address

3. **Quick Response Link**
   - Click to open WhatsApp chat
   - Predefined greeting message

### Customer Email Notifications

**Automatic Notifications Sent For:**
- New project created
- Payment due date approaching (3 days before)
- Payment received (with receipt)
- Project status change
- Delay notification with new timeline

---

## Employee Management

### Employee Database

#### Adding Employees

1. **Navigate to Employees Page**
   - Click "Employees" in sidebar
   - Click "Add Employee" button

2. **Fill Employee Form**
   - **Full Name** (Required): Employee full name
   - **Phone Number** (Required): Contact number
   - **Role** (Optional): Admin, Sales, Operations, or Accounts
   - Email auto-generated based on name (firstname.lastname@company.com)

3. **Save Employee**
   - Click "Add Employee"
   - Employee added to database
   - Status set to ACTIVE by default

#### Managing Employees

1. **View All Employees**
   - Table shows:
     - Name
     - Email (hidden on mobile)
     - Role
     - Phone (hidden on tablet)
     - Status

2. **Edit Employee**
   - Click edit icon
   - Update name, phone, or role
   - Auto-generated email updates
   - Save changes

3. **Delete Employee**
   - Click delete icon
   - Confirm deletion
   - Employee removed from system
   - Attendance records preserved

### Attendance Management

#### Marking Attendance

1. **Navigate to Attendance Tab**
   - Click "Employees" → "Attendance" tab
   - See daily attendance statistics

2. **View Attendance Stats**
   - **Present Today**: Count of employees marked present
   - **Absent Today**: Count of absent employees
   - **On Leave**: Count on leave

3. **Mark Attendance**
   - Click "Mark Attendance" card
   - Select **Date**: Choose date
   - Select **Employee**: Choose from dropdown
   - Select **Status**:
     - **Present**: Attended work
     - **Absent**: Did not attend
     - **Leave**: On approved leave
   - Add **Notes** (optional): Reason for absence
   - Click "Mark Attendance"

#### Attendance Records

1. **View All Records**
   - Table shows:
     - Employee name
     - Date
     - Status (color-coded)
     - Notes (if any)

2. **Filter Attendance**
   - View records by date
   - Search by employee

3. **Delete Records**
   - Click delete icon to remove record
   - Use if record was entered in error

#### Attendance Data

**Real-time Database Integration:**
- All data stored in Supabase
- Syncs across all admin sessions
- Historical records preserved
- Can generate attendance reports

---

## Completed Projects Showcase

### Admin Portfolio Management

#### Adding Completed Project

1. **Navigate to Completed Projects**
   - Click "Completed Projects" in sidebar
   - Click "Add Project" button

2. **Enter Project Details**
   - **Project Name**: Display name
   - **Location**: Project location
   - **SqFt**: Total square footage
   - **Description**: Brief project description
   - **Image**: Upload project photo/before-after

3. **Publish**
   - Click "Add Project"
   - Project saved
   - Appears on landing page (max 4 displayed)

#### Managing Portfolio

1. **View All Projects**
   - See all completed projects in table
   - Edit project details
   - Delete projects
   - Change display order

2. **Landing Page Display**
   - "Why Choose Us" section shows 4 latest projects
   - 2 per row on mobile
   - 4 per row on desktop
   - Click project to see details

---

## Admin Dashboard

### Dashboard Home

**Main Dashboard URL**: `http://localhost:5173/dashboard`

#### Key Statistics

**Leads Section:**
- Total Leads (all-time)
- New Leads (not contacted)
- Converted Leads
- Conversion Rate %

**Projects Section:**
- Total Projects
- Active Projects
- Completed Projects

**Payments Section:**
- Total Payments Made
- Total Project Value
- Amount Received
- Pending Amount

#### Recent Activity

- Latest leads created
- Recent project updates
- Recent payments received
- Latest messages sent

### Dashboard Sub-Pages

#### Leads Page
**Path**: `/dashboard/leads`

Features:
- Search and filter leads
- View lead details and contact history
- Update lead status
- Send WhatsApp messages
- View project linked to lead (if any)
- Export lead data

#### Projects Page
**Path**: `/dashboard/projects`

Features:
- View all projects with:
  - Client name
  - Project size (SqFt)
  - Rate per SqFt
  - Total amount
  - Completion date
  - Status
- Add new projects
- Edit project details
- Update project status
- Add progress updates with photos
- View payment status
- Update completion date

#### Payments Page
**Path**: `/dashboard/payments`

Features:
- View all payments organized by project
- Filter by status (Paid, Pending, Overdue)
- Add new payments
- Edit payment records
- View payment history
- Download payment receipts
- Export to PDF/Excel

#### Contacts Page
**Path**: `/dashboard/contacts`

Features:
- View all new inquiries from contact form
- Filter contacts by status
- Send responses
- Create leads from contacts
- Archive contacted inquiries

#### Completed Projects Page
**Path**: `/dashboard/completed-projects`

Features:
- Manage portfolio projects
- Upload before/after photos
- Edit project descriptions
- Publish/unpublish from site
- View analytics (views, clicks)
- Reorder display sequence

#### Sales Page
**Path**: `/dashboard/sales`

Features:
- Sales analytics and metrics
- Lead source tracking
- Conversion funnel
- Top performing months
- Sales by team member
- Revenue projections

#### Operations Page
**Path**: `/dashboard/operations`

Features:
- Project timeline dashboard
- Ongoing projects status
- Delay tracking
- Completion rate
- Resource allocation
- Schedule management

#### Accounts Page
**Path**: `/dashboard/accounts`

Features:
- Payment collections dashboard
- Outstanding invoices
- Payment collection rate
- Revenue by month
- Invoice management
- Payment reminders

#### Employees Page
**Path**: `/dashboard/employees`

Features:
- Employee directory
- Add/edit/delete employees
- Employee roles and permissions
- Attendance tracking
- Attendance reports
- Leave management

#### Settings Page
**Path**: `/dashboard/settings`

Features:
- Company information
- Email settings
- WhatsApp integration settings
- SMS notifications
- System preferences
- Backup and restore

---

## Sales Dashboard

### Purpose

Dedicated view for sales team to track:
- Lead generation
- Lead progression through pipeline
- Conversion metrics
- Team performance

### Key Metrics

- **Total Leads This Month**
- **New Leads This Week**
- **Leads by Source** (Website, Phone, Referral, Social)
- **Top Sources**
- **Conversion Rate**

### Features

1. **Lead Pipeline View**
   - Kanban-style board showing leads by status
   - Drag-drop leads between statuses
   - Quick status update

2. **Leads to Contact**
   - Shows NEW leads needing contact
   - Quick action buttons for:
     - Send WhatsApp
     - Schedule follow-up
     - Create project

3. **Near-Conversion Leads**
   - Shows leads in NEGOTIATION status
   - Close-out rate tracking
   - Deal value at risk

4. **Performance Reports**
   - Sales by rep
   - Conversion rate trends
   - Revenue generated

---

## Operations Dashboard

### Purpose

Track project execution and timelines:
- Project progress
- Delay management
- Schedule adherence
- Team performance

### Key Metrics

- **Active Projects**: Current ongoing projects
- **On Schedule**: Projects meeting deadlines
- **Delayed**: Projects behind schedule
- **Completed**: Finished projects this month
- **Completion Rate**: % projects on time

### Features

1. **Project Timeline**
   - Gantt chart view of all projects
   - Critical path highlighting
   - Milestone tracking

2. **Delay Management**
   - List of all delayed projects
   - Reason for delay
   - New expected completion date
   - Actions to recover

3. **Resource Management**
   - Assign team members to projects
   - Workload distribution
   - Skill-based allocation

4. **Quality Tracking**
   - Inspection checklists
   - Photo documentation
   - Client satisfaction scores

---

## Accounts Dashboard

### Purpose

Manage financial aspects:
- Payment collection
- Outstanding amounts
- Invoice generation
- Financial reporting

### Key Metrics

- **Total Project Value**: Sum of all project amounts
- **Amount Collected**: Paid payments
- **Outstanding**: Pending + Overdue amounts
- **Collection Rate**: % of total collected
- **Overdue Amount**: Amount past due

### Features

1. **Payment Collection**
   - Record incoming payments
   - Mark as received/pending
   - Auto-generate receipts
   - Send payment reminders

2. **Invoice Management**
   - Generate invoices by project
   - Milestone-based invoicing
   - Payment terms
   - Auto-email to customers

3. **Financial Reports**
   - Monthly revenue
   - Collection trends
   - Outstanding aging report
   - Profit by project

4. **Payment Reminders**
   - Auto-send reminders before due date
   - Escalation for overdue
   - Payment tracking

---

## Data Flow Diagram

```
LEAD CREATION
    ↓
CONTACT FORM (Public Site)
    ↓
LEAD STORED IN DATABASE
    ↓
SALES TEAM CONTACTS
    ↓
UPDATE LEAD STATUS
    ↓
QUOTATION PROVIDED
    ↓
NEGOTIATION
    ↓
CONVERTED → LEAD CONVERTED
    ↓
CREATE PROJECT
    ↓
ASSIGN TO OPERATIONS
    ↓
PROJECT EXECUTION
    ↓
TRACK PROGRESS
    ↓
ADD UPDATES & PHOTOS
    ↓
PROJECT COMPLETED
    ↓
MARK IN COMPLETED_PROJECTS TABLE
    ↓
SHOW IN PORTFOLIO
    ↓
ACCOUNT PAYMENTS
    ↓
TRACK & COLLECT
    ↓
SEND INVOICES
    ↓
RECEIVE PAYMENTS
    ↓
MARK COMPLETE
```

---

## Database Tables Reference

### Core Tables

1. **users** - Admin and staff accounts
2. **leads** - Customer inquiries and pipeline
3. **projects** - Active projects with details
4. **payments** - Payment records
5. **project_updates** - Progress tracking
6. **whatsapp_logs** - Message history
7. **completed_projects** - Portfolio showcase
8. **employees** - Staff directory
9. **attendance** - Daily attendance records
10. **audit_logs** - Activity tracking

### Relationships

```
users
  ├── leads (assigned_to)
  ├── projects (created_by via leads)
  ├── payments (created_by)
  └── audit_logs (user_id)

leads
  ├── projects (lead_id)
  ├── payments (via projects)
  └── whatsapp_logs (lead_id)

projects
  ├── payments (project_id)
  ├── project_updates (project_id)
  └── audit_logs (entity_id)

employees
  └── attendance (employee_id)
```

---

## Best Practices

### Lead Management
- ✅ Update lead status promptly
- ✅ Log all customer interactions
- ✅ Follow up within 24 hours
- ✅ Send quotation within 48 hours
- ✅ Close lost leads to keep data clean

### Project Management
- ✅ Create project immediately after conversion
- ✅ Update progress weekly
- ✅ Report delays immediately
- ✅ Add completion photos
- ✅ Get customer sign-off before marking complete

### Payment Management
- ✅ Record payments same day received
- ✅ Send receipt immediately
- ✅ Send reminder 3 days before due
- ✅ Follow up on overdue payments
- ✅ Mark complete when fully paid

### Customer Communication
- ✅ Respond to inquiries within 4 hours
- ✅ Use WhatsApp for quick updates
- ✅ Send progress photos weekly
- ✅ Notify of any delays immediately
- ✅ Send completion certificate

---

## Troubleshooting

### Issue: Lead not showing in Projects
**Solution**: Ensure lead status is CONVERTED before creating project

### Issue: Attendance not saving
**Solution**: Check if attendance table exists in Supabase, run migrations if needed

### Issue: WhatsApp message not sending
**Solution**: Verify WhatsApp API credentials, check phone number format (+91...)

### Issue: Payment not showing for customer
**Solution**: Ensure payment status is PAID and date is correct

### Issue: 404 error on page reload
**Solution**: Try Vercel routing is configured, clear browser cache

---

## Contact & Support

For issues or questions:
- Email: mimenterprise125@gmail.com
- GitHub: mimenterprise125-cloud/mim-crm

---

**Last Updated**: May 2026
**Version**: 1.0
**Status**: Production Ready
