# WORKLEDGER - DEVELOPMENT CHECKLIST

**Last Updated:** January 29, 2026  
**Project:** WorkLedger - Contract-Aware Work Reporting Platform  
**Developer:** Eff (Solo Developer)  
**Organization:** Bina Jaya / Effort Edutech

---

## PROJECT STATUS OVERVIEW

- **Phase 0 (Project Setup):** ✅ COMPLETE (100%)
- **Phase 1 (Foundation):** 🔄 IN PROGRESS (25% - 2/8 sessions complete)
- **Phase 2 (Templates & Reports):** 📅 NOT STARTED
- **Phase 3 (Offline-First):** 📅 NOT STARTED

**Overall Progress:** 12.5%

---

# PHASE 1: FOUNDATION (WEEKS 1-4)
**Goal:** Authentication, RBAC, Core hierarchy, Basic work entry  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** 🔄 IN PROGRESS (25% complete - 2/8 sessions)

---

## WEEK 1: Frontend Scaffold & Authentication

### ✅ Session 5: Frontend Core Setup (2 hours) - COMPLETE

#### 5.1 Entry Point Files ✅
- [x] Create `index.html`
- [x] Create `src/main.jsx`
- [x] Create `src/App.jsx`
- [x] Create `src/router.jsx`
- [x] Test: App runs on localhost:5173

#### 5.2 Base Styles ✅
- [x] Create `src/styles/index.css` (Tailwind imports)
- [x] Create `src/styles/custom.css`
- [x] Test: Tailwind classes work

#### 5.3 Core Constants ✅
- [x] Create `src/constants/roles.js`
  - [x] ROLES constant with 5 roles
  - [x] Role hierarchy system
  - [x] Helper functions
- [x] Create `src/constants/status.js`
  - [x] Entry status (draft, submitted, approved, rejected)
  - [x] Project/contract/sync status
  - [x] Status transitions
- [x] Create `src/constants/contractTypes.js`
  - [x] 8 Malaysian contract categories
  - [x] SLA tiers and defaults
  - [x] Maintenance cycles
- [x] Create `src/constants/routes.js`
  - [x] Public and protected routes
  - [x] Helper functions

#### 5.4 Supabase Integration ✅
- [x] Create `src/services/supabase/client.js`
  - [x] Initialize Supabase client
  - [x] Helper functions
- [x] Create `src/services/supabase/auth.js`
  - [x] signUp, signIn, signOut
  - [x] getCurrentUser, getCurrentSession
  - [x] resetPassword, updatePassword
  - [x] updateProfile, getUserProfile

**Session 5 Deliverables:** ✅ App boots successfully with routing

---

### ✅ Session 6: Supabase Integration & Auth (3 hours) - COMPLETE

#### 6.1 Auth Context ✅
- [x] Create `src/context/AuthContext.jsx`
  - [x] AuthProvider component
  - [x] useAuth hook
  - [x] State: user, session, loading, profile
  - [x] Methods: login, logout, register, resetPassword, updatePassword, updateProfile
- [x] Wrap App with AuthProvider
- [x] Test: Context accessible from any component

#### 6.2 Auth Components ✅
- [x] Create `src/components/auth/LoginForm.jsx`
  - [x] Email/password inputs
  - [x] Form validation (Zod/manual)
  - [x] Submit handler
  - [x] Error display
  - [x] "Forgot password" link
  - [x] "Remember me" checkbox
- [x] Create `src/components/auth/RegisterForm.jsx`
  - [x] Email/password inputs
  - [x] Full name input
  - [x] Form validation
  - [x] Password strength indicator
  - [x] Submit handler
  - [x] Terms & conditions checkbox
- [x] Create `src/components/auth/ForgotPasswordForm.jsx`
  - [x] Email input
  - [x] Form validation
  - [x] Submit handler
  - [x] Success message
