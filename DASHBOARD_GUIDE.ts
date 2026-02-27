/**
 * MIM ENTERPRISES CRM - ADMIN DASHBOARD GUIDE
 * 
 * This document explains all dashboard pages and their functionality
 */

// ============================================================================
// 1. MAIN DASHBOARD (/)
// ============================================================================
// Location: /dashboard
// Description: Comprehensive overview of all business metrics
// 
// Shows:
// - Total Leads, New Leads, Converted Leads, Conversion Rate %
// - Total Projects, Active Projects, Completed Projects, On-Track %
// - Total Payments, Total Amount, Paid Amount, Pending Amount
// - Recent 5 Leads with name, status, phone, location, project type, date
// - Recent 5 Payments with amount, type, status, dates, notes
//
// Features:
// - Real-time updates for leads and payments
// - Quick refresh button
// - Color-coded metrics for easy scanning
// - Automatic calculations (conversion rate, totals, etc.)

// ============================================================================
// 2. CONTACTS PAGE (/dashboard/contacts)
// ============================================================================
// Location: /dashboard/contacts
// Role: Admin, Sales
// Description: Manage all customer contact form submissions
//
// Shows:
// - All contact submissions from the public website
// - Live updates when new submissions come in
// - Each submission displays: Name, Phone, Location, Project Type, Message, Date
// - Status badge for each submission
//
// Actions:
// - Change status dropdown for each submission (NEW, CONTACTED, FOLLOW_UP, etc.)
// - Refresh button to reload all contacts
// - Color-coded status indicators
//
// Status Options:
// - NEW: Just received
// - CONTACTED: Sales team has contacted them
// - FOLLOW_UP: Waiting for follow-up
// - SITE_VISIT: Scheduled site visit
// - QUOTATION_SENT: Quote provided
// - NEGOTIATION: In negotiation stage
// - CONVERTED: Became a customer
// - LOST: Deal fell through

// ============================================================================
// 3. SALES DASHBOARD (/dashboard/sales)
// ============================================================================
// Location: /dashboard/sales
// Role: Admin, Sales
// Description: Dedicated dashboard for sales team to manage leads
//
// Statistics Displayed:
// - Total Leads: All leads in the system
// - New Leads: Leads with status "NEW" (uncontacted)
// - Converted: Successfully converted leads
// - Lost: Lost deals
// - Conversion Rate: (Converted / Total) * 100
//
// Features:
// - Search by name, phone, or location
// - Filter by status (All, New, Contacted, Follow Up, etc.)
// - Real-time subscription to lead updates
// - Table view of all leads with columns:
//   * Name
//   * Phone
//   * Location
//   * Project Type
//   * Current Status (with dropdown to change)
//   * View Details button
//
// Detailed Lead View:
// - Opens dialog showing complete lead information
// - Name, phone, location, project type, status, message, source, date

// ============================================================================
// 4. LEADS PAGE (/dashboard/leads)
// ============================================================================
// Location: /dashboard/leads
// Role: Admin, Sales
// Description: Comprehensive lead management page (legacy, similar to Sales)
//
// Shows:
// - All leads with full details
// - Lead status management
// - WhatsApp messaging capability
// - Detailed lead information in expandable sections

// ============================================================================
// 5. OPERATIONS DASHBOARD (/dashboard/operations)
// ============================================================================
// Location: /dashboard/operations
// Role: Admin, Operations
// Description: Monitor project progress and timelines
//
// Statistics Displayed:
// - Total Projects: All projects in the system
// - Active: Projects with status "ACTIVE"
// - Completed: Projects with status "COMPLETED"
// - Delayed: Projects with status "DELAYED"
// - On Hold: Projects with status "ON_HOLD"
//
// Features:
// - Real-time project updates
// - Table view of all projects with columns:
//   * Project ID (shortened UUID)
//   * Area (sqft)
//   * Rate per sqft
//   * Final Amount
//   * Status
//   * Days remaining until completion
//   * View Details button
//
// Detailed Project View:
// - Project status
// - Total area and rate calculations
// - Final amount (with GST)
// - Expected completion date
// - All project updates (progress/delay information)
// - Timeline tracking
//
// Project Status Colors:
// - ACTIVE: Blue - Currently in progress
// - COMPLETED: Green - Successfully finished
// - DELAYED: Red - Behind schedule
// - ON_HOLD: Yellow - Paused/Waiting
// - CANCELLED: Gray - Project cancelled

// ============================================================================
// 6. PROJECTS PAGE (/dashboard/projects)
// ============================================================================
// Location: /dashboard/projects
// Role: Admin, Operations
// Description: Manage active projects and their details
//
// Shows:
// - Active projects linked to leads
// - Project financials (sqft, rate, final amount with GST)
// - Project status tracking
// - Project completion dates

