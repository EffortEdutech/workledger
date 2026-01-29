# SESSION 9 PREPARATION - PROJECT MANAGEMENT

**Date:** January 30, 2026  
**Session:** 9 of 16 (Phase 1 - Week 2)  
**Duration:** 3 hours  
**Focus:** Complete Project Management System

---

## 📋 QUICK CONTEXT

### What Was Completed in Session 8

**✅ Delivered (11 files, ~2,500 lines):**
1. Complete organization CRUD service
2. Dashboard with real-time stats from database
3. Organization list, create, and settings pages
4. Basic project and contract services (for dashboard counts)
5. Stats cards and activity feed components
6. Home icon in header for navigation

**✅ Test Data Inserted:**
- 2 Organizations (Bina Jaya Engineering, Effort Edutech)
- 3 Projects (KLCC, Ipoh Industrial, School System)
- 3 Contracts (CMC, PMC, SLA)
- 2 Templates (PMC Daily, SLA Incident)

**⚠️ Critical Info:**
- RLS is DISABLED temporarily (infinite recursion issue)
- User ID: `26c9345a-7ea9-499b-a76f-b0d71ebade5b`
- User Email: `effort.edutech@gmail.com`
- Dashboard shows: 2 orgs, 3 projects, 3 contracts, 0 work entries

---

## 🎯 SESSION 9 OBJECTIVES

### What We're Building

**Complete Project Management System:**
1. Expand projectService with full CRUD
2. Create project components (Form, Card, List)
3. Create project pages (List, New, Edit, Detail)
4. Add project routes to router
5. Test with existing 3 projects
6. Enable create, edit, delete, filter, sort

---

## 📊 TEST DATA AVAILABLE

### Projects in Database (3 total)

**1. KLCC Facilities Management**
- **ID:** f07dc713-5176-4e53-8fda-68f22f6973ce
- **Code:** PRJ-2024-001
- **Organization:** Bina Jaya Engineering (30594740-5838-41f7-86d6-2e13986bd017)
- **Client:** Petronas Twin Towers Management
- **Location:** Kuala Lumpur City Centre, 50088 Kuala Lumpur
- **Dates:** 2024-01-01 to 2026-12-31
- **Status:** active
- **Tags:** facilities, high-rise, hvac
- **Contact:** Ahmad bin Hassan (Project Manager, +60123456789)

**2. Ipoh Industrial Park Maintenance**
- **ID:** f21d68e5-fd92-40ab-b537-209a32d65adc
- **Code:** PRJ-2024-002
- **Organization:** Bina Jaya Engineering
- **Client:** Perak Development Corporation
- **Location:** Jalan Jelapang, 30020 Ipoh, Perak
- **Dates:** 2024-03-01 to 2025-02-28
- **Status:** active
- **Tags:** industrial, preventive, electrical
- **Contact:** Lee Chong Wei (Site Supervisor, +60125554321)

**3. School Management System**
- **ID:** d77253e3-37b3-4f39-aba4-5c4483115bfb
- **Code:** PRJ-2024-003
- **Organization:** Effort Edutech (68c35e9e-d130-44fa-9e56-c73156b849a6)
- **Client:** Ministry of Education Malaysia
- **Location:** Putrajaya Federal Territory
- **Dates:** 2024-06-01 to 2025-05-31
- **Status:** active
- **Tags:** software, education, saas
- **Contact:** Dr. Siti Nurhaliza (Product Owner, +60123337777)

### Organizations (2 total)

**1. Bina Jaya Engineering**
- **ID:** 30594740-5838-41f7-86d6-2e13986bd017
- **Slug:** bina-jaya-engineering
- **Projects:** 2 (KLCC, Ipoh)

**2. Effort Edutech**
- **ID:** 68c35e9e-d130-44fa-9e56-c73156b849a6
- **Slug:** effort-edutech
- **Projects:** 1 (School System)

---

## 📁 FILES TO REFERENCE

### Existing Files (Don't Recreate)

**Services:**
- `src/services/api/organizationService.js` - Reference for service patterns
- `src/services/api/projectService.js` - **EXPAND THIS** (has getProjectsCount, getUserProjects)
- `src/services/supabase/client.js` - Supabase client
- `src/services/supabase/auth.js` - Auth helpers