- [x] Create `src/components/auth/ProtectedRoute.jsx`
  - [x] Check authentication
  - [x] Redirect to login if not authenticated
  - [x] Loading state
- [x] Create `src/components/auth/RoleGuard.jsx`
  - [x] Check user role
  - [x] Redirect if insufficient permissions
  - [x] Fetch role from database

#### 6.3 Auth Layouts ✅
- [x] Create `src/components/layout/AuthLayout.jsx`
  - [x] Simple centered layout
  - [x] Branding/logo
  - [x] Footer
- [x] Create `src/components/layout/AppLayout.jsx`
  - [x] Header with navigation
  - [x] User info display
  - [x] Logout button
  - [x] Footer

#### 6.4 Auth Pages ✅
- [x] Create `src/pages/auth/Login.jsx`
- [x] Create `src/pages/auth/Register.jsx`
- [x] Create `src/pages/auth/ForgotPassword.jsx`
- [x] Create `src/pages/Dashboard.jsx`
  - [x] Welcome message
  - [x] User info card
  - [x] Quick action cards

#### 6.5 Router Updates ✅
- [x] Update `src/router.jsx` with protected routes
- [x] Update `src/App.jsx` with AuthProvider

#### 6.6 Auth Testing ✅
- [x] Test: User registration works
- [x] Test: User login works
- [x] Test: User logout works
- [x] Test: Protected routes redirect
- [x] Test: Session persists on page refresh

**Session 6 Deliverables:** ✅ Complete authentication system

---

### Session 7: Layout Components (2 hours) - NEXT

#### 7.1 Common Components
- [ ] Create `src/components/common/Button.jsx`
  - [ ] Variants: primary, secondary, danger, ghost
  - [ ] Sizes: sm, md, lg
  - [ ] Loading state
  - [ ] Disabled state
- [ ] Create `src/components/common/Input.jsx`
  - [ ] Text input
  - [ ] Error state
  - [ ] Label support
  - [ ] Help text
- [ ] Create `src/components/common/Select.jsx`
  - [ ] Dropdown select
  - [ ] Error state
  - [ ] Label support
- [ ] Create `src/components/common/Modal.jsx`
  - [ ] Overlay/backdrop
  - [ ] Close button
  - [ ] Header/body/footer sections
- [ ] Create `src/components/common/LoadingSpinner.jsx`
  - [ ] Sizes: sm, md, lg
  - [ ] Full page option
- [ ] Create `src/components/common/ErrorBoundary.jsx`
  - [ ] Catch React errors
  - [ ] Display error UI
  - [ ] Error reporting

#### 7.2 Layout Structure
- [ ] Create `src/components/layout/Header.jsx`
  - [ ] App logo
  - [ ] Navigation menu
  - [ ] User profile dropdown
  - [ ] Logout button
- [ ] Create `src/components/layout/Sidebar.jsx` (desktop)
  - [ ] Navigation links
  - [ ] Active state
  - [ ] Collapsible
- [ ] Create `src/components/layout/BottomNav.jsx` (mobile)
  - [ ] 4 tabs: Work, Projects, Team, More
  - [ ] Icons with labels
  - [ ] Active state
- [ ] Create `src/components/layout/Footer.jsx`
  - [ ] Copyright
  - [ ] Links
- [ ] Update `src/components/layout/AppLayout.jsx`
  - [ ] Integrate new components
  - [ ] Responsive behavior

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

#### 8.2 Dashboard Components
- [ ] Create `src/components/dashboard/StatsCard.jsx`
  - [ ] Icon
  - [ ] Title
  - [ ] Value
  - [ ] Trend indicator
- [ ] Create `src/components/dashboard/RecentActivity.jsx`
  - [ ] Activity list
  - [ ] Time formatting
- [ ] Update `src/pages/Dashboard.jsx`
  - [ ] Stats cards (entries, projects, contracts)
  - [ ] Recent activity feed
  - [ ] Quick actions

