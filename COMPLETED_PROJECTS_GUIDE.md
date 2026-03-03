# Completed Projects - Landing Page Configuration

## Overview
There are **TWO SEPARATE SYSTEMS** for handling completed/finished work:

### 1. **Projects Table** (`projects`)
- **Purpose**: Track active business projects being worked on
- **Statuses**: ACTIVE, DELAYED, COMPLETED, ON_HOLD, CANCELLED
- **Visibility**: Dashboard only (Operations, Projects, DashboardHome pages)
- **When marked COMPLETED**: Only visible to internal team in dashboard
- **Landing Page**: ❌ **NOT shown** on landing page, even if status = COMPLETED

### 2. **Completed Projects Table** (`completed_projects`)
- **Purpose**: Portfolio/showcase items for public display
- **Admin-Only**: Only admins can add projects here
- **Visibility**: Landing page + Dashboard
- **Landing Page**: ✅ **ONLY these projects show** on landing page
- **Access**: Dashboard → Completed Projects (admin only)

## Landing Page Behavior
The landing page (`src/pages/Index.tsx`) shows only projects from the **`completed_projects` table**.

### What Shows on Landing Page
✅ Projects uploaded by admin through "Dashboard → Completed Projects"
- Must be added manually by admin
- Include: name, location, sqft, description, image

### What Does NOT Show on Landing Page
❌ Projects from the `projects` table, even if their status is "COMPLETED"
- These are internal tracking only
- Changing project status to COMPLETED ≠ automatic portfolio item

## For Admins: How to Add Completed Projects to Landing Page

1. Go to **Dashboard → Completed Projects**
2. Click **"Add New Project"**
3. Fill in details:
   - Project Name
   - Location
   - Square Feet (sqft)
   - Description
   - Upload Image
4. Click **"Create Project"**
5. Project will automatically appear on landing page

## Database Separation
```
Projects Table                  Completed Projects Table
├─ Client project tracking      ├─ Portfolio items
├─ Financial records            ├─ Marketing showcase
├─ Status: ACTIVE/COMPLETED     ├─ Admin-curated
├─ Internal use only            └─ Public display
└─ NOT on landing page              Landing page only
```

## Code Location
- **Landing Page Code**: `src/pages/Index.tsx` (lines 52-68)
- **Admin Upload Page**: `src/pages/dashboard/CompletedProjects.tsx`
- **Database Schema**: `supabase/migrations/001_initial_schema.sql`

## Summary
> **If a project status is changed to "COMPLETED" in Operations → Projects, it will NOT appear on the landing page. Only projects manually added by admin through "Completed Projects" will show on the landing page.**
