# 🚀 Project Setup & Configuration Guide

## Current Environment Status

### Dev Server Running
- **URL:** http://localhost:8081/
- **Port:** 8081 (8080 was in use, so Vite auto-selected 8081)

### Environment Variables

**File:** `.env.local` (created automatically)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://aitozobldvwcspaqesvt.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:8081
```

---

## What is VITE_API_BASE_URL?

### Definition
The base URL where your frontend application is running and accessible.

### Structure
```
VITE_             → Vite environment variable (exposed to frontend)
_API_BASE_URL     → Purpose of the variable
http://localhost:8081  → The actual URL
```

### How It's Used

In your code, you can access it like:
```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
// Returns: "http://localhost:8081"
```

### Current Values

| Environment | URL | Port |
|------------|-----|------|
| Development | http://localhost:8081 | 8081 |
| Production | https://your-domain.com | 443 |

---

## 📋 Next Steps

### 1. Create Supabase Project
Visit https://supabase.com and create a new project

### 2. Update .env.local with Real Credentials

```env
VITE_SUPABASE_URL=https://your-project-xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:8081
```

### 3. Initialize Database

Go to Supabase SQL Editor and paste:
```sql
-- Copy entire content of: supabase/migrations/001_initial_schema.sql
```

### 4. Test the App

Visit http://localhost:8081 and:
1. Go to Contact form
2. Submit a test lead
3. Login with admin@mim.com / password123
4. View lead in dashboard

---

## 🔧 Vite Configuration

**File:** `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,        // Primary port
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // @ = src/
    },
  },
}));
```

### Key Settings:
- **Primary Port:** 8080
- **Fallback Port:** 8081 (if 8080 in use)
- **Path Alias:** `@` = `src/`

---

## 📚 All Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `VITE_API_BASE_URL` | Frontend app base URL | `http://localhost:8081` |

---

## ✅ Checklist

- [ ] Supabase project created
- [ ] `.env.local` configured with real keys
- [ ] Database schema initialized
- [ ] Dev server running on 8081
- [ ] Can access http://localhost:8081
- [ ] Can login with admin@mim.com / password123
- [ ] Can view dashboard

---

## 🆘 Common Issues

### Port Already in Use
```bash
# Vite automatically tries next available port
# Currently using 8081 instead of 8080
```

### Can't Access localhost:8081
- Check that dev server is running
- Check firewall settings
- Try accessing http://127.0.0.1:8081

### API Connection Errors
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check browser console (F12) for errors

---

**Created:** Feb 24, 2026  
**Status:** ✅ Ready for Development