#### 8.3 Organization Pages
- [ ] Create `src/pages/organizations/OrganizationList.jsx`
- [ ] Create `src/pages/organizations/NewOrganization.jsx`
- [ ] Create `src/pages/organizations/OrganizationSettings.jsx`

**Deliverables:** Working dashboard with organization management

---

## WEEK 2: Project & Contract Management

### Session 9: Project Management (3 hours)

#### 9.1 Project Service
- [ ] Create `src/services/api/projectService.js`
  - [ ] createProject(data)
  - [ ] getProjects(organizationId)
  - [ ] getProject(id)
  - [ ] updateProject(id, data)
  - [ ] deleteProject(id)

#### 9.2 Project Components
- [ ] Create `src/components/projects/ProjectForm.jsx`
  - [ ] Project name input
  - [ ] Client name input
  - [ ] Site address input
  - [ ] Start/end dates
  - [ ] Status selector
  - [ ] Form validation
- [ ] Create `src/components/projects/ProjectCard.jsx`
  - [ ] Project name
  - [ ] Client info
  - [ ] Status badge
  - [ ] Progress indicator
  - [ ] Action buttons
- [ ] Create `src/components/projects/ProjectList.jsx`
  - [ ] Grid/list view toggle
  - [ ] Filtering
  - [ ] Sorting

#### 9.3 Project Pages
- [ ] Create `src/pages/projects/ProjectList.jsx`
- [ ] Create `src/pages/projects/NewProject.jsx`
- [ ] Create `src/pages/projects/EditProject.jsx`
- [ ] Create `src/pages/projects/ProjectDetail.jsx`
  - [ ] Project information
  - [ ] Contracts list
  - [ ] Work entries summary

#### 9.4 Testing
- [ ] Test: Create project
- [ ] Test: View projects list
- [ ] Test: Update project
- [ ] Test: Delete project
- [ ] Test: RLS policies work

**Deliverables:** Complete project management

---

### Session 10: Contract Management (3 hours)

#### 10.1 Contract Service
- [ ] Create `src/services/api/contractService.js`
  - [ ] createContract(data)
  - [ ] getContracts(projectId)
  - [ ] getContract(id)
  - [ ] updateContract(id, data)
  - [ ] deleteContract(id)
  - [ ] getTemplateForCategory(category)

#### 10.2 Contract Types Selector
- [ ] Create `src/components/contracts/ContractTypeSelector.jsx`
  - [ ] 8 contract category cards
  - [ ] Category descriptions
  - [ ] Color-coded badges
  - [ ] Icon + label

#### 10.3 Contract Components
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
  - [ ] Handle section visibility (show_if)

#### 12.3 Template Renderer Component
- [ ] Create `src/components/templates/TemplateRenderer.jsx`
  - [ ] Render all sections
  - [ ] Handle template metadata
  - [ ] Handle form state
  - [ ] Handle form validation
  - [ ] Handle form submission

#### 12.4 Testing
- [ ] Test: Text/number/date fields render
- [ ] Test: Select/radio/checkbox fields render
- [ ] Test: Required validation works
- [ ] Test: Conditional rendering works
- [ ] Test: Section layouts (two_column, checklist) work

**Deliverables:** Template rendering system

---

### Session 13: Work Entry Creation (3 hours)

#### 13.1 Work Entry Service
- [ ] Create `src/services/api/workEntryService.js`
  - [ ] createWorkEntry(contractId, templateId, data)
  - [ ] getWorkEntries(contractId)
  - [ ] getWorkEntry(id)
  - [ ] updateWorkEntry(id, data)
  - [ ] submitWorkEntry(id)
  - [ ] deleteWorkEntry(id)

#### 13.2 Work Entry Components
- [ ] Create `src/components/workEntries/WorkEntryForm.jsx`
  - [ ] Contract selector
  - [ ] Entry date picker
  - [ ] Template renderer integration
  - [ ] Form validation
  - [ ] Save draft button
  - [ ] Submit button
