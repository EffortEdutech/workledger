# WORKLEDGER DEVELOPMENT CHECKLIST
## Complete Sequenced Development Plan (Start to Finish)

**Project:** WorkLedger - Contract-Aware, Offline-First Work Reporting Platform  
**Developer:** Eff (Solo Developer)  
**Timeline:** 12 weeks (96 hours total)  
**Budget:** RM 0 (100% free-tier)  
**Philosophy:** Do it right the first time  

**Last Updated:** January 25, 2026  
**Version:** 1.0  

---

## 📊 PROGRESS OVERVIEW

### Summary
- **Total Items:** 250+
- **Completed:** 1
- **In Progress:** 0
- **Remaining:** 249+
- **Overall Progress:** 0.4%

### Phase Progress
- **Phase 0 (Project Setup):** 25% (Session 1 done)
- **Phase 1 (Foundation):** 0%
- **Phase 2 (Templates & Reports):** 0%
- **Phase 3 (Offline-First):** 0%

---

## 🎯 DEVELOPMENT SEQUENCE

---

# PHASE 0: PROJECT SETUP (WEEK 0)
**Goal:** Establish proper foundation before Phase 1  
**Duration:** 8 hours over 4 sessions  
**Status:** 25% Complete ⏳

---

## SESSION 1: Repository Structure & Configuration ✅
**Duration:** 2 hours  
**Status:** COMPLETE  
**Date:** January 25, 2026  

### Configuration Files
- [x] package.json
- [x] .env.example
- [x] .gitignore
- [x] vite.config.js
- [x] tailwind.config.js
- [x] postcss.config.js
- [x] vercel.json
- [x] .eslintrc.cjs
- [x] LICENSE
- [x] .github/workflows/deploy.yml
- [x] README.md
- [x] docs/PROGRESS.md
- [x] SETUP_GUIDE.md

### Repository Initialization
- [ ] Git repository initialized locally
- [ ] GitHub repository created
- [ ] Initial commit pushed
- [ ] npm install completed
- [ ] .env.local created
- [ ] VS Code workspace setup

**Deliverables:** ✅ All configuration files ready

---

## SESSION 2: Database Foundation (Part 1)
**Duration:** 3 hours  
**Status:** NOT STARTED  
**Focus:** Core schema, RLS policies, functions  

### 2.1 Supabase Project Setup
- [ ] Create Supabase account (if needed)
- [ ] Create new Supabase project
  - [ ] Project name: workledger
  - [ ] Region: Singapore
  - [ ] Database password saved securely
- [ ] Copy API credentials (URL + anon key)
- [ ] Update .env.local with credentials
- [ ] Test Supabase dashboard access

### 2.2 Database Schema - Core Tables
**File:** `database/schema/001_initial_schema.sql`

#### Table 1: organizations
- [ ] Create organizations table
  - [ ] id (UUID, primary key)
  - [ ] name (TEXT, required)
  - [ ] slug (TEXT, unique)
  - [ ] settings (JSONB)
  - [ ] storage_quota_mb (INTEGER)
  - [ ] user_limit (INTEGER)
  - [ ] subscription_tier (TEXT)
  - [ ] created_at, updated_at, deleted_at
- [ ] Create indexes on organizations
- [ ] Test INSERT query

#### Table 2: user_profiles
- [ ] Create user_profiles table
  - [ ] id (UUID, references auth.users)
  - [ ] full_name (TEXT)
  - [ ] phone_number (TEXT)
  - [ ] avatar_url (TEXT)
  - [ ] preferences (JSONB)
  - [ ] created_at, updated_at
- [ ] Create indexes on user_profiles
- [ ] Test INSERT query

#### Table 3: org_members
- [ ] Create org_members table
  - [ ] id (UUID, primary key)
  - [ ] organization_id (UUID, FK to organizations)
  - [ ] user_id (UUID, FK to auth.users)
  - [ ] role (TEXT) - super_admin, org_admin, manager, worker, client
  - [ ] invited_by (UUID)
  - [ ] invited_at, joined_at
  - [ ] is_active (BOOLEAN)
  - [ ] created_at, updated_at
- [ ] Create unique constraint (organization_id, user_id)
- [ ] Create indexes on org_members
- [ ] Test INSERT query

#### Table 4: projects
- [ ] Create projects table
  - [ ] id (UUID, primary key)
  - [ ] organization_id (UUID, FK to organizations)
  - [ ] project_name (TEXT, required)
  - [ ] project_code (TEXT)
  - [ ] client_name (TEXT, required)
  - [ ] site_address (TEXT)
  - [ ] start_date (DATE)
  - [ ] end_date (DATE)
  - [ ] status (TEXT) - active, completed, on_hold, cancelled
  - [ ] metadata (JSONB)
  - [ ] created_by (UUID, FK to auth.users)
  - [ ] created_at, updated_at, deleted_at
- [ ] Create indexes on projects
- [ ] Test INSERT query

#### Table 5: contracts
- [ ] Create contracts table
  - [ ] id (UUID, primary key)
  - [ ] project_id (UUID, FK to projects)
  - [ ] template_id (UUID, FK to templates)
  - [ ] contract_number (TEXT, required)
  - [ ] contract_name (TEXT, required)
  - [ ] contract_type (TEXT)
  - [ ] contract_category (TEXT) - PMC, CMC, AMC, SLA, etc.
  - [ ] reporting_frequency (TEXT) - daily, weekly, monthly, adhoc
  - [ ] requires_approval (BOOLEAN)
  - [ ] sla_response_time_mins (INTEGER, nullable)
  - [ ] sla_resolution_time_hours (INTEGER, nullable)
  - [ ] sla_tier (TEXT, nullable)
  - [ ] maintenance_cycle (TEXT, nullable)
  - [ ] asset_categories (JSONB)
  - [ ] valid_from (DATE)
  - [ ] valid_until (DATE)
  - [ ] status (TEXT) - draft, active, suspended, completed
  - [ ] created_by (UUID, FK to auth.users)
  - [ ] created_at, updated_at, deleted_at
- [ ] Create unique constraint (project_id, contract_number)
- [ ] Create indexes on contracts
- [ ] Test INSERT query

#### Table 6: templates
- [ ] Create templates table
  - [ ] id (UUID, primary key)
  - [ ] template_id (TEXT, unique)
  - [ ] template_name (TEXT, required)
  - [ ] industry (TEXT)
  - [ ] contract_category (TEXT)
  - [ ] report_type (TEXT)
  - [ ] fields_schema (JSONB, required)
  - [ ] validation_rules (JSONB)
  - [ ] pdf_layout (JSONB)
  - [ ] version (TEXT)
  - [ ] is_locked (BOOLEAN)
  - [ ] is_public (BOOLEAN)
  - [ ] organization_id (UUID, nullable, FK to organizations)
  - [ ] created_by (UUID, FK to auth.users)
  - [ ] created_at, updated_at, deleted_at
- [ ] Create indexes on templates
- [ ] Test INSERT query

