# Database Setup & Troubleshooting Guide

## Database Schema Overview

This guide helps you understand and troubleshoot the Supabase database setup.

## Tables & Purpose

### 1. Users Table
**Purpose**: Store employee accounts with role-based access

```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  password_hash: VARCHAR,
  full_name: VARCHAR,
  role: 'admin'|'sales'|'operations'|'accounts',
  phone: VARCHAR,
  is_active: BOOLEAN,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

**Sample Data**:
```sql
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@mim.com', 'cGFzc3dvcmQxMjM=', 'Admin User', 'admin'),
('sales@mim.com', 'cGFzc3dvcmQxMjM=', 'Sales Rep', 'sales'),
('operations@mim.com', 'cGFzc3dvcmQxMjM=', 'Ops Manager', 'operations'),
('accounts@mim.com', 'cGFzc3dvcmQxMjM=', 'Accounts Lead', 'accounts');
```

### 2. Leads Table
**Purpose**: Track all customer inquiries from website

```sql
leads (
  id: UUID PRIMARY KEY,
  name: VARCHAR,
  phone: VARCHAR UNIQUE,
  location: VARCHAR,
  project_type: VARCHAR,
  message: TEXT,
  status: 'NEW'|'CONTACTED'|...|'LOST',
  source: 'WEBSITE'|'PHONE'|'REFERRAL'|'SOCIAL_MEDIA',
  assigned_to: UUID (FK users),
  conversation_status: 'BUSINESS_INITIATED'|'OPEN'|'CLOSED',
  open_window_expiry: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

**Key Constraints**:
- `phone` must be UNIQUE
- `status` controls workflow
- `conversation_status` manages 24h WhatsApp window
- `open_window_expiry` tracks when free text messaging ends

### 3. Projects Table
**Purpose**: Track converted leads with financial data

```sql
projects (
  id: UUID PRIMARY KEY,
  lead_id: UUID UNIQUE (FK leads),
  total_sqft: DECIMAL,
  rate_per_sqft: DECIMAL,
  gst_enabled: BOOLEAN,
  final_amount: DECIMAL,
  profit_percentage: DECIMAL,
  expected_completion_date: DATE,
  status: 'ACTIVE'|'DELAYED'|'COMPLETED'|'ON_HOLD'|'CANCELLED',
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

**Key Points**:
- `lead_id` is UNIQUE (1 lead → 1 project)
- All financial fields are MANUAL (no auto-calculation)
- Only CONVERTED leads can have projects
- `status` updated when delays occur

### 4. Project Updates Table
**Purpose**: Track progress and delays with photos

```sql
project_updates (
  id: UUID PRIMARY KEY,
  project_id: UUID (FK projects),
  type: 'PROGRESS'|'DELAY',
  description: TEXT,
  old_expected_date: DATE,
  new_expected_date: DATE,
  delay_reason: TEXT,
  created_by: UUID (FK users),
  image_urls: TEXT[] (PostgreSQL array),
  created_at: TIMESTAMP
)
```

**Usage**:
- PROGRESS updates: `description` + optional images
- DELAY updates: `delay_reason` + old/new dates
- Track who made the update (`created_by`)

### 5. Payments Table
**Purpose**: Track all financial transactions

```sql
payments (
  id: UUID PRIMARY KEY,
  project_id: UUID (FK projects),
  amount: DECIMAL,
  type: 'ADVANCE'|'PARTIAL'|'FINAL',
  payment_date: DATE,
  status: 'PENDING'|'DUE'|'PAID'|'OVERDUE',
  next_payment_due_date: DATE,
  notes: TEXT,
  created_by: UUID (FK users),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

**Key Points**:
- `payment_date`: When payment was made
- `next_payment_due_date`: Next expected payment
- `status` updated by accounts team
- `amount` is manual entry

### 6. WhatsApp Logs Table
**Purpose**: Store complete message history

```sql
whatsapp_logs (
  id: UUID PRIMARY KEY,
  lead_id: UUID (FK leads),
  direction: 'INCOMING'|'OUTGOING',
  type: 'TEXT'|'TEMPLATE'|'MEDIA',
  body: TEXT,
  template_name: VARCHAR,
  media_url: VARCHAR,
  created_at: TIMESTAMP
)
```

**Usage**:
- Log every message (incoming and outgoing)
- Reference `template_name` for templates
- `media_url` for images/media
- Enables conversation history replay

### 7. Audit Logs Table
**Purpose**: Compliance and change tracking

```sql
audit_logs (
  id: UUID PRIMARY KEY,
  user_id: UUID (FK users),
  action_type: 'CREATE'|'UPDATE'|'DELETE'|'STATUS_CHANGE'|'SEND_MESSAGE',
  entity_type: 'LEAD'|'PROJECT'|'PAYMENT'|'EMPLOYEE'|'WHATSAPP_MESSAGE',
  entity_id: UUID,
  old_value: JSONB,
  new_value: JSONB,
  timestamp: TIMESTAMP
)
```

**Examples**:
```sql
-- Lead status change
{
  action_type: 'STATUS_CHANGE',
  entity_type: 'LEAD',
  old_value: { status: 'NEW' },
  new_value: { status: 'CONTACTED' }
}

-- Payment added
{
  action_type: 'CREATE',
  entity_type: 'PAYMENT',
  new_value: { amount: 500000, type: 'ADVANCE' }
}
```

## Row Level Security (RLS) Policies

RLS is ENABLED on all tables. Key policies:

### Users Table
- Users can view own profile
- Admins can view all users

### Leads Table
- Admins see all leads
- Sales users see only assigned leads

### Projects Table
- Admins see all
- Operations see only CONVERTED projects
- Accounts see all
- Sales see their assigned leads' projects

### Payments Table
- Only Accounts users can view
- Admins can override

## Fixing Common Issues

### Issue: "Supabase connection failing"

**Check**:
1. Verify `.env.local` has correct credentials
2. Check project is active in Supabase dashboard
3. Verify anon key is not revoked

**Test**:
```typescript
import { supabase } from "@/lib/supabase";

supabase.from('users').select('count', { count: 'exact' }).then(console.log);
```

### Issue: "RLS policy denies access"

**Check**:
1. User must be logged in
2. User must have proper role
3. RLS policies must allow access

**Fix**:
```sql
-- Check RLS is enabled
SELECT tablename, pg_catalog.obj_description(c.oid, 'pg_class')
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public';

-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'leads';
```

### Issue: "Duplicate phone number error"

**Cause**: Phone number already exists in leads table

**Check**:
```sql
SELECT * FROM leads WHERE phone = '+919876543210';
```

**Fix**: Use different phone or update existing lead

### Issue: "Foreign key violation"

**Cause**: Trying to reference non-existent user/lead/project

**Check**:
```sql
-- Verify user exists
SELECT * FROM users WHERE id = 'uuid-here';

-- Verify lead exists
SELECT * FROM leads WHERE id = 'uuid-here';
```

### Issue: "Can't convert lead to project"

**Requirements**:
- Lead status must be 'CONVERTED'
- Lead can't already have a project

**Check**:
```sql
SELECT l.id, l.name, l.status, p.id as project_id
FROM leads l
LEFT JOIN projects p ON p.lead_id = l.id
WHERE l.id = 'lead-uuid';
```

## Useful Queries

### Get all leads with projects
```sql
SELECT l.id, l.name, l.phone, l.status, 
       p.id as project_id, p.final_amount, p.status as project_status
FROM leads l
LEFT JOIN projects p ON p.lead_id = l.id
ORDER BY l.created_at DESC;
```

### Get revenue this month
```sql
SELECT SUM(amount) as total_revenue
FROM payments
WHERE status = 'PAID'
AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
AND payment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
```

### Get delayed projects
```sql
SELECT p.id, l.name, p.expected_completion_date, 
       (SELECT json_agg(json_build_object('type', type, 'reason', delay_reason, 'new_date', new_expected_date))
        FROM project_updates WHERE project_id = p.id AND type = 'DELAY') as delays
FROM projects p
JOIN leads l ON l.id = p.lead_id
WHERE p.status = 'DELAYED';
```

### Get audit history for entity
```sql
SELECT user_id, action_type, old_value, new_value, timestamp
FROM audit_logs
WHERE entity_type = 'LEAD' AND entity_id = 'lead-uuid'
ORDER BY timestamp DESC;
```

### Get WhatsApp conversation
```sql
SELECT created_at, direction, type, body, template_name
FROM whatsapp_logs
WHERE lead_id = 'lead-uuid'
ORDER BY created_at ASC;
```

### Get payment schedule
```sql
SELECT p.id, l.name, p.amount, p.payment_date, p.next_payment_due_date, p.status
FROM payments p
JOIN projects pr ON pr.id = p.project_id
JOIN leads l ON l.id = pr.lead_id
WHERE p.status != 'PAID'
ORDER BY p.next_payment_due_date ASC;
```

## Performance Tuning

### Current Indexes
All indexes are already created:
- `idx_leads_status` - Fast status filtering
- `idx_leads_created_at` - Recent leads query
- `idx_payments_status` - Payment filtering
- `idx_whatsapp_logs_created_at` - Message history
- `idx_audit_logs_user_id` - User activity tracking

### Query Optimization Tips
1. Always filter by status first
2. Use LIMIT for paginated results
3. Join only needed tables
4. Use indexes on WHERE clauses

## Data Migration

### Adding Test Data
```sql
-- Add test lead
INSERT INTO leads (name, phone, location, project_type, source, status)
VALUES ('Test Client', '+919876543210', 'Hyderabad', 'residential', 'WEBSITE', 'NEW');

-- Get the inserted lead ID
SELECT id FROM leads ORDER BY created_at DESC LIMIT 1;

-- Add project for converted lead
INSERT INTO projects (lead_id, total_sqft, rate_per_sqft, gst_enabled, final_amount, expected_completion_date)
VALUES ('lead-uuid', 5000, 1500, true, 7500000, '2026-06-30');

-- Add payment
INSERT INTO payments (project_id, amount, type, payment_date, status, created_by)
VALUES ('project-uuid', 2500000, 'ADVANCE', '2026-02-24', 'PAID', 'user-uuid');
```

### Backup & Restore
```bash
# Backup via Supabase CLI
supabase db pull

# Restore from backup
supabase db reset
supabase db push < backup.sql
```

## Monitoring

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Check Slow Queries
```sql
-- Enable slow query log in Supabase settings
-- Then query postgres logs
SELECT * FROM postgres_logs WHERE duration_ms > 1000;
```

## Troubleshooting Checklist

- [ ] Supabase project is active
- [ ] .env.local has correct credentials
- [ ] Database migrations ran successfully
- [ ] Tables appear in Supabase dashboard
- [ ] RLS policies are enabled
- [ ] Test user can login
- [ ] Test lead can be created
- [ ] WhatsApp logs are recorded
- [ ] Audit logs track changes
- [ ] Performance is acceptable

## Getting Help

1. Check Supabase logs in dashboard
2. Review browser console errors
3. Check network tab in DevTools
4. Run EXPLAIN on slow queries
5. Review RLS policies

Contact Supabase support if:
- Database is inaccessible
- Performance degrades
- RLS policies malfunction
- Storage issues occur