- [ ] Create `src/components/workEntries/WorkEntryCard.jsx`
  - [ ] Entry date
  - [ ] Contract info
  - [ ] Status badge
  - [ ] Preview
  - [ ] Action buttons
- [ ] Create `src/components/workEntries/WorkEntryList.jsx`
  - [ ] Filtering by status
  - [ ] Filtering by date range
  - [ ] Sorting

#### 13.3 Work Entry Pages
- [ ] Create `src/pages/workEntries/WorkEntryList.jsx`
- [ ] Create `src/pages/workEntries/NewWorkEntry.jsx`
- [ ] Create `src/pages/workEntries/EditWorkEntry.jsx`
- [ ] Create `src/pages/workEntries/WorkEntryDetail.jsx`
  - [ ] Entry information
  - [ ] All field values
  - [ ] Attachments
  - [ ] Approval status

#### 13.4 Testing
- [ ] Test: Create work entry (PMC template)
- [ ] Test: Create work entry (SLA template)
- [ ] Test: Save as draft
- [ ] Test: Submit for approval
- [ ] Test: View work entries list

**Deliverables:** Work entry creation system

---

### Session 14: Work Entry Approval (2 hours)

#### 14.1 Approval Service
- [ ] Create `src/services/api/approvalService.js`
  - [ ] approveWorkEntry(id, comments)
  - [ ] rejectWorkEntry(id, reason)
  - [ ] getPendingApprovals(managerId)

#### 14.2 Approval Components
- [ ] Create `src/components/approvals/ApprovalActions.jsx`
  - [ ] Approve button
  - [ ] Reject button
  - [ ] Comments textarea
  - [ ] Reason textarea
- [ ] Create `src/components/approvals/ApprovalHistory.jsx`
  - [ ] Timeline of status changes
  - [ ] Approver info
  - [ ] Comments/reasons

#### 14.3 Approval Pages
- [ ] Create `src/pages/approvals/PendingApprovals.jsx`
  - [ ] List of pending entries
  - [ ] Quick approve/reject
  - [ ] Batch actions

#### 14.4 Testing
- [ ] Test: Manager sees pending approvals
- [ ] Test: Manager can approve entry
- [ ] Test: Manager can reject entry
- [ ] Test: Worker can see approval status
- [ ] Test: Worker cannot approve own entries

**Deliverables:** Approval workflow

---

## WEEK 4: Attachments & Testing

### Session 15: Photo Attachments (3 hours)

#### 15.1 Photo Upload Component
- [ ] Create `src/components/attachments/PhotoUpload.jsx`
  - [ ] Camera capture (mobile)
  - [ ] File upload
  - [ ] Preview thumbnails
  - [ ] Delete photo
  - [ ] Max 10 photos limit
  - [ ] 5MB per photo limit

#### 15.2 Attachment Service
- [ ] Create `src/services/api/attachmentService.js`
  - [ ] uploadPhoto(workEntryId, file)
  - [ ] getAttachments(workEntryId)
  - [ ] deleteAttachment(id)
  - [ ] uploadSignature(workEntryId, signatureData)

#### 15.3 Photo Gallery
- [ ] Create `src/components/attachments/PhotoGallery.jsx`
  - [ ] Grid layout
  - [ ] Full-screen view
  - [ ] Navigation between photos
  - [ ] Download option

#### 15.4 Testing
- [ ] Test: Upload photo from computer
- [ ] Test: Capture photo from mobile camera
- [ ] Test: View photo gallery
- [ ] Test: Delete photo
- [ ] Test: File size validation (5MB limit)
- [ ] Test: Photo count validation (10 max)

**Deliverables:** Photo attachment system

---

### Session 16: Integration Testing & Bug Fixes (3 hours)