#### Table 7: work_entries
- [ ] Create work_entries table
  - [ ] id (UUID, primary key)
  - [ ] contract_id (UUID, FK to contracts)
  - [ ] template_id (UUID, FK to templates)
  - [ ] entry_date (DATE, required)
  - [ ] shift (TEXT, nullable)
  - [ ] data (JSONB, required) - Template-driven data
  - [ ] sla_response_actual_mins (INTEGER, nullable)
  - [ ] sla_resolution_actual_hours (DECIMAL, nullable)
  - [ ] sla_met (BOOLEAN, nullable)
  - [ ] penalty_amount (DECIMAL, nullable)
  - [ ] status (TEXT) - draft, submitted, approved, rejected
  - [ ] created_by (UUID, FK to auth.users)
  - [ ] created_at, updated_at
  - [ ] submitted_at, submitted_by
  - [ ] approved_at, approved_by, approval_remarks
  - [ ] rejected_at, rejected_by, rejection_reason
  - [ ] deleted_at
- [ ] Create unique constraint (contract_id, entry_date, shift, created_by)
- [ ] Create indexes on work_entries
- [ ] Create GIN index on data (JSONB)
- [ ] Test INSERT query

#### Table 8: attachments
- [ ] Create attachments table
  - [ ] id (UUID, primary key)
  - [ ] work_entry_id (UUID, FK to work_entries)
  - [ ] file_type (TEXT) - photo, document, signature
  - [ ] file_name (TEXT)
  - [ ] file_size_bytes (BIGINT)
  - [ ] mime_type (TEXT)
  - [ ] storage_path (TEXT)
  - [ ] thumbnail_path (TEXT, nullable)
  - [ ] metadata (JSONB)
  - [ ] uploaded_by (UUID, FK to auth.users)
  - [ ] uploaded_at (TIMESTAMPTZ)
  - [ ] deleted_at (TIMESTAMPTZ)
- [ ] Create indexes on attachments
- [ ] Test INSERT query

### 2.3 Database Schema Verification
- [ ] Run 001_initial_schema.sql in Supabase SQL Editor
- [ ] Verify all 8 tables created
- [ ] Verify all foreign keys created
- [ ] Verify all indexes created
- [ ] Test INSERT on each table
- [ ] Check table relationships in Supabase Table Editor

**Deliverables:** `database/schema/001_initial_schema.sql` with 8 tables

---

## SESSION 3: Database Foundation (Part 2)
**Duration:** 2 hours  
**Status:** NOT STARTED  
**Focus:** RLS policies, functions, triggers  

### 3.1 Row Level Security (RLS) Policies
**File:** `database/schema/002_rls_policies.sql`

#### Enable RLS on All Tables
- [ ] Enable RLS on organizations
- [ ] Enable RLS on user_profiles
- [ ] Enable RLS on org_members
- [ ] Enable RLS on projects
- [ ] Enable RLS on contracts
- [ ] Enable RLS on templates
- [ ] Enable RLS on work_entries
- [ ] Enable RLS on attachments