// ============================================================================
// 7. ACCOUNTS DASHBOARD (/dashboard/accounts)
// ============================================================================
// Location: /dashboard/accounts
// Role: Admin, Accounts
// Description: Financial tracking and payment management
//
// Statistics Displayed:
// - Total Payments: Number of payment records
// - Total Amount: Sum of all payment amounts
// - Paid Amount: Sum of payments with status "PAID"
// - Pending Amount: Total - Paid (includes PENDING, DUE, OVERDUE)
// - Overdue Amount: Payments past due date
//
// Features:
// - Real-time payment updates
// - Table view of all payments with columns:
//   * Amount (₹)
//   * Type (ADVANCE, PARTIAL, FINAL)
//   * Status (PENDING, DUE, PAID, OVERDUE)
//   * Payment Date
//   * Next Due Date
//   * Notes/Comments
//   * View Details button
//
// Detailed Payment View:
// - Complete payment information
// - Payment type and status
// - Payment date and next due date
// - Notes/remarks
// - Amount details
//
// Payment Types:
// - ADVANCE: Initial deposit
// - PARTIAL: Mid-project payment
// - FINAL: Final payment upon completion
//
// Payment Statuses:
// - PENDING: Payment initiated, not yet received
// - DUE: Upcoming payment deadline
// - PAID: Successfully received
// - OVERDUE: Payment deadline has passed

// ============================================================================
// 8. PAYMENTS PAGE (/dashboard/payments)
// ============================================================================
// Location: /dashboard/payments
// Role: Admin, Accounts
// Description: Track and manage all project payments
//
// Shows:
// - Payment records linked to projects
// - Payment tracking with dates
// - Status indicators

// ============================================================================
// 9. COMPLETED PROJECTS (/dashboard/completed-projects)
// ============================================================================
// Location: /dashboard/completed-projects
// Role: Admin only
// Description: Portfolio management - upload and showcase completed work
//
// Features:
// - Add new completed project dialog
// - Form fields: Name, Location, Sqft, Description, Image
// - Image preview before upload
// - Image uploads to Supabase Storage (project-images bucket)
// - Display all completed projects in responsive grid
// - Delete projects with confirmation
// - Real-time project list display
//
// Admin Actions:
// - Upload new completed project
// - Add project details and photos
// - Delete completed projects
// - Manage portfolio showcase
//
// Public Display:
// - Completed projects appear on homepage (/dashboard)
// - Shows real database projects (not mock data)
// - Displays: Name, Location, Sqft, Description, Image

// ============================================================================
// 10. EMPLOYEES PAGE (/dashboard/employees)
// ============================================================================
// Location: /dashboard/employees
// Role: Admin only
// Description: Manage team members and user accounts
//
// Features:
// - Create/view/edit employee accounts
// - Manage user roles (admin, sales, operations, accounts)
// - Control access to different dashboard sections

// ============================================================================
// 11. SETTINGS PAGE (/dashboard/settings)
// ============================================================================
// Location: /dashboard/settings
// Role: Admin only
// Description: System configuration and preferences
//
// Features:
// - CRM configuration
// - Company settings
// - Integration settings

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================
//
// ADMIN Role - Full Access:
// - Dashboard, Contacts, Sales Dashboard, Leads
// - Operations, Projects, Completed Projects
// - Accounts, Payments, Employees, Settings
//
// SALES Role - Sales Focus:
// - Dashboard, Contacts, Sales Dashboard, Leads
//
// OPERATIONS Role - Project Focus:
// - Dashboard, Operations, Projects
//
// ACCOUNTS Role - Financial Focus:
// - Dashboard, Accounts, Payments

// ============================================================================
// KEY FEATURES ACROSS ALL PAGES
// ============================================================================
//
// 1. Real-Time Updates:
// - Supabase real-time subscriptions
// - Auto-refresh when data changes
// - Instant notifications
//
// 2. Search & Filter:
// - Most pages support search functionality
// - Status filtering options
// - Date-based sorting
//
// 3. Detailed Views:
// - Click "View" buttons to see full details
// - Modal dialogs with complete information
//
// 4. Status Management:
// - Dropdown selectors for status changes
// - Immediate database updates
// - Color-coded status indicators
//
// 5. Statistics & Metrics:
// - Real-time calculations
// - Conversion rates and percentages
// - Financial summaries
//
// 6. Responsive Design:
// - Works on desktop, tablet, mobile
// - Collapsible sidebar on mobile
// - Optimized grid layouts

// ============================================================================
// DATA RELATIONSHIPS
// ============================================================================
//
// Users (Employees)
//   ↓
// Leads (Contacts from website)
//   ↓
// Projects (Convert leads to projects)
//   ↓
// Payments (Track project payments)
//
// Also:
// Completed Projects (Portfolio showcase)
// Project Updates (Progress tracking)

// ============================================================================
// QUICK START
// ============================================================================
//
// 1. Log in as admin@mim.com / password123
// 2. View Dashboard for overview of all metrics
// 3. Check Contacts for new form submissions
// 4. Use Sales Dashboard to manage leads
// 5. Use Operations to track project progress
// 6. Use Accounts to manage payments
// 7. Add completed projects to showcase on website

export {};