#### 16.1 Complete User Flows
- [ ] Test: Worker creates account → joins org → creates work entry → submits
- [ ] Test: Manager approves/rejects work entry
- [ ] Test: Client views approved work entries (read-only)
- [ ] Test: Org Admin invites users → assigns roles
- [ ] Test: Work entry with PMC template
- [ ] Test: Work entry with SLA template (response time tracking)

#### 16.2 RLS Policy Testing
- [ ] Test: Worker sees only own entries
- [ ] Test: Manager sees all org entries
- [ ] Test: Client sees only approved entries
- [ ] Test: Cross-org data isolation

#### 16.3 Edge Cases
- [ ] Test: Offline behavior (should fail gracefully)
- [ ] Test: Large work entry (100+ fields)
- [ ] Test: Work entry with all field types
- [ ] Test: Concurrent editing

#### 16.4 Bug Fixes
- [ ] Fix any issues found during testing
- [ ] Optimize slow queries
- [ ] Improve error messages
- [ ] Add loading states where missing

#### 16.5 Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Document database schema
- [ ] Document API endpoints (if any)

**Deliverables:** Stable, tested Phase 1 MVP

---

# PHASE 2: TEMPLATES & REPORTS (WEEKS 5-8)
**Goal:** PDF generation, Template library, Reporting  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** 📅 NOT STARTED

---

## WEEK 5: Template Management

### Session 17: Template CRUD (3 hours)

#### 17.1 Template Service
- [ ] Create `src/services/api/templateService.js`
  - [ ] getTemplates(category, organizationId)
  - [ ] getTemplate(id)
  - [ ] createTemplate(data)
  - [ ] updateTemplate(id, data)
  - [ ] deleteTemplate(id)
  - [ ] cloneTemplate(id, newName)

#### 17.2 Template Builder Components
- [ ] Create `src/components/templates/builder/TemplateBuilder.jsx`
  - [ ] Section editor
  - [ ] Field editor
  - [ ] Drag & drop reordering
  - [ ] Field type selector
- [ ] Create `src/components/templates/builder/FieldEditor.jsx`
  - [ ] Field name input
  - [ ] Field type selector
  - [ ] Required checkbox
  - [ ] Validation rules
  - [ ] Conditional rendering (show_if)
- [ ] Create `src/components/templates/builder/SectionEditor.jsx`
  - [ ] Section name
  - [ ] Layout selector
  - [ ] Fields list

#### 17.3 Template Pages
- [ ] Create `src/pages/templates/TemplateList.jsx`
- [ ] Create `src/pages/templates/TemplateBuilder.jsx`
- [ ] Create `src/pages/templates/TemplatePreview.jsx`

#### 17.4 Seed Templates
- [ ] Seed 8 contract templates to database
- [ ] Test: PMC template loads correctly
- [ ] Test: SLA template loads correctly
- [ ] Test: Custom template can be created

**Deliverables:** Template management system

---

### Session 18: PDF Generation - jsPDF (3 hours)

#### 18.1 PDF Service
- [ ] Create `src/services/pdf/pdfService.js`
  - [ ] generatePDF(workEntry, template)
  - [ ] renderHeader(pdf, contract, entry)
  - [ ] renderSection(pdf, section, data)
  - [ ] renderField(pdf, field, value)
  - [ ] renderSignature(pdf, signature)
  - [ ] renderPhotos(pdf, photos)

#### 18.2 PDF Layout
- [ ] Header with logo & contract info
- [ ] Section rendering (respecting layout)
- [ ] Field rendering (with labels)
- [ ] Photo embedding (thumbnails)
- [ ] Signature embedding
- [ ] Footer with page numbers

#### 18.3 PDF Preview
- [ ] Create `src/components/pdf/PDFPreview.jsx`
  - [ ] Generate preview
  - [ ] Download button
  - [ ] Email button (future)
  - [ ] Print button

#### 18.4 Testing
- [ ] Test: Generate PDF for PMC work entry
- [ ] Test: Generate PDF for SLA work entry
- [ ] Test: PDF includes all sections/fields
- [ ] Test: Photos render in PDF
- [ ] Test: Signature renders in PDF
- [ ] Test: PDF downloads successfully

