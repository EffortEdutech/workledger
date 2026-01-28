# WorkLedger

**Contract-Aware, Offline-First Work Reporting Platform**

> Multi-industry work reporting infrastructure for construction, maintenance, facilities, IT services, and more.

[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/supabase-2.39.1-green.svg)](https://supabase.com/)
[![Offline First](https://img.shields.io/badge/offline-first-orange.svg)](docs/OFFLINE.md)

---

## 🎯 What is WorkLedger?

WorkLedger is a **template-driven, offline-first platform** that transforms how construction, maintenance, and service companies report work. Instead of fragmented Excel sheets, WhatsApp photos, and inconsistent records, WorkLedger provides:

- ✅ **Contract-specific reporting templates** (PMC, CMC, AMC, SLA, T&M, etc.)
- ✅ **Offline-capable mobile forms** (works without internet)
- ✅ **Evidence-backed work records** (photos, signatures, timestamps)
- ✅ **Automated PDF generation** (client-ready reports in seconds)
- ✅ **Enterprise-grade RBAC** (5 roles, database-enforced permissions)
- ✅ **Zero additional infrastructure cost** (100% free-tier services)

---

## 🏗️ Target Industries

| Industry | Contract Types | Use Cases |
|----------|---------------|-----------|
| **Construction** | Daily works, Progress claims | Daily diary, BOQ tracking, variations |
| **Facility Maintenance** | PMC, CMC, AMC | Preventive checklists, breakdown reports |
| **M&E Services** | PPM, SLA, T&M | Equipment logs, SLA compliance, response tracking |
| **IT Services** | SLA, Retainer | Incident reports, uptime metrics |
| **Property Management** | Comprehensive | Monthly summaries, tenant requests |
| **Industrial Plant** | Performance-based | Asset health, downtime tracking |

---

## 🚀 Key Features

### 1. Template-Driven Architecture
No database schema changes needed for new contract types. All reporting logic stored as JSON templates:
```javascript
{
  "template_id": "pmc-preventive-maintenance-v1",
  "fields_schema": { /* defines what to collect */ },
  "validation_rules": { /* defines validation */ },
  "pdf_layout": { /* defines report rendering */ }
}
```

### 2. Offline-First by Design
- Works completely offline (construction sites, basements, remote facilities)
- IndexedDB for local storage
- Automatic sync when online
- Conflict resolution built-in

### 3. Contract Category Support
Built-in templates for Malaysian market:
- **PMC** - Preventive Maintenance Contract
- **CMC** - Comprehensive Maintenance Contract
- **AMC** - Annual Maintenance Contract
- **SLA** - Service Level Agreement (with auto-calculations)
- **Corrective** - Breakdown/Reactive Maintenance
- **Emergency** - On-Call/24-7 Contracts
- **T&M** - Time & Material Contracts
- **Construction** - Daily Diary

### 4. Client-Side PDF Generation
Zero-cost report generation using jsPDF:
- Professional, branded reports
- Template-driven layouts
- Photos, signatures, tables
- Works offline

### 5. Enterprise-Grade RBAC
5 roles with database-level permissions:
- **Super Admin** - Platform owner
- **Org Admin** - Organization owner
- **Manager** - Approve entries, view reports
- **Worker** - Create entries, attach files
- **Client** - Read-only access to assigned reports

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **Supabase Account** (free tier)
- **Vercel Account** (free tier, for deployment)

---

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/workledger.git
cd workledger
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Setup Database
Run the database scripts in Supabase SQL Editor:
```bash
# In order:
database/schema/001_initial_schema.sql
database/schema/002_rls_policies.sql
database/schema/003_functions.sql
database/seeds/001_templates.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Technology Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React 18 + Vite | Fast, flexible, proven |
| **Styling** | Tailwind CSS | Rapid UI, design system |
| **Backend** | Supabase (PostgreSQL) | Auth + DB + Storage + RLS |
| **Auth** | Supabase Auth | Enterprise-grade, free |
| **Database** | PostgreSQL (JSONB) | Template-driven flexibility |
| **Storage** | Supabase Storage | Photo attachments, signed URLs |
| **Offline** | IndexedDB (Dexie.js) | Client-side database |
| **PWA** | Workbox + Vite PWA | Service workers, caching |
| **PDF** | jsPDF + AutoTable | Client-side generation |
| **Forms** | React Hook Form + Zod | Validation, type safety |
| **Hosting** | Vercel | Auto-deploy, edge network |

**Total Cost:** RM 0 (100% free-tier services)

---

## 📁 Project Structure

```
workledger/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, inputs, modals
│   │   ├── templates/       # DynamicForm (CRITICAL)
│   │   ├── workEntries/     # Work entry components
│   │   └── ...
│   │
│   ├── pages/               # Route pages
│   │   ├── work/            # Main work tab
│   │   ├── projects/        # Project management
│   │   ├── reports/         # Report generation
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── supabase/        # Supabase client, auth
│   │   ├── offline/         # IndexedDB, sync engine
│   │   ├── api/             # Service layer
│   │   ├── pdf/             # PDF generation
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React Context
│   └── constants/           # Contract types, roles, etc.
│
├── database/                # Database scripts
│   ├── schema/              # Table definitions, RLS
│   ├── seeds/               # Pre-built templates
│   └── migrations/
│
└── docs/                    # Documentation
    ├── PROGRESS.md          # Session-by-session progress
    ├── API.md               # API documentation
    ├── TEMPLATES.md         # Template system guide
    └── OFFLINE.md           # Offline architecture
```

---

## 🔐 Security & Permissions

### Row Level Security (RLS)
All database access controlled by RLS policies:
```sql
-- Workers see only their own entries
CREATE POLICY "view_own_entries" ON work_entries
  FOR SELECT USING (created_by = auth.uid());

-- Managers see all entries in their organization
CREATE POLICY "view_org_entries" ON work_entries
  FOR SELECT USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      WHERE c.project_id IN (
        SELECT p.id FROM projects p
        WHERE p.organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
          AND role IN ('org_admin', 'manager')
        )
      )
    )
  );
