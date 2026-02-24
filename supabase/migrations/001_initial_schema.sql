-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'operations', 'accounts');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'SITE_VISIT', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED', 'LOST');
CREATE TYPE lead_source AS ENUM ('WEBSITE', 'PHONE', 'REFERRAL', 'SOCIAL_MEDIA');
CREATE TYPE conversation_status AS ENUM ('BUSINESS_INITIATED', 'OPEN', 'CLOSED');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'DELAYED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');
CREATE TYPE whatsapp_direction AS ENUM ('INCOMING', 'OUTGOING');
CREATE TYPE whatsapp_message_type AS ENUM ('TEXT', 'TEMPLATE', 'MEDIA');
CREATE TYPE payment_type AS ENUM ('ADVANCE', 'PARTIAL', 'FINAL');
CREATE TYPE payment_status AS ENUM ('PENDING', 'DUE', 'PAID', 'OVERDUE');
CREATE TYPE audit_action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'SEND_MESSAGE');
CREATE TYPE audit_entity_type AS ENUM ('LEAD', 'PROJECT', 'PAYMENT', 'EMPLOYEE', 'WHATSAPP_MESSAGE');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  message TEXT,
  status lead_status DEFAULT 'NEW',
  source lead_source DEFAULT 'WEBSITE',
  assigned_to UUID REFERENCES users(id),
  conversation_status conversation_status DEFAULT 'BUSINESS_INITIATED',
  open_window_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id),
  total_sqft DECIMAL(10, 2) NOT NULL,
  rate_per_sqft DECIMAL(10, 2) NOT NULL,
  gst_enabled BOOLEAN DEFAULT true,
  final_amount DECIMAL(12, 2) NOT NULL,
  profit_percentage DECIMAL(5, 2),
  expected_completion_date DATE NOT NULL,
  status project_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project updates table
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  type VARCHAR(50) NOT NULL, -- 'PROGRESS' or 'DELAY'
  description TEXT,
  old_expected_date DATE,
  new_expected_date DATE,
  delay_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  image_urls TEXT[], -- Array of image URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  amount DECIMAL(12, 2) NOT NULL,
  type payment_type NOT NULL,
  payment_date DATE NOT NULL,
  status payment_status DEFAULT 'PENDING',
  next_payment_due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp logs table
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  direction whatsapp_direction NOT NULL,
  type whatsapp_message_type NOT NULL,
  body TEXT NOT NULL,
  template_name VARCHAR(100),
  media_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action_type audit_action_type NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Templates table (for reference)
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  body TEXT NOT NULL,
  variables VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Completed Projects table (for portfolio/showcase)
CREATE TABLE completed_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  sqft VARCHAR(50) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_projects_lead_id ON projects(lead_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(next_payment_due_date);
CREATE INDEX idx_whatsapp_logs_lead_id ON whatsapp_logs(lead_id);
CREATE INDEX idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_completed_projects_created_at ON completed_projects(created_at DESC);

-- Insert test user credentials
-- Password: password123 (base64 encoded: cGFzc3dvcmQxMjM=)
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('admin@mim.com', 'cGFzc3dvcmQxMjM=', 'Admin User', 'admin', true),
('sales@mim.com', 'cGFzc3dvcmQxMjM=', 'Sales Representative', 'sales', true),
('operations@mim.com', 'cGFzc3dvcmQxMjM=', 'Operations Manager', 'operations', true),
('accounts@mim.com', 'cGFzc3dvcmQxMjM=', 'Accounts Lead', 'accounts', true);

-- Set up RLS (Row Level Security)
-- DISABLED FOR NOW - will re-enable after initial setup
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (commented out due to auth.uid() not working without Supabase Auth)
-- Will be implemented after setting up proper Supabase Auth