**Deliverables:** Client-side PDF generation

---

### Session 19: Monthly Reports (2 hours)

#### 19.1 Report Service
- [ ] Create `src/services/api/reportService.js`
  - [ ] getMonthlyReport(contractId, year, month)
  - [ ] getSLAReport(contractId, dateRange)
  - [ ] getCustomReport(filters)

#### 19.2 Report Components
- [ ] Create `src/components/reports/MonthlyReportTable.jsx`
  - [ ] Work entries grouped by date
  - [ ] Summary statistics
  - [ ] Export to PDF button
- [ ] Create `src/components/reports/SLAReportTable.jsx`
  - [ ] Response time metrics
  - [ ] Resolution time metrics
  - [ ] SLA compliance percentage

#### 19.3 Report Pages
- [ ] Create `src/pages/reports/MonthlyReport.jsx`
- [ ] Create `src/pages/reports/SLAReport.jsx`
- [ ] Create `src/pages/reports/CustomReport.jsx`

**Deliverables:** Reporting system

---

### Session 20: Template Library & Sharing (2 hours)

#### 20.1 Public Template Library
- [ ] Seed 20+ professional templates
- [ ] PMC variations (daily, weekly, monthly)
- [ ] SLA variations (IT, Facilities, HVAC)
- [ ] CMC variations (Building, Equipment)
- [ ] Construction templates

#### 20.2 Template Sharing
- [ ] Make template public/private
- [ ] Organization-specific templates
- [ ] Template categories/tags
- [ ] Template search

#### 20.3 Template Import/Export
- [ ] Export template as JSON
- [ ] Import template from JSON
- [ ] Validate imported template

**Deliverables:** Template library

---

## WEEK 6-8: Advanced Features

### Session 21-24: (To be defined based on Phase 1 feedback)

Potential features:
- [ ] Bulk work entry creation
- [ ] Work entry cloning
- [ ] Advanced filtering/search
- [ ] Dashboard analytics
- [ ] Email notifications
- [ ] Data export (CSV, Excel)
- [ ] API documentation
- [ ] User preferences
- [ ] Dark mode
- [ ] i18n (Bahasa Malaysia)

---

# PHASE 3: OFFLINE-FIRST (WEEKS 9-12)
**Goal:** IndexedDB, Sync engine, PWA  
**Duration:** 32 hours (8 hours/week × 4 weeks)  
**Status:** 📅 NOT STARTED

---

## WEEK 9: IndexedDB Foundation

### Session 25: IndexedDB Schema & Setup (3 hours)

#### 25.1 Dexie.js Setup
- [ ] Install Dexie.js
- [ ] Create `src/services/offline/db.js`
  - [ ] Define IndexedDB schema
  - [ ] Tables: work_entries, contracts, templates, attachments
  - [ ] Indexes for querying

#### 25.2 Data Models
- [ ] Create `src/services/offline/models.js`
  - [ ] WorkEntry model
  - [ ] Contract model
  - [ ] Template model
  - [ ] Attachment model
  - [ ] SyncQueue model

#### 25.3 CRUD Operations
- [ ] Create offline CRUD for work entries
- [ ] Create offline CRUD for contracts
- [ ] Create offline CRUD for templates
- [ ] Handle sync_status field

**Deliverables:** IndexedDB foundation

---

### Session 26: Offline Work Entry Creation (3 hours)

#### 26.1 Offline Detection
- [ ] Create `src/hooks/useOnlineStatus.js`
- [ ] Create `src/components/common/OfflineIndicator.jsx`
- [ ] Update UI when offline

#### 26.2 Offline Work Entry Service
- [ ] Save work entry to IndexedDB
- [ ] Save attachments to IndexedDB (Base64)
- [ ] Queue for sync when online
- [ ] Generate local IDs (UUID)