**Components (Reuse):**
- `src/components/common/Button.jsx`
- `src/components/common/Input.jsx`
- `src/components/common/Select.jsx`
- `src/components/common/Modal.jsx`
- `src/components/common/LoadingSpinner.jsx`

**Layout:**
- `src/components/layout/AppLayout.jsx` - Main layout
- `src/components/layout/Sidebar.jsx` - Has "Projects" link

**Reference Pages:**
- `src/pages/organizations/OrganizationList.jsx` - Pattern for list pages
- `src/pages/organizations/NewOrganization.jsx` - Pattern for create pages
- `src/pages/organizations/OrganizationSettings.jsx` - Pattern for detail/edit pages

**Router:**
- `src/router.jsx` - Add project routes here

---

## 🔧 DATABASE SCHEMA REFERENCE

### Projects Table Structure

```sql
projects (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  project_name TEXT NOT NULL,
  project_code TEXT UNIQUE,
  client_name TEXT NOT NULL,
  site_address TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, on_hold, cancelled
  metadata JSONB, -- {tags, notes, contacts}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ -- soft delete
)
```

**Metadata JSONB Structure:**
```json
{
  "tags": ["facilities", "high-rise", "hvac"],
  "notes": "Project-specific notes",
  "contacts": [
    {
      "name": "Ahmad bin Hassan",
      "role": "Project Manager",
      "phone": "+60123456789"
    }
  ]
}
```

---

## 🏗️ IMPLEMENTATION PLAN

### Step 1: Expand projectService.js (30 min)

Add these methods to existing service:

```javascript
// Already has:
// - getProjectsCount()
// - getUserProjects()

// Need to add:
async createProject(organizationId, data) {
  // Validate user is member of organization
  // Insert project
  // Return { success, data, error }
}

async getProject(id) {
  // Fetch single project
  // Include organization details
  // Check user has access
}

async updateProject(id, data) {
  // Update project
  // Only if user has permission
}

async deleteProject(id) {
  // Soft delete (set deleted_at)
  // Only if user has permission
}
```

### Step 2: Create ProjectForm Component (45 min)

**Features:**
- Organization selector (dropdown)
- Project name (required)
- Project code (auto-generated or manual)
- Client name (required)
- Site address (textarea)
- Start date (date picker)
- End date (date picker)
- Status (select: active, completed, on_hold, cancelled)
- Tags (comma-separated or tag input)
- Notes (textarea)
- Contacts (repeatable fields: name, role, phone)
- Save button
- Cancel button

**Validation:**
- Project name: required, min 3 chars
- Client name: required
- Organization: required
- Dates: end_date > start_date

### Step 3: Create ProjectCard Component (20 min)

**Display:**
- Project name (bold)
- Project code (badge)
- Client name (subtitle)
- Status badge (colored)
- Date range
- Organization name (small text)
- Action buttons (View, Edit, Delete)

**Colors by Status:**
- active: green
- completed: blue
- on_hold: yellow
- cancelled: gray

### Step 4: Create ProjectList Component (30 min)

**Features:**
- Grid layout (responsive: 1/2/3 columns)
- Filter by organization (dropdown)
- Filter by status (checkboxes)
- Sort by: name, date, status
- Empty state ("No projects yet")
- Loading state
- "New Project" button

### Step 5: Create Project Pages (45 min)

**ProjectListPage.jsx:**
- Load projects with organizationService.getUserOrganizations()
- Display ProjectList component
- "New Project" button in header
- Organization filter dropdown
- Status filter section

**NewProject.jsx:**
- ProjectForm component
- Submit → createProject()
- Success → redirect to /projects
- Error → show error message

**EditProject.jsx:**
- Load project data
- Pre-fill ProjectForm
- Submit → updateProject()
- Success → redirect to /projects/:id
- Cancel → go back

**ProjectDetail.jsx:**
- Display project information
- Show metadata (tags, notes, contacts)
- "Edit" button → /projects/:id/edit
- "Delete" button → soft delete with confirmation
- Contracts section (preview for Session 10)
- Action buttons

### Step 6: Update Router (10 min)