```

### Authentication
- Email/password with Supabase Auth
- JWT-based sessions
- Role-based access control (RBAC)
- Secure file storage with signed URLs

---

## 📱 Offline Capabilities

### What Works Offline?
✅ Create work entries  
✅ Attach photos  
✅ View own entries  
✅ Edit drafts  
✅ View cached templates  
✅ Generate PDFs  

### What Requires Online?
❌ Submit entries for approval  
❌ Approve/reject entries  
❌ Create new projects/contracts  
❌ Sync to server  
❌ Download other users' entries  

### Sync Strategy
```
1. Save to IndexedDB immediately (offline-first)
2. Add to sync queue
3. If online: sync to Supabase
4. If offline: queue for later sync
5. Auto-retry failed syncs every 30 seconds
6. Conflict resolution: server always wins
```

---

## 📊 Contract Types Reference

### Malaysian Market Contract Categories

| Code | Full Name | Report Template | Monthly Summary |
|------|-----------|----------------|-----------------|
| PMC | Preventive Maintenance Contract | Per-visit checklist | ❌ |
| CMC | Comprehensive Maintenance Contract | Per-visit + Monthly | âœ… |
| AMC | Annual Maintenance Contract | Per-visit + Monthly | âœ… |
| SLA | Service Level Agreement | Per-incident + KPIs | âœ… |
| CORRECTIVE | Breakdown/Reactive Maintenance | Per-incident | ❌ |
| EMERGENCY | On-Call/24-7 Contract | Per-callout | ❌ |
| T&M | Time & Material Contract | Daily/Weekly timesheet | âœ… (optional) |
| CONSTRUCTION | Construction Daily Works | Daily diary | ❌ |

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Testing Offline Mode
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Test work entry creation, photo upload, PDF generation

### Database Migrations
```bash
# Always run in this order:
1. schema/001_initial_schema.sql
2. schema/002_rls_policies.sql
3. schema/003_functions.sql
4. seeds/001_templates.sql
```

---

## 🚀 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables in Vercel
Add these in Vercel Dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV=production`
- `VITE_APP_URL=https://your-domain.vercel.app`

---

## 📖 Documentation

- **[PROGRESS.md](docs/PROGRESS.md)** - Development progress (session-by-session)
- **[TEMPLATES.md](docs/TEMPLATES.md)** - Template system guide
- **[OFFLINE.md](docs/OFFLINE.md)** - Offline architecture
- **[API.md](docs/API.md)** - API documentation
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide

---

## 🎓 Core Principles

### The Golden Rule
> **Templates + Offline + RBAC = Scalable Multi-Industry Reporting**

### Decision Filter
Every feature must pass these 5 questions:
1. ✅ Does it help users report work **faster**?
2. ✅ Does it work **offline**?
3. ✅ Does it respect **RBAC**?
4. ✅ Does it avoid database **schema changes**?
5. ✅ Does it keep costs at **zero**?

If ANY answer is "no", defer it.

### Development Philosophy
- **"Do it right the first time"** - Quality over speed
- **Offline is NOT a feature** - It's a design constraint
- **Never trust the frontend** - RBAC at database level
- **Server = Final Authority** - Client = Temporary authority
- **Immutable after approval** - Audit trail guaranteed

---

## 🗺️ Roadmap

### Phase 1: Foundation (4 weeks) ✅
- Authentication & RBAC
- Organization/Project/Contract hierarchy
- Basic work entry (template-driven)

### Phase 2: Templates & Reports (4 weeks) ⏳
- Pre-built template library (8 templates)
- Dynamic form generation
- Client-side PDF generation

### Phase 3: Offline-First (4 weeks) 📅
- IndexedDB integration
- Sync engine
- Conflict resolution

### Post-MVP (Future) 📌
- Mobile app (React Native)
- Advanced analytics
- AI-powered summaries
- Multi-language support
- External system integrations

---

## 🤝 Contributing

This is a proprietary project developed by **Bina Jaya / Effort Edutech**.

For internal developers:
1. Create feature branch from `main`
2. Follow existing code patterns from Contract Diary Platform
3. Test offline behavior thoroughly
4. Document in PROGRESS.md
5. Submit PR with detailed description

---

## 📄 License

**PROPRIETARY** - All rights reserved.  
© 2026 Bina Jaya / Effort Edutech

---

## 🙏 Acknowledgments

Built with:
- **Contract Diary Platform** - Proven patterns for offline-first RBAC
- **Platform Master Guideline** - Template-driven architecture principles
- **Malaysian Maintenance Industry Research** - Real-world contract types

---

## 📞 Support

For technical support:
- Email: support@binajaya.com
- Documentation: [docs/](docs/)
- Issues: GitHub Issues (internal)

---

**Bismillah. Let's transform work reporting! 🚀**

*Last Updated: January 25, 2026*  
*Version: 1.0.0*  
*Status: Phase 1 Development*