#### Organizations Policies
- [ ] Policy: view_own_organizations (users see orgs they're members of)
- [ ] Policy: org_admins_manage_org (org_admins can update their org)
- [ ] Policy: super_admins_view_all (super_admins see all orgs)

#### User Profiles Policies
- [ ] Policy: users_view_own_profile (users see their own profile)
- [ ] Policy: users_update_own_profile (users update their own profile)
- [ ] Policy: org_members_view_profiles (members see profiles in their org)

#### Org Members Policies
- [ ] Policy: view_org_members (members see other members in their org)
- [ ] Policy: org_admins_manage_members (org_admins invite/remove members)
- [ ] Policy: users_view_own_membership (users see their own memberships)

#### Projects Policies
- [ ] Policy: view_org_projects (members see projects in their org)
- [ ] Policy: managers_create_projects (managers+ can create projects)
- [ ] Policy: managers_update_projects (managers+ can update projects)

#### Contracts Policies
- [ ] Policy: view_project_contracts (members see contracts in their projects)
- [ ] Policy: managers_create_contracts (managers+ can create contracts)
- [ ] Policy: managers_update_contracts (managers+ can update contracts)

#### Templates Policies
- [ ] Policy: view_public_templates (all authenticated users see public templates)
- [ ] Policy: view_org_templates (members see their org's private templates)
- [ ] Policy: org_admins_manage_templates (org_admins create/update templates)

#### Work Entries Policies (CRITICAL)
- [ ] Policy: workers_view_own_entries (workers see only their own entries)
- [ ] Policy: managers_view_org_entries (managers see all entries in their org)
- [ ] Policy: workers_create_entries (workers can create entries)
- [ ] Policy: workers_update_own_drafts (workers can update their own drafts)
- [ ] Policy: managers_approve_entries (managers can approve/reject entries)
- [ ] Policy: prevent_edit_submitted_entries (no one can edit submitted/approved)

#### Attachments Policies
- [ ] Policy: view_entry_attachments (users who can view entry can view attachments)
- [ ] Policy: upload_attachments (users who can create entry can upload)
- [ ] Policy: delete_own_attachments (users can delete their own attachments)

### 3.2 Database Functions
**File:** `database/schema/003_functions.sql`

- [ ] Function: get_user_role(user_id, organization_id) → Returns user role
- [ ] Function: check_user_permission(user_id, permission_name) → Boolean
- [ ] Function: auto_update_updated_at() → Trigger function for timestamps
- [ ] Function: validate_contract_category() → Validates contract_category values
- [ ] Function: calculate_sla_metrics() → Auto-calculate SLA response/resolution

### 3.3 Database Triggers
**File:** `database/schema/004_triggers.sql`

- [ ] Trigger: organizations.updated_at auto-update
- [ ] Trigger: user_profiles.updated_at auto-update
- [ ] Trigger: org_members.updated_at auto-update
- [ ] Trigger: projects.updated_at auto-update
- [ ] Trigger: contracts.updated_at auto-update
- [ ] Trigger: templates.updated_at auto-update
- [ ] Trigger: work_entries.updated_at auto-update
- [ ] Trigger: validate_contract_category on INSERT/UPDATE
- [ ] Trigger: calculate_sla_metrics on work_entries INSERT/UPDATE

### 3.4 Database Verification
- [ ] Run 002_rls_policies.sql
- [ ] Run 003_functions.sql
- [ ] Run 004_triggers.sql
- [ ] Test RLS policies with different user roles
- [ ] Test functions work correctly
- [ ] Test triggers fire on INSERT/UPDATE
- [ ] Document any issues in PROGRESS.md

**Deliverables:** 
- `database/schema/002_rls_policies.sql`
- `database/schema/003_functions.sql`
- `database/schema/004_triggers.sql`

---

## SESSION 4: Pre-Built Templates & Verification
**Duration:** 1 hour  
**Status:** NOT STARTED  
**Focus:** Seed templates, verify database, prepare Phase 1  

### 4.1 Pre-Built Templates Installation
**File:** `database/seeds/001_templates.sql`

#### Template 1: Preventive Maintenance (PMC)
- [ ] Create PMC template JSON
- [ ] Insert into templates table
- [ ] Verify fields_schema valid JSON
- [ ] Verify validation_rules valid JSON
- [ ] Verify pdf_layout valid JSON

#### Template 2: Corrective Maintenance (Breakdown)
- [ ] Create Corrective template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

#### Template 3: Comprehensive Maintenance (CMC)
- [ ] Create CMC Monthly Summary template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

#### Template 4: Annual Maintenance (AMC)
- [ ] Create AMC Monthly Summary template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

#### Template 5: SLA-Based Maintenance
- [ ] Create SLA Compliance template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields
- [ ] Verify SLA auto-calculation formulas

#### Template 6: Emergency/On-Call
- [ ] Create Emergency Callout template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

#### Template 7: Time & Material (T&M)
- [ ] Create T&M Timesheet template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

#### Template 8: Construction Daily Diary
- [ ] Create Construction Daily template JSON
- [ ] Insert into templates table
- [ ] Verify all JSON fields

### 4.2 Template Verification
- [ ] Run 001_templates.sql
- [ ] Verify 8 templates inserted
- [ ] Query templates table: `SELECT * FROM templates;`
- [ ] Verify each template JSON is valid
- [ ] Test template retrieval by contract_category

### 4.3 Database Complete Verification
- [ ] All 8 tables exist and populated (test data)
- [ ] All RLS policies active and tested
- [ ] All functions working
- [ ] All triggers working
- [ ] 8 templates installed
- [ ] Can connect from local environment
- [ ] Update .env.local with final credentials

### 4.4 Phase 1 Preparation
- [ ] Update PROGRESS.md with Phase 0 completion
- [ ] Document database schema in docs/DATABASE.md
- [ ] Create Phase 1 task breakdown
- [ ] Review Phase 1 objectives

**Deliverables:**
- `database/seeds/001_templates.sql`
- Phase 0 complete: Database foundation ready

---

# PHASE 1: FOUNDATION (WEEKS 1-4)
**Goal:** Authentication, RBAC, Core hierarchy, Basic work entry  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** NOT STARTED 📅

---

## WEEK 1: Frontend Scaffold & Authentication

### Session 5: Frontend Core Setup (2 hours)

#### 5.1 Entry Point Files
- [ ] Create `index.html`
- [ ] Create `src/main.jsx`
- [ ] Create `src/App.jsx`
- [ ] Create `src/router.jsx`
- [ ] Test: App runs on localhost:5173

#### 5.2 Base Styles
- [ ] Create `src/styles/index.css` (Tailwind imports)
- [ ] Create `src/styles/custom.css`
- [ ] Test: Tailwind classes work

#### 5.3 Core Constants
- [ ] Create `src/constants/roles.js`
  ```javascript
  export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ORG_ADMIN: 'org_admin',
    MANAGER: 'manager',
    WORKER: 'worker',
    CLIENT: 'client'
  };
  ```
- [ ] Create `src/constants/status.js`
  ```javascript
  export const ENTRY_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  };
  ```
- [ ] Create `src/constants/contractTypes.js`
  ```javascript
  export const CONTRACT_CATEGORIES = {
    PMC: 'preventive-maintenance',
    CMC: 'comprehensive-maintenance',
    AMC: 'annual-maintenance',
    SLA: 'sla-based-maintenance',
    CORRECTIVE: 'corrective-maintenance',
    EMERGENCY: 'emergency-on-call',
    T_AND_M: 'time-and-material',
    CONSTRUCTION: 'construction-daily-diary'
  };
  ```
- [ ] Create `src/constants/routes.js`

**Deliverables:** App boots successfully with routing

---

### Session 6: Supabase Integration & Auth (3 hours)

#### 6.1 Supabase Client Setup
- [ ] Create `src/services/supabase/client.js`
  - [ ] Initialize Supabase client
  - [ ] Export supabase instance
- [ ] Test: Can import supabase client

#### 6.2 Authentication Service
- [ ] Create `src/services/supabase/auth.js`
  - [ ] signUp(email, password, metadata)
  - [ ] signIn(email, password)
  - [ ] signOut()
  - [ ] getCurrentUser()
  - [ ] resetPassword(email)
  - [ ] updateProfile(userId, data)
- [ ] Test each function with console.log

#### 6.3 Auth Context
- [ ] Create `src/context/AuthContext.jsx`
  - [ ] AuthProvider component
  - [ ] useAuth hook
  - [ ] State: user, session, loading
  - [ ] Methods: login, logout, register
- [ ] Wrap App with AuthProvider
- [ ] Test: Context accessible from any component

#### 6.4 Auth Components
- [ ] Create `src/components/auth/LoginForm.jsx`
  - [ ] Email/password inputs
  - [ ] Form validation (Zod)
  - [ ] Submit handler
  - [ ] Error display
  - [ ] "Forgot password" link
- [ ] Create `src/components/auth/RegisterForm.jsx`
  - [ ] Email/password inputs
  - [ ] Full name input
  - [ ] Form validation
  - [ ] Submit handler
- [ ] Create `src/components/auth/ProtectedRoute.jsx`
  - [ ] Check authentication
  - [ ] Redirect to login if not authenticated
- [ ] Create `src/components/auth/RoleGuard.jsx`
  - [ ] Check user role
  - [ ] Redirect if insufficient permissions

#### 6.5 Auth Pages
- [ ] Create `src/pages/auth/Login.jsx`
- [ ] Create `src/pages/auth/Register.jsx`
- [ ] Create `src/pages/auth/ForgotPassword.jsx`

#### 6.6 Auth Testing
- [ ] Test: User registration works
- [ ] Test: User login works
- [ ] Test: User logout works
- [ ] Test: Protected routes redirect
- [ ] Test: Session persists on page refresh

**Deliverables:** Complete authentication system

---

### Session 7: Layout Components (2 hours)

#### 7.1 Common Components
- [ ] Create `src/components/common/Button.jsx`
  - [ ] Variants: primary, secondary, danger, ghost
  - [ ] Sizes: sm, md, lg
  - [ ] Loading state
- [ ] Create `src/components/common/Input.jsx`
  - [ ] Text input
  - [ ] Error state
  - [ ] Label support
- [ ] Create `src/components/common/Select.jsx`
- [ ] Create `src/components/common/Modal.jsx`
- [ ] Create `src/components/common/LoadingSpinner.jsx`
- [ ] Create `src/components/common/ErrorBoundary.jsx`

#### 7.2 Layout Structure
- [ ] Create `src/components/layout/AppLayout.jsx`
  - [ ] Header
  - [ ] Sidebar (desktop)
  - [ ] Bottom nav (mobile)
  - [ ] Main content area
- [ ] Create `src/components/layout/Header.jsx`
  - [ ] App logo
  - [ ] User profile dropdown
  - [ ] Logout button
- [ ] Create `src/components/layout/Sidebar.jsx` (desktop)
  - [ ] Navigation links
  - [ ] Active state
- [ ] Create `src/components/layout/BottomNav.jsx` (mobile)
  - [ ] 4 tabs: Work, Projects, Team, More
  - [ ] Icons with labels
  - [ ] Active state
- [ ] Create `src/components/layout/Footer.jsx`

**Deliverables:** Complete layout system

---

### Session 8: Dashboard & Organization Setup (1 hour)

#### 8.1 Organization Service
- [ ] Create `src/services/api/organizationService.js`
  - [ ] createOrganization(name, settings)
  - [ ] getOrganization(id)
  - [ ] updateOrganization(id, data)
  - [ ] inviteMember(orgId, email, role)
  - [ ] getOrgMembers(orgId)

#### 8.2 Dashboard Page
- [ ] Create `src/pages/dashboard/Dashboard.jsx`
  - [ ] Welcome message
  - [ ] Quick stats
  - [ ] Recent activity
  - [ ] Quick actions

#### 8.3 Testing
- [ ] Test: Create organization
- [ ] Test: Dashboard loads after login
- [ ] Test: User profile displays

**Deliverables:** Basic dashboard functional

---

## WEEK 2: Projects & Contracts

### Session 9: Project Management (3 hours)

#### 9.1 Project Service
- [ ] Create `src/services/api/projectService.js`
  - [ ] createProject(organizationId, data)
  - [ ] getProjects(organizationId)
  - [ ] getProject(id)
  - [ ] updateProject(id, data)
  - [ ] deleteProject(id)

#### 9.2 Project Components
- [ ] Create `src/components/projects/ProjectForm.jsx`
  - [ ] Project name input
  - [ ] Client name input
  - [ ] Site address input
  - [ ] Start/end date pickers
  - [ ] Form validation
- [ ] Create `src/components/projects/ProjectCard.jsx`
  - [ ] Project name
  - [ ] Client name
  - [ ] Status badge
  - [ ] Action buttons
- [ ] Create `src/components/projects/ProjectList.jsx`
  - [ ] Grid of project cards
  - [ ] Empty state
  - [ ] Loading state

#### 9.3 Project Pages
- [ ] Create `src/pages/projects/ProjectList.jsx`
  - [ ] Load projects from API
  - [ ] Display project cards
  - [ ] "New Project" button
- [ ] Create `src/pages/projects/NewProject.jsx`
  - [ ] Project form
  - [ ] Submit handler
  - [ ] Success redirect
- [ ] Create `src/pages/projects/EditProject.jsx`
  - [ ] Load project data
  - [ ] Pre-filled form
  - [ ] Update handler
- [ ] Create `src/pages/projects/ProjectDetail.jsx`
  - [ ] Project information
  - [ ] Contracts list
  - [ ] Team members

#### 9.4 Testing
- [ ] Test: Create project
- [ ] Test: View projects list
- [ ] Test: Edit project
- [ ] Test: View project details

**Deliverables:** Complete project management

---

### Session 10: Contract Management (3 hours)

#### 10.1 Contract Service
- [ ] Create `src/services/api/contractService.js`
  - [ ] createContract(projectId, data)
  - [ ] getContracts(projectId)
  - [ ] getContract(id)
  - [ ] updateContract(id, data)
  - [ ] deleteContract(id)

#### 10.2 Template Service
- [ ] Create `src/services/api/templateService.js`
  - [ ] getTemplates(filters)
  - [ ] getTemplate(id)
  - [ ] getTemplatesByCategory(category)

#### 10.3 Contract Components
- [ ] Create `src/components/contracts/ContractTypeBadge.jsx`
  - [ ] Color-coded badges (PMC=blue, CMC=purple, etc.)
  - [ ] Icon + label
- [ ] Create `src/components/contracts/ContractForm.jsx`
  - [ ] Contract number input
  - [ ] Contract name input
  - [ ] Contract category select (PMC, CMC, AMC, SLA, etc.)
  - [ ] Template selector (based on category)
  - [ ] SLA fields (conditional)
  - [ ] Maintenance cycle (conditional)
  - [ ] Valid from/until dates
  - [ ] Form validation
- [ ] Create `src/components/contracts/ContractCard.jsx`
  - [ ] Contract number
  - [ ] Contract type badge
  - [ ] Client name
  - [ ] Status
  - [ ] Action buttons
- [ ] Create `src/components/contracts/ContractList.jsx`

#### 10.4 Contract Pages
- [ ] Create `src/pages/contracts/ContractList.jsx`
- [ ] Create `src/pages/contracts/NewContract.jsx`
- [ ] Create `src/pages/contracts/EditContract.jsx`
- [ ] Create `src/pages/contracts/ContractDetail.jsx`
  - [ ] Contract information
  - [ ] Template details
  - [ ] Work entries for this contract
  - [ ] Reports

#### 10.5 Testing
- [ ] Test: Create PMC contract
- [ ] Test: Create SLA contract (with SLA fields)
- [ ] Test: Template loads based on category
- [ ] Test: View contracts list
- [ ] Test: Contract type badges display correctly

**Deliverables:** Complete contract management

---

### Session 11: RBAC & Permissions (2 hours)

#### 11.1 Permission Service
- [ ] Create `src/services/permissions/rbac.js`
  - [ ] PERMISSIONS constant (object with all permissions)
  - [ ] ROLE_PERMISSIONS mapping
  - [ ] hasPermission(user, permission)
  - [ ] hasRole(user, role)

#### 11.2 Permission Checks
- [ ] Create `src/services/permissions/permissionChecks.js`
  - [ ] canCreateWorkEntry(user, contract)
  - [ ] canEditWorkEntry(user, entry)
  - [ ] canApproveWorkEntry(user, entry)
  - [ ] canViewWorkEntry(user, entry)
  - [ ] canCreateProject(user, organization)
  - [ ] canCreateContract(user, project)

#### 11.3 Permission Hook
- [ ] Create `src/hooks/usePermissions.js`
  - [ ] usePermissions() hook
  - [ ] Returns permission check functions
  - [ ] Memoized for performance

#### 11.4 UI Permission Guards
- [ ] Update Button component with permission check
- [ ] Update navigation with role-based visibility
- [ ] Update forms with field-level permissions

#### 11.5 Testing
- [ ] Test: Worker sees only worker features
- [ ] Test: Manager sees management features
- [ ] Test: RoleGuard redirects properly
- [ ] Test: Buttons hide based on permissions

**Deliverables:** Complete RBAC system

---

## WEEK 3: Work Entries (Template-Driven)

### Session 12: Template System Foundation (3 hours)

#### 12.1 Field Renderer Component
- [ ] Create `src/components/templates/FieldRenderer.jsx`
  - [ ] Handle field types: text, number, date, datetime
  - [ ] Handle field types: select, radio, checkbox
  - [ ] Handle field types: textarea, photo, signature
  - [ ] Handle required validation
  - [ ] Handle conditional rendering (show_if)
  - [ ] Handle auto-calculation fields
  - [ ] Error display

#### 12.2 Section Renderer Component
- [ ] Create `src/components/templates/SectionRenderer.jsx`
  - [ ] Render section title
  - [ ] Render all fields in section
  - [ ] Handle different layouts (two_column, checklist, etc.)

#### 12.3 Dynamic Form Component (CRITICAL)
- [ ] Create `src/components/templates/DynamicForm.jsx`
  - [ ] Load template from props
  - [ ] Generate form from fields_schema
  - [ ] Handle form state
  - [ ] Handle validation (validation_rules)
  - [ ] Handle auto-calculations (formulas)
  - [ ] Handle conditional fields (show_if)
  - [ ] Handle photo uploads
  - [ ] Handle signature capture
  - [ ] Submit handler
  - [ ] Save draft handler

#### 12.4 Template Selector
- [ ] Create `src/components/templates/TemplateSelector.jsx`
  - [ ] Load templates by category
  - [ ] Display template cards
  - [ ] Template preview
  - [ ] Selection handler

#### 12.5 Formula Evaluator
- [ ] Create `src/services/utils/formulaEvaluator.js`
  - [ ] evaluateFormula(formula, data)
  - [ ] MINUTES_BETWEEN(date1, date2)
  - [ ] HOURS_BETWEEN(date1, date2)
  - [ ] Comparison operators (<=, >=, ==, etc.)
  - [ ] COUNT(work_entries WHERE ...)

**Deliverables:** Template system renders forms dynamically

---

### Session 13: Work Entry Creation (3 hours)

#### 13.1 Work Entry Service
- [ ] Create `src/services/api/workEntryService.js`
  - [ ] createWorkEntry(contractId, templateId, data)
  - [ ] getWorkEntries(contractId, filters)
  - [ ] getWorkEntry(id)
  - [ ] updateWorkEntry(id, data)
  - [ ] submitWorkEntry(id)
  - [ ] approveWorkEntry(id, remarks)
  - [ ] rejectWorkEntry(id, reason)
  - [ ] deleteWorkEntry(id)

#### 13.2 Work Entry Components
- [ ] Create `src/components/workEntries/WorkEntryForm.jsx`
  - [ ] Load contract + template
  - [ ] Render DynamicForm
  - [ ] Handle draft saves
  - [ ] Handle submit
- [ ] Create `src/components/workEntries/StatusBadge.jsx`
  - [ ] Color-coded status (draft, submitted, approved, rejected)
- [ ] Create `src/components/workEntries/WorkEntryCard.jsx`
  - [ ] Entry date
  - [ ] Contract name
  - [ ] Status badge
  - [ ] Preview of key fields
  - [ ] Action buttons (edit, view, delete)
- [ ] Create `src/components/workEntries/WorkEntryList.jsx`
  - [ ] List of work entry cards
  - [ ] Filters (date range, status, contract)
  - [ ] Empty state
  - [ ] Loading state

#### 13.3 Work Entry Pages
- [ ] Create `src/pages/work/WorkHome.jsx`
  - [ ] Quick entry section
  - [ ] Recent entries
  - [ ] Filters
- [ ] Create `src/pages/work/NewEntry.jsx`
  - [ ] Select contract
  - [ ] Load template
  - [ ] Render WorkEntryForm
- [ ] Create `src/pages/work/EditEntry.jsx`
  - [ ] Load entry data
  - [ ] Pre-filled form
  - [ ] Update handler
  - [ ] Only for drafts
- [ ] Create `src/pages/work/ViewEntry.jsx`
  - [ ] Read-only view
  - [ ] Approval panel (for managers)

#### 13.4 Testing
- [ ] Test: Create work entry with PMC template
- [ ] Test: Save as draft
- [ ] Test: Submit entry
- [ ] Test: View entries list
- [ ] Test: Edit draft entry
- [ ] Test: Cannot edit submitted entry

**Deliverables:** Work entry creation working

---

### Session 14: Approval Workflow (2 hours)

#### 14.1 Approval Components
- [ ] Create `src/components/workEntries/ApprovalPanel.jsx`
  - [ ] Entry details
  - [ ] Approve button (with remarks input)
  - [ ] Reject button (with reason input)
  - [ ] Only visible to managers
  - [ ] Disabled if already approved/rejected

#### 14.2 SLA Alert Component
- [ ] Create `src/components/workEntries/SLAAlert.jsx`
  - [ ] Display SLA status (met/breached)
  - [ ] Show actual vs target times
  - [ ] Color-coded (green=met, red=breached)
  - [ ] Only for SLA contracts

#### 14.3 Team Pages
- [ ] Create `src/pages/team/PendingApprovals.jsx`
  - [ ] List of submitted entries awaiting approval
  - [ ] Filter by contract
  - [ ] Quick approve/reject actions
  - [ ] Manager-only access

#### 14.4 Testing
- [ ] Test: Manager sees pending approvals
- [ ] Test: Manager approves entry
- [ ] Test: Manager rejects entry
- [ ] Test: Approved entry is immutable
- [ ] Test: SLA alert shows for SLA contracts

**Deliverables:** Approval workflow complete

---

## WEEK 4: Phase 1 Completion & Testing

### Session 15: Attachments & Photos (2 hours)

#### 15.1 Storage Service
- [ ] Create `src/services/supabase/storage.js`
  - [ ] uploadFile(bucket, path, file)
  - [ ] deleteFile(bucket, path)
  - [ ] getPublicUrl(bucket, path)
  - [ ] getSignedUrl(bucket, path, expiresIn)

#### 15.2 Attachment Service
- [ ] Create `src/services/api/attachmentService.js`
  - [ ] uploadAttachment(entryId, file, type)
  - [ ] getAttachments(entryId)
  - [ ] deleteAttachment(id)

#### 15.3 Attachment Components
- [ ] Create `src/components/attachments/PhotoUpload.jsx`
  - [ ] Camera/gallery picker
  - [ ] Image preview
  - [ ] Compression
  - [ ] Upload progress
- [ ] Create `src/components/attachments/PhotoGallery.jsx`
  - [ ] Grid of thumbnails
  - [ ] Lightbox view
  - [ ] Delete option
- [ ] Create `src/components/attachments/SignatureCanvas.jsx`
  - [ ] Canvas for drawing
  - [ ] Clear button
  - [ ] Save as image
- [ ] Create `src/components/attachments/FilePreview.jsx`

#### 15.4 Integration with Work Entries
- [ ] Add PhotoUpload to DynamicForm (for photo fields)
- [ ] Add SignatureCanvas to DynamicForm (for signature fields)
- [ ] Add PhotoGallery to ViewEntry page

#### 15.5 Testing
- [ ] Test: Upload photo from work entry
- [ ] Test: View photos in gallery
- [ ] Test: Delete photo
- [ ] Test: Capture signature
- [ ] Test: Photos sync to Supabase Storage

**Deliverables:** Photo & signature capture working

---

### Session 16: Phase 1 Testing & Documentation (3 hours)

#### 16.1 End-to-End Testing
- [ ] Test complete user flow: Register → Login
- [ ] Test: Create organization
- [ ] Test: Create project
- [ ] Test: Create contract (PMC, CMC, SLA)
- [ ] Test: Create work entry
- [ ] Test: Attach photos
- [ ] Test: Submit entry
- [ ] Test: Manager approves entry
- [ ] Test: View approved entry (immutable)
- [ ] Test: Logout and login again

#### 16.2 RBAC Testing
- [ ] Test: Worker cannot approve entries
- [ ] Test: Worker sees only own entries
- [ ] Test: Manager sees all entries in org
- [ ] Test: Permissions work correctly

#### 16.3 Bug Fixes
- [ ] Fix any bugs found during testing
- [ ] Update PROGRESS.md with issues

#### 16.4 Documentation
- [ ] Update README.md
- [ ] Document API endpoints (docs/API.md)
- [ ] Create user guide (basic)
- [ ] Update PROGRESS.md with Phase 1 completion

#### 16.5 Code Quality
- [ ] Run ESLint: `npm run lint -- --fix`
- [ ] Code review checklist
- [ ] Remove console.logs
- [ ] Add comments to complex logic

**Deliverables:** Phase 1 complete and tested

---

# PHASE 2: TEMPLATES & REPORTS (WEEKS 5-8)
**Goal:** Template library, Dynamic forms, PDF generation  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** NOT STARTED 📅

---

## WEEK 5: PDF Generation Foundation

### Session 17: PDF Service Core (3 hours)

#### 17.1 PDF Generator Service
- [ ] Create `src/services/pdf/pdfGenerator.js`
  - [ ] class PDFService
  - [ ] generateReport(workEntry, template, attachments)
  - [ ] renderHeader(pdf, template, workEntry, yPos)
  - [ ] renderSection(pdf, section, data, yPos)
  - [ ] renderFooter(pdf, template, workEntry)
  - [ ] addPageNumbers(pdf)

#### 17.2 PDF Layout Renderers
- [ ] Create `src/services/pdf/pdfLayouts.js`
  - [ ] renderTwoColumn(pdf, section, data, yPos)
  - [ ] renderSingleColumn(pdf, section, data, yPos)
  - [ ] renderChecklist(pdf, section, data, layout, yPos)
  - [ ] renderTable(pdf, section, data, layout, yPos)
  - [ ] renderMetricsCards(pdf, section, data, layout, yPos)
  - [ ] renderSignatureBox(pdf, section, data, yPos)
  - [ ] renderPhotoGrid(pdf, photos, layout, yPos)

#### 17.3 Testing
- [ ] Test: Generate PDF from PMC work entry
- [ ] Test: PDF includes all sections
- [ ] Test: Photos appear in PDF
- [ ] Test: Signatures appear in PDF

**Deliverables:** PDF generation working

---

### Session 18: Report Components (2 hours)

#### 18.1 Report Service
- [ ] Create `src/services/api/reportService.js`
  - [ ] generateReport(workEntryIds, options)
  - [ ] generateMonthlyReport(contractId, month, year)
  - [ ] getReports(contractId)

#### 18.2 Report Components
- [ ] Create `src/components/reports/ReportGenerator.jsx`
  - [ ] Select entries for report
  - [ ] Report options (logo, header, etc.)
  - [ ] Generate button
  - [ ] Preview PDF
- [ ] Create `src/components/reports/ReportPreview.jsx`
  - [ ] Embed PDF preview
  - [ ] Download button
- [ ] Create `src/components/reports/PDFViewer.jsx`
  - [ ] Display PDF in iframe

#### 18.3 Report Pages
- [ ] Create `src/pages/reports/ReportList.jsx`
- [ ] Create `src/pages/reports/GenerateReport.jsx`
- [ ] Create `src/pages/reports/MonthlyReports.jsx` (for CMC/AMC)

#### 18.4 Testing
- [ ] Test: Generate single work entry report
- [ ] Test: Download PDF
- [ ] Test: Preview PDF in browser

**Deliverables:** Report UI complete

---

### Session 19: Monthly Reports (CMC/AMC) (3 hours)

#### 19.1 Monthly Summary Template Logic
- [ ] Create aggregation logic for monthly reports
  - [ ] Count preventive visits
  - [ ] Count breakdown incidents
  - [ ] Calculate asset availability %
  - [ ] Aggregate spare parts consumption
  - [ ] Pull from multiple work_entries

#### 19.2 Monthly Report Components
- [ ] Enhance DynamicForm for monthly reports
  - [ ] Auto-aggregation sections
  - [ ] Table with repeatable rows
  - [ ] Summary metrics
- [ ] Monthly report PDF layout
  - [ ] Metrics dashboard
  - [ ] Preventive maintenance logs table
  - [ ] Corrective maintenance logs table
  - [ ] Spare parts table with totals

#### 19.3 Testing
- [ ] Test: Generate CMC monthly report
- [ ] Test: Aggregation calculations correct
- [ ] Test: Monthly report PDF renders properly

**Deliverables:** Monthly reports working

---

## WEEK 6: Advanced Templates

### Session 20: SLA Auto-Calculations (2 hours)

#### 20.1 SLA Calculation Logic
- [ ] Enhance formulaEvaluator.js
  - [ ] MINUTES_BETWEEN with actual dates
  - [ ] HOURS_BETWEEN with actual dates
  - [ ] Auto-set sla_met field (Yes/No)
  - [ ] Calculate penalty_amount if configured

#### 20.2 SLA Template Enhancements
- [ ] Update SLA template JSON
  - [ ] Auto-calculate actual_response_time_mins
  - [ ] Auto-calculate actual_resolution_time_hours
  - [ ] Auto-calculate sla_met_response
  - [ ] Auto-calculate sla_met_resolution
  - [ ] Conditional penalty section

#### 20.3 SLA UI Enhancements
- [ ] Real-time calculation in form
- [ ] SLA breach alerts during entry
- [ ] Dashboard: SLA compliance metrics

#### 20.4 Testing
- [ ] Test: SLA calculations accurate
- [ ] Test: Breach alerts show properly
- [ ] Test: Penalty calculated when breached

**Deliverables:** SLA auto-calculations complete

---

### Session 21-22: Custom Template Builder (6 hours)

#### 21.1 Template Builder UI
- [ ] Create `src/pages/settings/TemplateManagement.jsx`
  - [ ] List of templates
  - [ ] "Create Custom Template" button
- [ ] Create template builder page
  - [ ] Drag-and-drop field builder
  - [ ] Field type selector
  - [ ] Validation rules editor
  - [ ] PDF layout configurator

#### 21.2 Template Builder Logic
- [ ] Add/remove sections
- [ ] Add/remove fields
- [ ] Reorder fields
- [ ] Configure field properties
- [ ] Set validation rules
- [ ] Preview template

#### 21.3 Template Version Control
- [ ] Template versioning system
- [ ] Lock templates
- [ ] Clone template (create new version)

#### 21.4 Testing
- [ ] Test: Create custom template
- [ ] Test: Use custom template in contract
- [ ] Test: Generate work entry with custom template

**Deliverables:** Custom template builder (basic)

---

## WEEK 7: Template Library Expansion

### Session 23-24: Additional Templates (6 hours)

#### Templates to Create:
- [ ] Non-Comprehensive Maintenance Template
- [ ] Performance-Based Maintenance Template
- [ ] Outcome-Based Maintenance Template
- [ ] Retainer/Subscription Template
- [ ] Construction Progress Claim Template
- [ ] IT Incident Report Template
- [ ] IT SLA Compliance Template

For each template:
- [ ] Design fields_schema
- [ ] Define validation_rules
- [ ] Configure pdf_layout
- [ ] Insert into database
- [ ] Test work entry creation
- [ ] Test PDF generation

**Deliverables:** 15+ templates available

---

## WEEK 8: Phase 2 Polish & Testing

### Session 25: Phase 2 Testing (4 hours)

#### 25.1 Template Testing
- [ ] Test all 15+ templates
- [ ] Create work entry with each template
- [ ] Generate PDF for each template
- [ ] Verify all fields render correctly

#### 25.2 Report Testing
- [ ] Test single-entry reports
- [ ] Test monthly reports (CMC, AMC)
- [ ] Test custom date range reports
- [ ] Verify PDF quality

#### 25.3 Performance Testing
- [ ] Test with 100+ work entries
- [ ] Test PDF generation speed
- [ ] Test template loading speed

#### 25.4 Bug Fixes & Polish
- [ ] Fix any template rendering issues
- [ ] Improve PDF styling
- [ ] Optimize performance

**Deliverables:** Phase 2 complete and tested

---

# PHASE 3: OFFLINE-FIRST (WEEKS 9-12)
**Goal:** IndexedDB, Sync engine, Conflict handling  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** NOT STARTED 📅

---

## WEEK 9: IndexedDB Foundation

### Session 26: Offline Database Setup (3 hours)

#### 26.1 IndexedDB Schema
- [ ] Create `src/services/offline/db.js`
  - [ ] Initialize Dexie database
  - [ ] Define object stores:
    - [ ] templates (cached)
    - [ ] workEntries (offline storage)
    - [ ] attachments (offline files)
    - [ ] syncQueue (pending operations)
    - [ ] organizations (cached)
    - [ ] projects (cached)
    - [ ] contracts (cached)
  - [ ] Define indexes
  - [ ] Export db instance

#### 26.2 Offline Context
- [ ] Create `src/context/OfflineContext.jsx`
  - [ ] State: isOnline, syncStatus
  - [ ] useOffline hook
  - [ ] Online/offline event listeners

#### 26.3 Offline Hook
- [ ] Create `src/hooks/useOffline.js`
  - [ ] useOffline() hook
  - [ ] Returns: isOnline, syncStatus

#### 26.4 Testing
- [ ] Test: IndexedDB created
- [ ] Test: Can write to IndexedDB
- [ ] Test: Can read from IndexedDB
- [ ] Test: isOnline detects network status

**Deliverables:** IndexedDB foundation ready

---

### Session 27: Offline Storage Integration (3 hours)

#### 27.1 Update Services for Offline
- [ ] Update workEntryService.js
  - [ ] Save to IndexedDB first
  - [ ] Then sync to Supabase if online
  - [ ] Return local ID immediately
  - [ ] Queue for sync if offline
- [ ] Update templateService.js
  - [ ] Cache templates in IndexedDB
  - [ ] Serve from cache when offline
- [ ] Update contractService.js
  - [ ] Cache contracts in IndexedDB
- [ ] Update attachmentService.js
  - [ ] Store files locally (blob)
  - [ ] Queue upload when online

#### 27.2 Testing
- [ ] Test: Create work entry offline
- [ ] Test: Entry saved to IndexedDB
- [ ] Test: Entry appears in UI immediately
- [ ] Test: Can view offline entries

**Deliverables:** Services work offline

---

### Session 28: Sync Queue System (2 hours)

#### 28.1 Sync Queue
- [ ] Create `src/services/offline/syncQueue.js`
  - [ ] addToQueue(entityType, entityId, action)
  - [ ] getQueue()
  - [ ] removeFromQueue(id)
  - [ ] clearQueue()

#### 28.2 Sync Status
- [ ] SYNC_STATUS constants
  - [ ] PENDING: 'pending'
  - [ ] SYNCING: 'syncing'
  - [ ] SYNCED: 'synced'
  - [ ] FAILED: 'failed'
  - [ ] CONFLICT: 'conflict'

#### 28.3 Sync Status UI
- [ ] Create sync status indicator component
  - [ ] Show number of pending items
  - [ ] Show sync progress
  - [ ] Color-coded status

**Deliverables:** Sync queue working

---

## WEEK 10: Sync Engine

### Session 29: Sync Engine Core (4 hours)

#### 29.1 Sync Engine
- [ ] Create `src/services/offline/syncEngine.js`
  - [ ] class SyncEngine
  - [ ] syncAll() - Sync everything
  - [ ] syncTemplates() - Sync templates
  - [ ] syncMetadata() - Sync orgs, projects, contracts
  - [ ] syncWorkEntries() - Sync work entries
  - [ ] syncAttachments() - Sync photos/files
  - [ ] processSyncQueue() - Process pending operations
  - [ ] handleConflict(entity) - Conflict resolution

#### 29.2 Sync Priority
- [ ] Priority 1: Templates (on login)
- [ ] Priority 2: Metadata (orgs, projects, contracts)
- [ ] Priority 3: Work entries
- [ ] Priority 4: Attachments

#### 29.3 Auto-Sync
- [ ] Start sync on app load (if online)
- [ ] Start sync when network reconnects
- [ ] Periodic sync (every 30 seconds when online)
- [ ] Manual sync button

#### 29.4 Testing
- [ ] Test: Create entry offline
- [ ] Test: Go online
- [ ] Test: Entry syncs automatically
- [ ] Test: Verify entry in Supabase

**Deliverables:** Sync engine working

---

### Session 30: Conflict Resolution (2 hours)

#### 30.1 Conflict Detection
- [ ] Compare local vs server timestamps
- [ ] Detect concurrent edits
- [ ] Mark conflicts in UI

#### 30.2 Conflict Resolution Strategy
- [ ] **Server always wins** (simplest for MVP)
- [ ] Discard local changes
- [ ] Notify user of discarded changes
- [ ] Provide option to view discarded data

#### 30.3 Conflict UI
- [ ] Conflict indicator on entry
- [ ] View conflict details
- [ ] Accept server version button

#### 30.4 Testing
- [ ] Test: Edit entry offline
- [ ] Test: Someone else edits same entry online
- [ ] Test: Go online
- [ ] Test: Conflict detected
- [ ] Test: Server version kept

**Deliverables:** Conflict resolution working

---

## WEEK 11: Offline Polish & PWA

### Session 31: PWA Optimization (3 hours)

#### 31.1 Service Worker
- [ ] Verify service worker registered
- [ ] Test cache strategies
- [ ] Update cache on new deployment

#### 31.2 PWA Manifest
- [ ] Create PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
- [ ] Update public/manifest.json
- [ ] Test "Add to Home Screen"

#### 31.3 Offline Page
- [ ] Create offline fallback page
- [ ] Show when completely offline
- [ ] List cached content available

#### 31.4 Testing
- [ ] Test: Install PWA on mobile
- [ ] Test: Works offline
- [ ] Test: Updates on new version

**Deliverables:** PWA fully functional

---

### Session 32: Offline UX Enhancements (3 hours)

#### 32.1 Offline Indicators
- [ ] Add sync status to every page
- [ ] Show "offline" badge in header
- [ ] Disable features that require online
- [ ] Queue indicators on entries

#### 32.2 Smart Loading
- [ ] Show cached data immediately
- [ ] Update in background when online
- [ ] Optimistic UI updates

#### 32.3 Error Handling
- [ ] Better offline error messages
- [ ] Retry mechanisms
- [ ] User-friendly messaging

**Deliverables:** Great offline UX

---

## WEEK 12: Final Testing & Launch Prep

### Session 33: End-to-End Testing (4 hours)

#### 33.1 Complete Offline Flow
- [ ] Test: Full workflow completely offline
  - [ ] Open app offline
  - [ ] Create organization (cached)
  - [ ] Create project (offline)
  - [ ] Create contract (offline)
  - [ ] Create work entry (offline)
  - [ ] Attach photos (offline)
  - [ ] Submit entry (queued)
- [ ] Test: Go online
  - [ ] All data syncs
  - [ ] Manager approves (online)
  - [ ] Generate PDF (works offline with cached data)

#### 33.2 Performance Testing
- [ ] Test with 1000+ entries
- [ ] Test sync speed
- [ ] Test PDF generation speed
- [ ] Test photo upload queue

#### 33.3 Security Testing
- [ ] Test RLS policies thoroughly
- [ ] Test each role's permissions
- [ ] Test unauthorized access attempts

#### 33.4 Cross-Device Testing
- [ ] Test on Android
- [ ] Test on iOS
- [ ] Test on desktop Chrome
- [ ] Test on desktop Firefox
- [ ] Test on desktop Safari

**Deliverables:** Thoroughly tested

---

### Session 34: Documentation & Launch (2 hours)

#### 34.1 Final Documentation
- [ ] Update README.md (final)
- [ ] Create USER_GUIDE.md
- [ ] Create DEPLOYMENT.md (complete)
- [ ] Update docs/API.md
- [ ] Update docs/TEMPLATES.md
- [ ] Update docs/OFFLINE.md

#### 34.2 Code Quality
- [ ] Final ESLint run
- [ ] Remove all console.logs
- [ ] Remove dead code
- [ ] Add missing comments
- [ ] Update package.json version to 1.0.0

#### 34.3 Deployment
- [ ] Deploy to Vercel (production)
- [ ] Configure custom domain (if available)
- [ ] Setup environment variables
- [ ] Test production deployment

#### 34.4 Launch Checklist
- [ ] Supabase project ready
- [ ] Vercel deployment successful
- [ ] All features working in production
- [ ] Documentation complete
- [ ] Support email configured
- [ ] Backup strategy in place

**Deliverables:** WorkLedger 1.0 launched! 🚀

---

# POST-MVP BACKLOG
**Status:** Deferred to Phase 4+

### Future Enhancements
- [ ] Advanced analytics & charts
- [ ] AI-powered work summaries
- [ ] Multi-language support (Bahasa Malaysia, Tamil, Chinese)
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Integration with accounting systems
- [ ] Integration with project management tools
- [ ] Notification system (email, SMS, push)
- [ ] Advanced search & filters
- [ ] Bulk operations
- [ ] Data export (Excel, CSV)
- [ ] Audit logs
- [ ] Advanced RBAC (custom roles)
- [ ] Multi-tenancy enhancements
- [ ] White-label options
- [ ] API for third-party integrations

---

# APPENDIX: CHECKLIST SUMMARY

## By Phase

### Phase 0: Project Setup (Week 0)
- [x] **Session 1:** Repository & Config ✅
- [ ] **Session 2:** Database Schema (8 tables)
- [ ] **Session 3:** RLS Policies & Functions
- [ ] **Session 4:** Templates & Verification

**Total:** 13 configuration files, 8 tables, 50+ RLS policies, 8 templates

### Phase 1: Foundation (Weeks 1-4)
- [ ] **Week 1:** Frontend scaffold, Auth, Layout (8 sessions)
- [ ] **Week 2:** Projects, Contracts, RBAC (6 sessions)
- [ ] **Week 3:** Work Entries, Templates (6 sessions)
- [ ] **Week 4:** Attachments, Testing (5 sessions)

**Total:** 50+ components, 20+ pages, 10+ services

### Phase 2: Templates & Reports (Weeks 5-8)
- [ ] **Week 5:** PDF Generation (5 sessions)
- [ ] **Week 6:** Advanced Templates (8 sessions)
- [ ] **Week 7:** Template Library (6 sessions)
- [ ] **Week 8:** Testing & Polish (4 sessions)

**Total:** 15+ templates, PDF generation, Monthly reports

### Phase 3: Offline-First (Weeks 9-12)
- [ ] **Week 9:** IndexedDB Foundation (6 sessions)
- [ ] **Week 10:** Sync Engine (6 sessions)
- [ ] **Week 11:** PWA & Polish (6 sessions)
- [ ] **Week 12:** Testing & Launch (6 sessions)

**Total:** Complete offline capability, PWA, Sync engine

---

## By File Type

### Configuration Files: 13
- [x] 11 core config files ✅
- [x] 2 documentation files ✅

### Database Files: 12
- [ ] 4 schema files (tables, RLS, functions, triggers)
- [ ] 1 seed file (8 templates)
- [ ] 7 additional migration files (future)

### Source Files: 120+
- [ ] 40+ components
- [ ] 25+ pages
- [ ] 15+ services
- [ ] 10+ hooks
- [ ] 5+ context providers
- [ ] 5+ constants
- [ ] 20+ utility files

### Documentation Files: 10+
- [x] README.md ✅
- [x] PROGRESS.md ✅
- [x] SETUP_GUIDE.md ✅
- [ ] API.md
- [ ] TEMPLATES.md
- [ ] OFFLINE.md
- [ ] DEPLOYMENT.md
- [ ] USER_GUIDE.md
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md

---

## By Priority

### P0 (Critical - Must Have)
- [ ] Authentication & RBAC
- [ ] Database & RLS policies
- [ ] Work entry creation (template-driven)
- [ ] Offline storage (IndexedDB)
- [ ] Sync engine
- [ ] PDF generation
- [ ] 8 core templates (PMC, CMC, AMC, SLA, etc.)

### P1 (High - Should Have)
- [ ] Approval workflow
- [ ] Photo attachments
- [ ] Monthly reports (CMC, AMC)
- [ ] SLA auto-calculations
- [ ] Conflict resolution
- [ ] PWA installation

### P2 (Medium - Nice to Have)
- [ ] Custom template builder
- [ ] 15+ templates
- [ ] Advanced PDF layouts
- [ ] Dashboard analytics

### P3 (Low - Future)
- [ ] AI summaries
- [ ] Multi-language
- [ ] Mobile app
- [ ] Integrations

---

## Quick Stats

- **Total Items:** 250+
- **Completed:** 13 (5%)
- **Phase 0:** 25% complete
- **Phase 1:** 0% complete
- **Phase 2:** 0% complete
- **Phase 3:** 0% complete
- **Estimated Hours:** 96 hours total
- **Estimated Duration:** 12 weeks

---

**Bismillah! This is the complete roadmap. Let's execute it step by step! 🚀**

*Checklist Version: 1.0*  
*Last Updated: January 25, 2026*  
*WorkLedger Project - Complete Development Sequence*