#### 26.3 Testing
- [ ] Test: Create work entry offline
- [ ] Test: Edit work entry offline
- [ ] Test: Delete work entry offline
- [ ] Test: Offline indicator shows

**Deliverables:** Offline work entry creation

---

### Session 27: Sync Engine (3 hours)

#### 27.1 Sync Service
- [ ] Create `src/services/offline/syncService.js`
  - [ ] syncWorkEntries()
  - [ ] syncAttachments()
  - [ ] handleConflicts()
  - [ ] retryFailedSync()

#### 27.2 Sync Logic
- [ ] Detect when back online
- [ ] Sync work entries to Supabase
- [ ] Sync attachments to Supabase Storage
- [ ] Update local IDs with remote IDs
- [ ] Handle sync errors

#### 27.3 Conflict Resolution
- [ ] Last-write-wins strategy
- [ ] Mark conflicts for manual resolution
- [ ] Conflict UI for user

#### 27.4 Testing
- [ ] Test: Work entry syncs when online
- [ ] Test: Attachments sync when online
- [ ] Test: Failed sync retries
- [ ] Test: Conflict resolution

**Deliverables:** Sync engine

---

### Session 28: Progressive Web App (PWA) (3 hours)

#### 28.1 Service Worker
- [ ] Configure Workbox in vite.config.js
- [ ] Cache static assets
- [ ] Cache API responses (Supabase)
- [ ] Offline fallback page

#### 28.2 PWA Manifest
- [ ] Update manifest.json
- [ ] Add app icons (512x512, 192x192, etc.)
- [ ] Set app name, theme color
- [ ] Set start URL

#### 28.3 Install Prompt
- [ ] Create `src/components/pwa/InstallPrompt.jsx`
- [ ] Show install prompt (iOS, Android)
- [ ] Track installation

#### 28.4 Testing
- [ ] Test: App installs on mobile
- [ ] Test: App works offline
- [ ] Test: Service worker caches assets
- [ ] Test: Push notifications (future)

**Deliverables:** Full PWA capability

---

## WEEK 10-12: Polish & Testing

### Session 29-32: (Final polish based on user feedback)

- [ ] Performance optimization
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile testing (iOS, Android)
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment to production

---

# DEPLOYMENT CHECKLIST

## Pre-Deployment
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Lighthouse score > 90
- [ ] Accessibility score > 90
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] Error tracking configured (Sentry)

## Production Deployment
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Setup HTTPS
- [ ] Configure CDN
- [ ] Setup monitoring
- [ ] Setup backups

## Post-Deployment
- [ ] Smoke tests on production
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Collect user feedback

---

# BACKLOG (Future Enhancements)

## High Priority
- [ ] Email notifications for approvals
- [ ] SMS notifications (Twilio)
- [ ] Bulk operations
- [ ] Data export (CSV, Excel, PDF)
- [ ] Advanced analytics dashboard
- [ ] Custom report builder

## Medium Priority
- [ ] Mobile apps (React Native)
- [ ] Multi-language support (Bahasa Malaysia)
- [ ] Dark mode
- [ ] Barcode/QR code scanning
- [ ] Integration with accounting software
- [ ] Integration with project management tools

## Low Priority
- [ ] AI-powered field auto-fill
- [ ] Voice-to-text for work entries
- [ ] Chatbot for help/support
- [ ] Video attachments
- [ ] Collaborative editing

---

**Last Updated:** January 29, 2026  
**Next Session:** Session 7 - Layout Components (2 hours)  
**Current Sprint:** Phase 1 Week 1

**Progress Tracking:**
- ✅ Session 5: Frontend Core Setup (2h) - COMPLETE
- ✅ Session 6: Authentication UI (3h) - COMPLETE
- 🔄 Session 7: Layout Components (2h) - NEXT
- 📅 Session 8-16: Remaining Phase 1 sessions

---

**Bismillah! Let's keep building! 🚀**