```javascript
// Add routes
{
  path: '/projects',
  element: <ProtectedRoute><ProjectListPage /></ProtectedRoute>
},
{
  path: '/projects/new',
  element: <ProtectedRoute><NewProject /></ProtectedRoute>
},
{
  path: '/projects/:id',
  element: <ProtectedRoute><ProjectDetail /></ProtectedRoute>
},
{
  path: '/projects/:id/edit',
  element: <ProtectedRoute><EditProject /></ProtectedRoute>
}
```

### Step 7: Testing (20 min)

**Test Cases:**
1. Navigate to /projects → See 3 existing projects
2. Click project → View details (KLCC, Ipoh, School)
3. Filter by organization → See filtered projects
4. Filter by status → All should be "active"
5. Create new project → Success
6. Edit project → Changes saved
7. Delete project → Soft deleted (deleted_at set)
8. Dashboard → Project count updates

---

## 🎨 UI/UX GUIDELINES

### Design Patterns

**Follow Organization Pages Pattern:**
- Same card layout style
- Same button styles
- Same form layout
- Same empty states
- Same loading states

**Color Coding:**
- Primary actions: Blue (#3B82F6)
- Status active: Green (#10B981)
- Status completed: Blue (#3B82F6)
- Status on_hold: Yellow (#F59E0B)
- Status cancelled: Gray (#6B7280)

**Responsive:**
- Mobile: 1 column grid
- Tablet: 2 columns
- Desktop: 3 columns

---

## ⚠️ IMPORTANT NOTES

### RLS is Disabled

**Current State:**
- All tables have RLS disabled
- Queries work without permission checks
- This is TEMPORARY for development

**What This Means:**
- You don't need to worry about RLS policies
- Just filter by user's organizations manually in queries
- We'll fix RLS in a dedicated session later

### User Context

**Always filter by user's organizations:**
```javascript
// Get user's org IDs first
const { data: memberships } = await supabase
  .from('org_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .eq('is_active', true);

const orgIds = memberships.map(m => m.organization_id);

// Then filter projects
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .in('organization_id', orgIds);
```

### Soft Delete Pattern

**Never hard delete:**
```javascript
// ❌ Don't do this
await supabase.from('projects').delete().eq('id', projectId);

// ✅ Do this instead
await supabase
  .from('projects')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', projectId);
```

**Filter out deleted:**
```javascript
// Always add this filter
.is('deleted_at', null)
```

---

## 📝 CODE PATTERNS

### Service Method Template

```javascript
async createProject(organizationId, data) {
  try {
    console.log('📊 Creating project:', data.project_name);

    // Validate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: 'Not authenticated' };
    }

    // Check user is member of organization
    const role = await organizationService.getUserRole(organizationId, user.id);
    if (!role) {
      return { success: false, data: null, error: 'Not a member of this organization' };
    }

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        organization_id: organizationId,
        project_name: data.project_name,
        project_code: data.project_code,
        client_name: data.client_name,
        site_address: data.site_address,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status || 'active',
        metadata: data.metadata || {},
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Project creation error:', error);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Project created:', project.id);
    return { success: true, data: project, error: null };
  } catch (error) {
    console.error('❌ Exception creating project:', error);
    return { success: false, data: null, error: error.message };
  }
}
```

### Component Template (ProjectCard)

```javascript
export function ProjectCard({ project, onEdit, onDelete, onView }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      {/* Project name */}
      <h3 className="text-lg font-semibold text-gray-900">
        {project.project_name}
      </h3>
      
      {/* Project code badge */}
      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
        {project.project_code}
      </span>
      
      {/* Client name */}
      <p className="mt-2 text-sm text-gray-600">
        {project.client_name}
      </p>
      
      {/* Status badge */}
      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${statusColors[project.status]}`}>
        {project.status}
      </span>
      
      {/* Date range */}
      <p className="mt-2 text-sm text-gray-500">
        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
      </p>
      
      {/* Actions */}
      <div className="mt-4 flex space-x-2">
        <button onClick={() => onView(project.id)} className="text-sm text-primary-600">
          View
        </button>
        <button onClick={() => onEdit(project.id)} className="text-sm text-gray-600">
          Edit
        </button>
        <button onClick={() => onDelete(project.id)} className="text-sm text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}
```

---

## ✅ SUCCESS CRITERIA

**Session 9 is complete when:**

1. ✅ Can view list of 3 existing projects
2. ✅ Can view details of each project
3. ✅ Can create new project
4. ✅ Can edit existing project
5. ✅ Can delete project (soft delete)
6. ✅ Can filter by organization
7. ✅ Can filter by status
8. ✅ Dashboard project count updates after create/delete
9. ✅ All 8 files created and working
10. ✅ No console errors

---

## 🚀 GETTING STARTED

**Step 1: Review existing code**
- Look at organizationService.js for service patterns
- Look at OrganizationList.jsx for page patterns
- Look at NewOrganization.jsx for form patterns

**Step 2: Start with projectService.js**
- Expand the existing file
- Add create, get, update, delete methods
- Test each method in console

**Step 3: Build components bottom-up**
- ProjectCard (simplest)
- ProjectForm (most complex)
- ProjectList (uses ProjectCard)

**Step 4: Build pages**
- ProjectListPage (uses ProjectList)
- NewProject (uses ProjectForm)
- EditProject (uses ProjectForm)
- ProjectDetail (displays data)

**Step 5: Wire up router**
- Add 4 routes
- Test navigation

**Step 6: Test everything**
- Go through all test cases
- Fix any bugs
- Update dashboard if needed

---

## 📚 REFERENCE DOCUMENTS

**In Project Knowledge:**
- `WORKLEDGER_GUIDELINE_FINAL.md` - Overall architecture
- `RBAC_GUIDE.md` - Permission patterns (reference only, RLS disabled)
- `29Jan2026_Database_Schema_Supabase` - Full database schema
- `260129_DEVELOPMENT_CHECKLIST_UPDATED.md` - This session's checklist

**Created in Session 8:**
- `SESSION_8_SUMMARY.md` - What was completed
- `DATABASE_FIX_PLAN.md` - RLS issue explanation
- `DASHBOARD_FIX_SUMMARY.md` - Dashboard stats fix

---

## 💡 TIPS FOR SUCCESS

1. **Start small** - Get one method working before moving to the next
2. **Test frequently** - Test each component as you build it
3. **Reuse patterns** - Copy from organization pages and adapt
4. **Use existing test data** - Don't create new projects manually, use the UI!
5. **Console log everything** - Makes debugging much easier
6. **Check dashboard** - Verify project count updates correctly

---

## 🎯 EXPECTED DELIVERABLES

**Files to Create (8 files):**
1. `src/services/api/projectService.js` (EXPAND - ~300 lines)
2. `src/components/projects/ProjectForm.jsx` (~250 lines)
3. `src/components/projects/ProjectCard.jsx` (~150 lines)
4. `src/components/projects/ProjectList.jsx` (~200 lines)
5. `src/pages/projects/ProjectListPage.jsx` (~200 lines)
6. `src/pages/projects/NewProject.jsx` (~150 lines)
7. `src/pages/projects/EditProject.jsx` (~180 lines)
8. `src/pages/projects/ProjectDetail.jsx` (~250 lines)
9. `src/router.jsx` (UPDATE - add 4 routes)

**Total:** ~1,500 lines of code

**Time Estimate:** 3 hours
- Services: 30 min
- Components: 95 min
- Pages: 65 min
- Router + Testing: 30 min

---

## 🙏 FINAL NOTES

**Bismillah! You're ready for Session 9!**

**What Makes This Session Great:**
- ✅ You have real test data (3 projects)
- ✅ Services are scaffolded
- ✅ Patterns established from Session 8
- ✅ Dashboard ready to reflect changes
- ✅ No RLS blocking you

**Remember:**
- This builds on Session 8 patterns
- Reuse existing components (Button, Input, etc.)
- Follow the same structure as organizations
- Test with your 3 real projects
- Console log everything for debugging

**You got this, Eff! 💪**

---

**Prepared:** January 29, 2026 - 11:45 PM  
**For:** Session 9 - Project Management  
**By:** AI Assistant  
**Status:** Ready to start! 🚀
