# WORKLEDGER: DEVELOPMENT GUIDELINE (FINAL ALIGNED)
## Contract-Aware, Offline-First Work Reporting Platform

**Version:** 2.1 (Maintenance Templates Integrated)  
**Date:** January 25, 2026  
**Based On:** Contract Diary Platform + Platform Master Guideline + Malaysian Maintenance Industry  
**Target:** Multi-Industry Work Reporting (Construction, Maintenance, Facilities, IT, Services)  
**Budget:** Zero-Budget / Free-Tier Services  

---

## 📋 TABLE OF CONTENTS

1. [Platform Core Principles](#1-platform-core-principles)
2. [Target Industries & Contract Types](#2-target-industries--contract-types)
3. [Technology Stack](#3-technology-stack)
4. [Domain Model & Hierarchy](#4-domain-model--hierarchy)
5. [RBAC System](#5-rbac-system)
6. [Template System & Pre-Built Templates](#6-template-system--pre-built-templates)
7. [Work Entry Lifecycle](#7-work-entry-lifecycle)
8. [Offline-First Architecture](#8-offline-first-architecture)
9. [GUI Structure & Design](#9-gui-structure--design)
10. [Database Design](#10-database-design)
11. [Report Generation](#11-report-generation)
12. [Security & RLS Framework](#12-security--rls-framework)
13. [MVP Development Phases](#13-mvp-development-phases)
14. [Pre-Built Template Library](#14-pre-built-template-library)
15. [Decision-Making Filter](#15-decision-making-filter)

---

## 1. PLATFORM CORE PRINCIPLES

### 1.1 The Golden Rule

> **Templates + Offline + RBAC = Scalable Multi-Industry Reporting**

Every decision must pass through this filter:
- ✅ Does it help users report work faster?
- ✅ Does it work offline?
- ✅ Does it respect RBAC?
- ✅ Does it avoid database schema changes? (Use templates instead)
- ✅ Does it keep costs at zero?

**If any answer is "no", defer it.**

### 1.2 What We're Actually Building

**NOT:** "A reporting app"  
**YES:** A contract-aware, offline-first reporting infrastructure for real work in the real world

### 1.3 Core Value Propositions

**For Workers/Technicians:**
- Record work on site (even without internet)
- Attach photos as proof of work
- Simple, guided data entry
- Template-driven forms (no training needed)

**For Managers:**
- Contract-specific reporting rules enforced automatically
- Approve/reject work entries
- Generate client-ready reports instantly
- Track SLA compliance

**For Clients:**
- Professional, branded reports
- Real-time visibility (when online)
- Evidence-backed work records
- Audit trail guaranteed

**For Organizations:**
- Support multiple contract types (PMC, CMC, AMC, SLA, etc.)
- Reduce admin friction by 70%
- Eliminate reporting inconsistency
- Scale across construction, maintenance, facilities, IT
- Zero additional infrastructure cost

---

## 2. TARGET INDUSTRIES & CONTRACT TYPES

### 2.1 Target Users

**Primary Users:**
- Freelancers (solo technicians, contractors)
- SMEs (maintenance companies, service providers)
- Facility Management Companies
- Construction Subcontractors
- IT Service Providers
- Enterprises (multi-site operations)

### 2.2 Industries Supported

| Industry | Contract Types | Report Focus |
|----------|---------------|--------------|
| **Construction** | Daily works, progress claims | Daily diary, BOQ progress, variations |
| **Facility Maintenance** | AMC, PMC, CMC | Preventive checklists, breakdown reports |
| **M&E Services** | PPM, SLA, T&M | Equipment logs, response time, KPIs |
| **IT Services** | SLA, retainer, subscription | Incident reports, uptime metrics |
| **Property Management** | Comprehensive, on-call | Monthly summaries, tenant requests |
| **Industrial Plant** | Performance-based, predictive | Asset health, downtime tracking |
| **Infrastructure** | Outcome-based, multi-year | Compliance reports, inspection logs |

### 2.3 Contract Type Taxonomy (Malaysian Market)

#### **By Contract Structure:**

| Type | Description | Report Template | Common Names |
|------|-------------|-----------------|--------------|
| **Preventive Maintenance (PMC)** | Scheduled inspections, reduces breakdowns | Checklist + photos | PMC, PPM, Scheduled Maintenance |
| **Corrective Maintenance** | Reactive, work after failure | Incident + root cause | Breakdown, Reactive, Ad-hoc |
| **Comprehensive (CMC)** | Preventive + Corrective + Parts | Monthly summary | CMC, Full Scope, TMR |
| **Non-Comprehensive** | Labor only, parts excluded | Service report + parts recommendation | Non-Comprehensive AMC, Labour-Only |
| **Annual Maintenance (AMC)** | 1-year renewable, most common | Monthly AMC summary | AMC, Annual Service Contract |

#### **By Service Level:**

| Type | Description | Report Focus |
|------|-------------|--------------|
| **SLA-Based** | Response time, penalties | KPI + compliance metrics |
| **Performance-Based** | Payment tied to uptime/efficiency | Performance dashboard |
| **Outcome-Based** | Client pays for results | Results vs targets |

#### **By Pricing Model:**

| Type | Description | Report Needs |
|------|-------------|--------------|
| **Fixed-Price (Lump Sum)** | Fixed monthly/yearly fee | Standard activity log |
| **Time & Material (T&M)** | Pay for hours + materials | Detailed time tracking + cost |
| **Pay-Per-Visit** | Cost per service visit | Visit log + invoice |
| **Retainer/Subscription** | Monthly subscription | Hours used vs allocation |

#### **By Duration:**

- **Short-Term** (3-6 months) - Trial contracts
- **Annual** (1 year) - Most common (AMC)
- **Multi-Year** (2-5 years) - Infrastructure contracts

#### **Special Types:**

- **On-Call/Emergency** - 24/7 availability, emergency response
- **Condition-Based** - Work triggered by sensor data
- **Predictive** - IoT + AI monitoring
- **Warranty + Maintenance** - Extended warranty contracts

### 2.4 Quick Reference: Malaysian Contract Names

| Short Name | Full Name | Used By |
|------------|-----------|---------|
| AMC | Annual Maintenance Contract | Private / Govt |
| PPM | Planned Preventive Maintenance | Facilities |
| CMC | Comprehensive Maintenance Contract | M&E |
| SLA | Service Level Agreement | IT / Critical systems |
| T&M | Time & Material Contract | Ad-hoc works |
| On-Call | On-Call Maintenance Contract | Utilities |
| TMR | Total Maintenance Responsibility | Industrial |
| PBC | Performance-Based Contract | Infrastructure |

---

## 3. TECHNOLOGY STACK

### 3.1 Core Stack (Zero Budget, Intentional)

| Layer | Technology | Reason | Free Tier |
|-------|-----------|--------|-----------|
| **Frontend** | React 18 (Vite) | Fast, flexible, proven in Contract Diary | ✅ Forever |
| **Styling** | Tailwind CSS | Rapid UI, consistent design system | ✅ Forever |
| **Backend** | Supabase | Auth + DB + Storage + RLS | ✅ 500MB DB |
| **Auth** | Supabase Auth | Enterprise-grade, free | ✅ Unlimited |
| **Database** | PostgreSQL (JSONB) | Template-driven, flexible | ✅ Included |
| **Storage** | Supabase Storage | Private buckets, signed URLs | ✅ 1GB |
| **Hosting** | Vercel | Auto-deploy, edge network | ✅ Unlimited |
| **Offline** | PWA + IndexedDB | On-site usability | ✅ Browser native |
| **PDF** | jsPDF + AutoTable | Client-side, no server cost | ✅ Forever |

**No paid services. No vendor lock-in.**

### 3.2 Key Libraries

```javascript
{
  // Core (from Contract Diary)
  "react": "^18.2.0",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x",
  
  // Offline (from Contract Diary)
  "dexie": "^3.x",           // IndexedDB wrapper
  "workbox-webpack-plugin": "^7.x",  // Service Worker
  
  // PDF (Platform Master requirement)
  "jspdf": "^2.x",           // Client-side PDF
  "jspdf-autotable": "^3.x", // Tables in PDF
  
  // Forms & Validation
  "react-hook-form": "^7.x",
  "zod": "^3.x",             // Schema validation
  
  // Utilities
  "date-fns": "^2.x",
  "lodash": "^4.x"
}
```

---

## 4. DOMAIN MODEL & HIERARCHY

### 4.1 Entity Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    ORGANIZATION                          │
│  - name, settings                                        │
│  - storage_quota, user_limit                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ has many
                  ▼
┌─────────────────────────────────────────────────────────┐
│                      PROJECT                             │
│  - project_name, client_name                             │
│  - start_date, end_date                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ has many
                  ▼
┌─────────────────────────────────────────────────────────┐
│                     CONTRACT                             │
│  - contract_number, contract_type                        │
│  - contract_category (PMC/CMC/AMC/SLA/etc.)             │
│  - reporting_frequency (daily/weekly/monthly)            │
│  - requires_approval (boolean)                           │
│  - sla_response_time_mins (if applicable)                │
│  - template_id (CRITICAL)                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ uses
                  ▼
┌─────────────────────────────────────────────────────────┐
│                     TEMPLATE                             │
│  - template_name, industry                               │
│  - contract_category (PMC/CMC/AMC/etc.)                 │
│  - fields_schema (JSONB) ← defines what to collect       │
│  - validation_rules (JSONB)                              │
│  - pdf_layout (JSONB) ← defines how to render            │
│  - version, is_locked                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ defines structure for
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   WORK ENTRY                             │
│  - entry_date, shift                                     │
│  - data (JSONB) ← actual collected data                  │
│  - status (draft/submitted/approved/rejected)            │
│  - sla_response_actual_mins (if applicable)              │
│  - created_by, approved_by                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ has many
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   ATTACHMENTS                            │
│  - file_type (photo/document/signature)                  │
│  - storage_path, file_size                               │
│  - metadata (JSONB)                                      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Contract Type Mapping

```javascript
// Contract categories supported
const CONTRACT_CATEGORIES = {
  // Construction
  CONSTRUCTION_DAILY: 'construction-daily-diary',
  CONSTRUCTION_PROGRESS: 'construction-progress-claim',
  
  // Maintenance (Most Common)
  PMC: 'preventive-maintenance',        // Preventive
  CORRECTIVE: 'corrective-maintenance',  // Breakdown
  CMC: 'comprehensive-maintenance',      // Comprehensive
  NON_COMPREHENSIVE: 'non-comprehensive-maintenance',
  AMC: 'annual-maintenance',             // Most common in Malaysia
  
  // Service Level
  SLA_BASED: 'sla-based-maintenance',
  PERFORMANCE_BASED: 'performance-based-maintenance',
  OUTCOME_BASED: 'outcome-based-maintenance',
  
  // Special
  EMERGENCY: 'emergency-on-call',
  T_AND_M: 'time-and-material',
  RETAINER: 'retainer-subscription',
  
  // IT Services
  IT_INCIDENT: 'it-incident-report',
  IT_SLA: 'it-sla-compliance',
  
  // Generic
  CUSTOM: 'custom-template'
};
```

---

## 5. RBAC SYSTEM

### 5.1 User Roles (Platform Master Specification)

| Role | Description | Scope | Key Permissions |
|------|-------------|-------|-----------------|
| **Super Admin** | Platform owner | Global | Manage organizations, billing, system settings |
| **Org Admin** | Organization owner | Organization-wide | Manage org users, projects, templates |
| **Manager** | Project/Contract manager | Project-level | Manage contracts, approve entries, view reports |
| **Worker** | Technician/Field worker | Contract-level | Create entries, attach files, view own work |
| **Client** | External stakeholder | Read-only | View reports, download PDFs |

### 5.2 Permission Matrix

| Action | Super Admin | Org Admin | Manager | Worker | Client |
|--------|-------------|-----------|---------|--------|--------|
| **Work Entries** |
| Create entry | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own draft | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit entry | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve entry | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all entries | ✅ | ✅ | ✅ | ⚠️ (own only) | ✅ (assigned) |
| **Reports** |
| Generate report | ✅ | ✅ | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ | ⚠️ (own only) | ✅ (assigned) |
| Download PDF | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 6. TEMPLATE SYSTEM & PRE-BUILT TEMPLATES

### 6.1 Template Structure Overview

Templates are the **core intellectual property** that makes WorkLedger flexible:

1. **Define what data is collected** (field schema)
2. **Define how it is validated** (validation rules)
3. **Define how it is rendered in PDF** (layout configuration)
4. **Avoid database schema changes** (all stored as JSONB)

### 6.2 Template Categories

```javascript
const TEMPLATE_CATEGORIES = {
  CONSTRUCTION: 'construction',
  MAINTENANCE: 'maintenance',
  FACILITIES: 'facilities',
  IT_SERVICES: 'it-services',
  PROPERTY: 'property-management',
  INDUSTRIAL: 'industrial',
  CUSTOM: 'custom'
};
```

### 6.3 Complete Template Example: Preventive Maintenance Contract (PMC)

```javascript
{
  "template_id": "pmc-preventive-maintenance-v1",
  "template_name": "Preventive Maintenance Report",
  "industry": "maintenance",
  "contract_category": "PMC",
  "version": "1.0",
  "is_locked": false,
  "is_public": true,
  
  // SECTION 1: Field Schema (what to collect)
  "fields_schema": {
    "sections": [
      {
        "section_id": "header",
        "section_name": "Header Information",
        "required": true,
        "fields": [
          {
            "field_id": "contract_no",
            "field_name": "Contract No",
            "field_type": "text",
            "required": true,
            "prefill_from": "contract.contract_number"
          },
          {
            "field_id": "client_name",
            "field_name": "Client / Site Name",
            "field_type": "text",
            "required": true,
            "prefill_from": "contract.client_name"
          },
          {
            "field_id": "asset_category",
            "field_name": "Asset Category",
            "field_type": "select",
            "required": true,
            "options": ["HVAC", "Lift", "Pump", "Server", "Generator", "Chiller", "Fire Protection", "Other"]
          },
          {
            "field_id": "asset_id",
            "field_name": "Asset ID / Tag No",
            "field_type": "text",
            "required": true
          },
          {
            "field_id": "maintenance_cycle",
            "field_name": "Maintenance Cycle",
            "field_type": "select",
            "required": true,
            "options": ["Weekly", "Monthly", "Quarterly", "Semi-Annual", "Annual"]
          },
          {
            "field_id": "date_time",
            "field_name": "Date & Time",
            "field_type": "datetime",
            "required": true,
            "default_value": "now"
          },
          {
            "field_id": "technician_names",
            "field_name": "Technician Name(s)",
            "field_type": "text",
            "required": true,
            "prefill_from": "user.full_name"
          }
        ]
      },
      
      {
        "section_id": "scope_checklist",
        "section_name": "Scope Checklist",
        "required": true,
        "fields": [
          {
            "field_id": "visual_inspection",
            "field_name": "Visual inspection",
            "field_type": "checkbox",
            "default_value": false
          },
          {
            "field_id": "cleaning",
            "field_name": "Cleaning",
            "field_type": "checkbox",
            "default_value": false
          },
          {
            "field_id": "lubrication",
            "field_name": "Lubrication",
            "field_type": "checkbox",
            "default_value": false
          },
          {
            "field_id": "calibration",
            "field_name": "Calibration",
            "field_type": "checkbox",
            "default_value": false
          },
          {
            "field_id": "tightening",
            "field_name": "Tightening",
            "field_type": "checkbox",
            "default_value": false
          },
          {
            "field_id": "functional_test",
            "field_name": "Functional test",
            "field_type": "checkbox",
            "default_value": false
          }
        ]
      },
      
      {
        "section_id": "findings",
        "section_name": "Findings",
        "required": true,
        "fields": [
          {
            "field_id": "condition_status",
            "field_name": "Condition Status",
            "field_type": "radio",
            "required": true,
            "options": ["Good", "Fair", "Requires Attention"]
          },
          {
            "field_id": "findings_details",
            "field_name": "Findings Details",
            "field_type": "textarea",
            "required": false,
            "max_length": 1000,
            "ai_assist": true,
            "ai_prompt": "Summarize findings based on checklist and condition status"
          }
        ]
      },
      
      {
        "section_id": "photos",
        "section_name": "Photos",
        "required": false,
        "fields": [
          {
            "field_id": "photo_before",
            "field_name": "Before Maintenance",
            "field_type": "photo",
            "required": false,
            "max_count": 5
          },
          {
            "field_id": "photo_after",
            "field_name": "After Maintenance",
            "field_type": "photo",
            "required": false,
            "max_count": 5
          }
        ]
      },
      
      {
        "section_id": "remarks",
        "section_name": "Remarks / Recommendations",
        "required": false,
        "fields": [
          {
            "field_id": "remarks_text",
            "field_name": "Remarks",
            "field_type": "textarea",
            "required": false,
            "max_length": 2000,
            "ai_assist": true,
            "ai_prompt": "Generate recommendations based on condition status and findings"
          }
        ]
      },
      
      {
        "section_id": "client_acknowledgement",
        "section_name": "Client Acknowledgement",
        "required": false,
        "fields": [
          {
            "field_id": "client_name",
            "field_name": "Name",
            "field_type": "text",
            "required": false
          },
          {
            "field_id": "client_signature",
            "field_name": "Signature",
            "field_type": "signature",
            "required": false
          },
          {
            "field_id": "acknowledgement_date",
            "field_name": "Date",
            "field_type": "date",
            "required": false,
            "default_value": "today"
          }
        ]
      }
    ]
  },
  
  // SECTION 2: Validation Rules
  "validation_rules": {
    "conditional_required": [
      {
        "if": "findings.condition_status === 'Requires Attention'",
        "then_required": ["findings.findings_details", "remarks.remarks_text"]
      }
    ]
  },
  
  // SECTION 3: PDF Layout
  "pdf_layout": {
    "page_size": "A4",
    "orientation": "portrait",
    "header": {
      "show_logo": true,
      "show_org_name": true,
      "title": "Preventive Maintenance Report"
    },
    "sections": [
      {
        "section_id": "header",
        "layout": "two_column",
        "fields": ["contract_no", "client_name", "asset_category", "asset_id", "maintenance_cycle", "date_time", "technician_names"]
      },
      {
        "section_id": "scope_checklist",
        "layout": "checklist",
        "show_checked_only": false
      },
      {
        "section_id": "findings",
        "layout": "single_column"
      },
      {
        "section_id": "photos",
        "layout": "photo_grid",
        "columns": 2
      },
      {
        "section_id": "remarks",
        "layout": "single_column"
      },
      {
        "section_id": "client_acknowledgement",
        "layout": "signature_box"
      }
    ],
    "footer": {
      "show_signatures": true,
      "signature_roles": ["worker", "manager"],
      "show_page_numbers": true
    }
  },
  
  // SECTION 4: Metadata
  "metadata": {
    "created_by": "system",
    "recommended_for": ["maintenance", "facilities"],
    "approval_required": true,
    "offline_capable": true,
    "estimated_completion_time": "15-30 minutes",
    "common_names": ["PMC", "PPM", "Scheduled Maintenance"]
  }
}
```

### 6.4 Complete Template Example: SLA-Based Maintenance

```javascript
{
  "template_id": "sla-maintenance-v1",
  "template_name": "SLA Compliance Report",
  "industry": "maintenance",
  "contract_category": "SLA",
  "version": "1.0",
  
  "fields_schema": {
    "sections": [
      {
        "section_id": "header",
        "section_name": "SLA Information",
        "fields": [
          {
            "field_id": "sla_tier",
            "field_name": "SLA Tier",
            "field_type": "select",
            "required": true,
            "options": ["Gold", "Silver", "Bronze"]
          },
          {
            "field_id": "incident_priority",
            "field_name": "Incident Priority",
            "field_type": "select",
            "required": true,
            "options": ["P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"]
          },
          {
            "field_id": "incident_id",
            "field_name": "Incident ID",
            "field_type": "text",
            "required": true,
            "auto_generate": true
          }
        ]
      },
      
      {
        "section_id": "response_metrics",
        "section_name": "Response Metrics",
        "fields": [
          {
            "field_id": "sla_response_time_mins",
            "field_name": "SLA Response Time (minutes)",
            "field_type": "number",
            "required": true,
            "prefill_from": "contract.sla_response_time_mins"
          },
          {
            "field_id": "call_received_time",
            "field_name": "Call Received Time",
            "field_type": "datetime",
            "required": true
          },
          {
            "field_id": "arrival_time",
            "field_name": "Arrival Time",
            "field_type": "datetime",
            "required": true
          },
          {
            "field_id": "actual_response_time_mins",
            "field_name": "Actual Response Time (minutes)",
            "field_type": "number",
            "required": true,
            "auto_calculate": true,
            "formula": "MINUTES_BETWEEN(call_received_time, arrival_time)"
          },
          {
            "field_id": "sla_met_response",
            "field_name": "SLA Met (Response)",
            "field_type": "radio",
            "required": true,
            "options": ["Yes", "No"],
            "auto_calculate": true,
            "formula": "actual_response_time_mins <= sla_response_time_mins"
          }
        ]
      },
      
      {
        "section_id": "resolution_metrics",
        "section_name": "Resolution Metrics",
        "fields": [
          {
            "field_id": "sla_resolution_time_hours",
            "field_name": "SLA Resolution Time (hours)",
            "field_type": "number",
            "required": true
          },
          {
            "field_id": "issue_resolved_time",
            "field_name": "Issue Resolved Time",
            "field_type": "datetime",
            "required": true
          },
          {
            "field_id": "actual_resolution_time_hours",
            "field_name": "Actual Resolution Time (hours)",
            "field_type": "number",
            "required": true,
            "auto_calculate": true,
            "formula": "HOURS_BETWEEN(call_received_time, issue_resolved_time)"
          },
          {
            "field_id": "sla_met_resolution",
            "field_name": "SLA Met (Resolution)",
            "field_type": "radio",
            "required": true,
            "options": ["Yes", "No"],
            "auto_calculate": true
          }
        ]
      },
      
      {
        "section_id": "penalty",
        "section_name": "Penalty / Credit",
        "fields": [
          {
            "field_id": "penalty_applicable",
            "field_name": "Penalty Applicable",
            "field_type": "radio",
            "required": true,
            "options": ["Yes", "No"],
            "auto_calculate": true,
            "formula": "sla_met_response === 'No' OR sla_met_resolution === 'No'"
          },
          {
            "field_id": "penalty_amount",
            "field_name": "Penalty Amount (RM)",
            "field_type": "number",
            "required": false,
            "show_if": "penalty_applicable === 'Yes'"
          }
        ]
      },
      
      {
        "section_id": "incident_narrative",
        "section_name": "Incident Narrative",
        "fields": [
          {
            "field_id": "issue_description",
            "field_name": "Issue Description",
            "field_type": "textarea",
            "required": true,
            "max_length": 1000
          },
          {
            "field_id": "action_taken",
            "field_name": "Action Taken",
            "field_type": "textarea",
            "required": true,
            "max_length": 1000
          },
          {
            "field_id": "timeline",
            "field_name": "Timeline of Events",
            "field_type": "textarea",
            "required": false,
            "max_length": 2000
          }
        ]
      }
    ]
  },
  
  "validation_rules": {
    "alerts": [
      {
        "if": "sla_met_response === 'No'",
        "then_show": "⚠️ SLA breach detected - Response time exceeded",
        "severity": "warning"
      },
      {
        "if": "sla_met_resolution === 'No'",
        "then_show": "⚠️ SLA breach detected - Resolution time exceeded",
        "severity": "warning"
      }
    ]
  },
  
  "pdf_layout": {
    "header": {
      "title": "SLA Compliance Report",
      "show_logo": true
    },
    "sections": [
      {
        "section_id": "header",
        "layout": "two_column"
      },
      {
        "section_id": "response_metrics",
        "layout": "table",
        "highlight_if": "sla_met_response === 'No'",
        "highlight_color": "#fee2e2"
      },
      {
        "section_id": "resolution_metrics",
        "layout": "table",
        "highlight_if": "sla_met_resolution === 'No'",
        "highlight_color": "#fee2e2"
      },
      {
        "section_id": "penalty",
        "layout": "single_column",
        "show_if": "penalty_applicable === 'Yes'"
      },
      {
        "section_id": "incident_narrative",
        "layout": "single_column"
      }
    ]
  }
}
```

### 6.5 Complete Template Example: Comprehensive Maintenance (CMC) Monthly Summary

```javascript
{
  "template_id": "cmc-monthly-summary-v1",
  "template_name": "Comprehensive Maintenance Monthly Report",
  "industry": "maintenance",
  "contract_category": "CMC",
  "version": "1.0",
  "report_type": "monthly_summary",  // Different from daily reports
  
  "fields_schema": {
    "sections": [
      {
        "section_id": "header",
        "section_name": "Report Header",
        "fields": [
          {
            "field_id": "contract_period",
            "field_name": "Contract Period",
            "field_type": "text",
            "required": true,
            "prefill_from": "contract.period"
          },
          {
            "field_id": "site_name",
            "field_name": "Site Name",
            "field_type": "text",
            "required": true,
            "prefill_from": "contract.site_name"
          },
          {
            "field_id": "reporting_month",
            "field_name": "Reporting Month",
            "field_type": "month",
            "required": true,
            "default_value": "current_month"
          }
        ]
      },
      
      {
        "section_id": "summary_dashboard",
        "section_name": "Summary Dashboard",
        "auto_aggregate": true,  // Data pulled from work_entries
        "fields": [
          {
            "field_id": "preventive_visits_completed",
            "field_name": "Preventive Visits Completed",
            "field_type": "number",
            "auto_calculate": true,
            "formula": "COUNT(work_entries WHERE template_category='PMC' AND month=reporting_month)"
          },
          {
            "field_id": "breakdown_incidents",
            "field_name": "Breakdown Incidents",
            "field_type": "number",
            "auto_calculate": true,
            "formula": "COUNT(work_entries WHERE template_category='CORRECTIVE' AND month=reporting_month)"
          },
          {
            "field_id": "asset_availability_percent",
            "field_name": "Asset Availability (%)",
            "field_type": "number",
            "auto_calculate": true,
            "formula": "((total_hours - downtime_hours) / total_hours) * 100"
          }
        ]
      },
      
      {
        "section_id": "preventive_logs",
        "section_name": "Preventive Maintenance Logs",
        "table_type": "aggregated",  // Pull from multiple work_entries
        "fields": [
          {
            "field_id": "date",
            "field_name": "Date",
            "field_type": "date"
          },
          {
            "field_id": "asset",
            "field_name": "Asset",
            "field_type": "text"
          },
          {
            "field_id": "activity",
            "field_name": "Activity",
            "field_type": "text"
          },
          {
            "field_id": "status",
            "field_name": "Status",
            "field_type": "select",
            "options": ["Completed", "Pending", "Rescheduled"]
          }
        ]
      },
      
      {
        "section_id": "corrective_logs",
        "section_name": "Corrective Maintenance Logs",
        "table_type": "aggregated",
        "fields": [
          {
            "field_id": "breakdown_id",
            "field_name": "Breakdown ID",
            "field_type": "text"
          },
          {
            "field_id": "cause",
            "field_name": "Cause",
            "field_type": "text"
          },
          {
            "field_id": "resolution_time_hours",
            "field_name": "Resolution Time (hours)",
            "field_type": "number"
          }
        ]
      },
      
      {
        "section_id": "spare_parts",
        "section_name": "Spare Parts Consumption",
        "table_type": "manual_entry",
        "repeatable": true,
        "fields": [
          {
            "field_id": "item",
            "field_name": "Item",
            "field_type": "text",
            "required": true
          },
          {
            "field_id": "qty",
            "field_name": "Qty",
            "field_type": "number",
            "required": true
          },
          {
            "field_id": "cost",
            "field_name": "Cost (RM)",
            "field_type": "number",
            "required": true
          }
        ]
      },
      
      {
        "section_id": "compliance",
        "section_name": "Compliance Statement",
        "fields": [
          {
            "field_id": "compliance_text",
            "field_name": "Compliance Statement",
            "field_type": "textarea",
            "required": true,
            "default_value": "All works executed as per contract scope and specifications.",
            "max_length": 500
          }
        ]
      }
    ]
  },
  
  "pdf_layout": {
    "header": {
      "title": "Monthly Comprehensive Maintenance Report",
      "show_logo": true
    },
    "sections": [
      {
        "section_id": "header",
        "layout": "two_column"
      },
      {
        "section_id": "summary_dashboard",
        "layout": "metrics_cards",
        "columns": 3
      },
      {
        "section_id": "preventive_logs",
        "layout": "table",
        "show_totals": false
      },
      {
        "section_id": "corrective_logs",
        "layout": "table",
        "show_totals": false
      },
      {
        "section_id": "spare_parts",
        "layout": "table",
        "show_totals": true,
        "total_columns": ["cost"]
      },
      {
        "section_id": "compliance",
        "layout": "single_column"
      }
    ]
  }
}
```

### 6.6 Template Library Summary

| Template ID | Name | Contract Category | Industry | Report Type |
|-------------|------|-------------------|----------|-------------|
| `construction-daily-diary-v1` | Construction Daily Diary | Construction | Construction | Daily |
| `pmc-preventive-maintenance-v1` | Preventive Maintenance Report | PMC | Maintenance | Per-visit |
| `corrective-breakdown-v1` | Breakdown/Corrective Report | Corrective | Maintenance | Per-incident |
| `cmc-monthly-summary-v1` | Comprehensive Monthly Report | CMC | Maintenance | Monthly |
| `non-comprehensive-service-v1` | Service Maintenance Report | Non-Comprehensive | Maintenance | Per-visit |
| `sla-maintenance-v1` | SLA Compliance Report | SLA | Maintenance/IT | Per-incident |
| `performance-based-v1` | Performance Maintenance Report | Performance | Industrial | Monthly |
| `emergency-callout-v1` | Emergency Call-Out Report | Emergency | Maintenance | Per-incident |
| `amc-monthly-summary-v1` | Monthly AMC Summary | AMC | Maintenance | Monthly |
| `t-and-m-v1` | Time & Material Report | T&M | Services | Daily/Weekly |

---

## 7. WORK ENTRY LIFECYCLE

### 7.1 Status States

```
Draft → Submitted → Approved
           ↓
        Rejected
```

| Status | Editable? | Who Can Edit? | Next States |
|--------|-----------|---------------|-------------|
| **Draft** | ✅ Yes | Creator only | Submitted, Deleted |
| **Submitted** | ❌ No (locked) | Nobody | Approved, Rejected |
| **Approved** | ❌ No (immutable) | Nobody | None (final) |
| **Rejected** | ❌ No | Nobody | None (final) |

### 7.2 Lifecycle Rules

```javascript
// CRITICAL RULES

1. Drafts are editable
   - Worker can modify anytime
   - Changes saved locally (offline-first)
   - Can be deleted

2. Submitted entries are LOCKED
   - No edits allowed
   - Awaiting approval
   - Cannot be deleted

3. Approved entries are IMMUTABLE
   - Permanent record
   - Audit trail preserved
   - Cannot be modified or deleted

4. Offline edits after submit are BLOCKED
   - Status check prevents editing submitted/approved entries
   - Even offline

// This ensures auditability and client trust
```

---

## 8. OFFLINE-FIRST ARCHITECTURE

### 8.1 Why Offline is Non-Optional

```
Offline is NOT a feature.
Offline is a DESIGN CONSTRAINT.

Why it matters:
- Construction sites
- Basements
- Remote facilities
- Cost-sensitive users
- Emergency maintenance (no time to wait for internet)
```

### 8.2 IndexedDB Schema (Offline Storage)

```javascript
// src/services/offlineStorage/db.js

import Dexie from 'dexie';

export const db = new Dexie('WorkLedgerDB');

db.version(1).stores({
  // Templates (cached for offline form generation)
  templates: 'template_id, industry, contract_category, version, updated_at',
  
  // Work entries (main offline storage)
  workEntries: '++id, contract_id, template_id, entry_date, status, sync_status, created_at',
  
  // Attachments (photos, documents)
  attachments: '++id, entry_id, file_type, sync_status, created_at',
  
  // Sync queue (tracks pending operations)
  syncQueue: '++id, entity_type, entity_id, action, sync_status, priority, created_at',
  
  // Cached reference data
  organizations: 'id, updated_at',
  projects: 'id, organization_id, updated_at',
  contracts: 'id, project_id, template_id, contract_category, updated_at'
});

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  CONFLICT: 'conflict'
};
```

### 8.3 Sync Principles

```javascript
// AUTHORITY HIERARCHY
Client = Temporary Authority
  ↓
Server = Final Authority

// SYNC ORDER (Platform Master specification)
1. Templates sync on login
2. Metadata sync (orgs, projects, contracts)
3. Work entries sync
4. Attachments sync last
```

---

## 9. GUI STRUCTURE & DESIGN

### 9.1 Navigation Architecture (Mobile-First)

```
┌────────────────────────────────────────┐
│  WorkLedger - [Project Name]          │
├────────────────────────────────────────┤
│                                        │
│  Bottom Navigation:                    │
│                                        │
│  [📋 Work]  [📊 Projects]  [👥 Team]  [⚙️ More]  │
│                                        │
└────────────────────────────────────────┘
```

**Tab Definitions:**

1. **Work Tab** (Primary - Daily Use)
   - Quick entry (shows appropriate template for active contract)
   - Entry history
   - Offline indicator
   - SLA alerts (if applicable)

2. **Projects Tab** (Overview)
   - Project list
   - Contract overview
   - Contract type badges (PMC, CMC, AMC, etc.)
   - Recent activity

3. **Team Tab** (Collaboration)
   - Team members
   - Pending approvals (managers)
   - Activity feed

4. **More Tab** (Settings & Reports)
   - Generate reports
   - Monthly summaries (for CMC, AMC)
   - Organization settings
   - Sync status

### 9.2 Contract-Specific UI Elements

#### 9.2.1 Contract Type Badge

```jsx
// Component shows contract category with color coding
export const ContractTypeBadge = ({ category }) => {
  const categoryConfig = {
    PMC: { color: 'bg-blue-100 text-blue-800', label: 'PMC', icon: '🔧' },
    CMC: { color: 'bg-purple-100 text-purple-800', label: 'CMC', icon: '📦' },
    AMC: { color: 'bg-green-100 text-green-800', label: 'AMC', icon: '📅' },
    SLA: { color: 'bg-red-100 text-red-800', label: 'SLA', icon: '⚡' },
    CORRECTIVE: { color: 'bg-orange-100 text-orange-800', label: 'Breakdown', icon: '🔨' },
    T_AND_M: { color: 'bg-yellow-100 text-yellow-800', label: 'T&M', icon: '⏱️' },
  };
  
  const config = categoryConfig[category] || { color: 'bg-gray-100 text-gray-800', label: category, icon: '📄' };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};
```

#### 9.2.2 SLA Alert Component

```jsx
// Shows SLA breach warnings for SLA-based contracts
export const SLAAlert = ({ slaResponseTime, actualResponseTime, slaMet }) => {
  if (slaMet === 'Yes') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <span className="text-sm font-medium text-green-800">SLA Met</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Response: {actualResponseTime} mins (Target: {slaResponseTime} mins)
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-red-600">⚠️</span>
        <span className="text-sm font-medium text-red-800">SLA Breach Detected</span>
      </div>
      <p className="text-xs text-red-600 mt-1">
        Response: {actualResponseTime} mins (Target: {slaResponseTime} mins)
      </p>
      <p className="text-xs text-red-500 mt-1 font-medium">
        Exceeded by {actualResponseTime - slaResponseTime} minutes
      </p>
    </div>
  );
};
```

### 9.3 Dynamic Form Generation (Template-Driven)

```jsx
// DynamicForm Component generates form from template JSON
export const DynamicForm = ({ template, initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});
  
  const renderField = (section, field) => {
    const fieldPath = `${section.section_id}.${field.field_id}`;
    const value = formData[fieldPath] || field.default_value || '';
    
    // Check show_if condition
    if (field.show_if) {
      const shouldShow = evaluateCondition(field.show_if, formData);
      if (!shouldShow) return null;
    }
    
    switch (field.field_type) {
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateField(fieldPath, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{field.field_name}</span>
          </label>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.field_name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-1">
              {field.options.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateField(fieldPath, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => updateField(fieldPath, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={field.required}
          />
        );
      
      case 'signature':
        return (
          <SignatureCanvas
            onSave={(signatureData) => updateField(fieldPath, signatureData)}
          />
        );
      
      // ... other field types (text, number, select, textarea, photo)
      
      default:
        return null;
    }
  };
  
  const updateField = (fieldPath, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldPath]: value
    }));
    
    // Auto-calculate fields if needed
    checkAutoCalculations(fieldPath, value);
  };
  
  const checkAutoCalculations = (changedFieldPath, changedValue) => {
    // Find fields with auto_calculate=true
    template.fields_schema.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.auto_calculate && field.formula) {
          const calculatedValue = evaluateFormula(field.formula, formData);
          const fieldPath = `${section.section_id}.${field.field_id}`;
          
          if (formData[fieldPath] !== calculatedValue) {
            updateField(fieldPath, calculatedValue);
          }
        }
      });
    });
  };
  
  const evaluateFormula = (formula, data) => {
    // Example formulas:
    // "MINUTES_BETWEEN(call_received_time, arrival_time)"
    // "actual_response_time_mins <= sla_response_time_mins"
    
    if (formula.includes('MINUTES_BETWEEN')) {
      const matches = formula.match(/MINUTES_BETWEEN\((\w+),\s*(\w+)\)/);
      if (matches) {
        const [_, field1, field2] = matches;
        const time1 = new Date(data[field1]);
        const time2 = new Date(data[field2]);
        return Math.round((time2 - time1) / 60000); // milliseconds to minutes
      }
    }
    
    if (formula.includes('<=')) {
      const [field1, field2] = formula.split('<=').map(s => s.trim());
      return data[field1] <= data[field2] ? 'Yes' : 'No';
    }
    
    // Add more formula evaluators as needed
    return null;
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {template.fields_schema.sections.map(section => (
        <div key={section.section_id} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">{section.section_name}</h3>
          
          {section.section_id === 'scope_checklist' ? (
            // Special layout for checklists
            <div className="grid grid-cols-2 gap-3">
              {section.fields.map(field => (
                <div key={field.field_id}>
                  {renderField(section, field)}
                </div>
              ))}
            </div>
          ) : (
            // Standard layout
            <div className="space-y-3">
              {section.fields.map(field => (
                <div key={field.field_id}>
                  {field.field_type !== 'checkbox' && field.field_type !== 'radio' && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.field_name}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                  )}
                  {renderField(section, field)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-2">
        <Button type="submit" variant="primary">
          Save Entry
        </Button>
      </div>
    </form>
  );
};
```

---

## 10. DATABASE DESIGN

### 10.1 Core Tables Schema

```sql
-- ============================================
-- CONTRACTS (Enhanced with maintenance fields)
-- ============================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id),
  
  contract_number TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  
  -- Contract Type (NEW - Maintenance Support)
  contract_type TEXT,  -- "Construction", "Maintenance", "Services", etc.
  contract_category TEXT NOT NULL,  -- PMC, CMC, AMC, SLA, etc.
  
  -- Reporting Configuration
  reporting_frequency TEXT NOT NULL DEFAULT 'daily' 
    CHECK (reporting_frequency IN ('daily', 'weekly', 'monthly', 'adhoc')),
  requires_approval BOOLEAN DEFAULT true,
  
  -- SLA Configuration (for SLA-based contracts)
  sla_response_time_mins INTEGER,  -- NULL if not SLA contract
  sla_resolution_time_hours INTEGER,
  sla_tier TEXT CHECK (sla_tier IN ('Gold', 'Silver', 'Bronze')),
  
  -- Maintenance Specific
  maintenance_cycle TEXT,  -- Weekly, Monthly, Quarterly, etc.
  asset_categories JSONB,  -- ["HVAC", "Lift", "Pump"]
  
  -- Valid Period
  valid_from DATE NOT NULL,
  valid_until DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('draft', 'active', 'suspended', 'completed')),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(project_id, contract_number)
);

-- ============================================
-- TEMPLATES (Enhanced)
-- ============================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  industry TEXT,  -- construction, maintenance, facilities, it-services
  contract_category TEXT,  -- PMC, CMC, AMC, SLA, etc.
  report_type TEXT,  -- daily, per-visit, per-incident, monthly_summary
  
  -- Template Definition (JSONB)
  fields_schema JSONB NOT NULL,
  validation_rules JSONB,
  pdf_layout JSONB,
  
  -- Version Control
  version TEXT NOT NULL DEFAULT '1.0',
  is_locked BOOLEAN DEFAULT false,
  
  -- Access Control
  is_public BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- WORK ENTRIES (Template-Driven)
-- ============================================
CREATE TABLE work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id),
  
  entry_date DATE NOT NULL,
  shift TEXT,
  
  -- TEMPLATE-DRIVEN DATA (JSONB)
  data JSONB NOT NULL,
  
  -- SLA Tracking (if applicable)
  sla_response_actual_mins INTEGER,
  sla_resolution_actual_hours DECIMAL(5,2),
  sla_met BOOLEAN,
  penalty_amount DECIMAL(10,2),
  
  -- Lifecycle Status
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  
  -- Workflow Timestamps
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES auth.users(id),
  
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  approval_remarks TEXT,
  
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(contract_id, entry_date, shift, created_by)
);

-- Indexes
CREATE INDEX idx_contracts_category ON contracts(contract_category);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_templates_category ON templates(contract_category);
CREATE INDEX idx_templates_report_type ON templates(report_type);
CREATE INDEX idx_work_entries_contract_date ON work_entries(contract_id, entry_date DESC);
CREATE INDEX idx_work_entries_sla ON work_entries(sla_met) WHERE sla_met IS NOT NULL;

-- JSONB indexes
CREATE INDEX idx_work_entries_data_gin ON work_entries USING gin(data);
CREATE INDEX idx_contracts_asset_categories_gin ON contracts USING gin(asset_categories);
```

---

## 11. REPORT GENERATION

### 11.1 Client-Side PDF Generation

```javascript
// src/services/pdfService.js

class PDFService {
  async generateReport(workEntry, template, attachments = []) {
    const pdf = new jsPDF({
      orientation: template.pdf_layout.orientation || 'portrait',
      unit: 'mm',
      format: template.pdf_layout.page_size || 'A4'
    });
    
    let yPos = 20;
    
    // 1. Render Header
    if (template.pdf_layout.header) {
      yPos = this.renderHeader(pdf, template, workEntry, yPos);
    }
    
    // 2. Render Sections
    template.pdf_layout.sections.forEach(sectionLayout => {
      const section = template.fields_schema.sections.find(
        s => s.section_id === sectionLayout.section_id
      );
      
      if (!section) return;
      
      // Check show_if condition
      if (sectionLayout.show_if) {
        const shouldShow = this.evaluateCondition(sectionLayout.show_if, workEntry.data);
        if (!shouldShow) return;
      }
      
      // Render based on layout type
      switch (sectionLayout.layout) {
        case 'two_column':
          yPos = this.renderTwoColumn(pdf, section, workEntry.data, yPos);
          break;
        
        case 'checklist':
          yPos = this.renderChecklist(pdf, section, workEntry.data, sectionLayout, yPos);
          break;
        
        case 'table':
          yPos = this.renderTable(pdf, section, workEntry.data, sectionLayout, yPos);
          break;
        
        case 'metrics_cards':
          yPos = this.renderMetricsCards(pdf, section, workEntry.data, sectionLayout, yPos);
          break;
        
        case 'signature_box':
          yPos = this.renderSignatureBox(pdf, section, workEntry.data, yPos);
          break;
      }
      
      yPos += 5;
    });
    
    // 3. Render Photos
    if (attachments.length > 0) {
      yPos = this.renderPhotos(pdf, attachments, yPos);
    }
    
    // 4. Render Footer
    if (template.pdf_layout.footer) {
      this.renderFooter(pdf, template, workEntry);
    }
    
    return pdf.output('blob');
  }
  
  renderChecklist(pdf, section, data, sectionLayout, yPos) {
    // Section title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.section_name, 20, yPos);
    yPos += 8;
    
    // Checklist items
    section.fields.forEach(field => {
      const value = this.getFieldValue(data, section.section_id, field.field_id);
      const isChecked = value === true || value === 'true';
      
      // Show only checked items if configured
      if (sectionLayout.show_checked_only && !isChecked) {
        return;
      }
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Checkbox
      const checkboxX = 20;
      const checkboxY = yPos - 3;
      pdf.rect(checkboxX, checkboxY, 4, 4);
      
      if (isChecked) {
        // Draw checkmark
        pdf.setLineWidth(0.5);
        pdf.line(checkboxX + 1, checkboxY + 2, checkboxX + 1.5, checkboxY + 3);
        pdf.line(checkboxX + 1.5, checkboxY + 3, checkboxX + 3, checkboxY + 1);
      }
      
      // Label
      pdf.text(field.field_name, 27, yPos);
      
      yPos += 6;
    });
    
    return yPos;
  }
  
  renderMetricsCards(pdf, section, data, sectionLayout, yPos) {
    // Section title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.section_name, 20, yPos);
    yPos += 10;
    
    const cardWidth = (170 / sectionLayout.columns) - 5;
    const cardHeight = 25;
    let xPos = 20;
    let cardsInRow = 0;
    
    section.fields.forEach(field => {
      const value = this.getFieldValue(data, section.section_id, field.field_id);
      
      // Card background
      pdf.setFillColor(59, 130, 246); // Primary blue
      pdf.setDrawColor(59, 130, 246);
      pdf.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Metric value (large)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(value || '0'), xPos + cardWidth / 2, yPos + 12, { align: 'center' });
      
      // Metric label (small)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(field.field_name, xPos + cardWidth / 2, yPos + 20, { align: 'center' });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Move to next position
      cardsInRow++;
      if (cardsInRow === sectionLayout.columns) {
        // Next row
        yPos += cardHeight + 5;
        xPos = 20;
        cardsInRow = 0;
      } else {
        // Next column
        xPos += cardWidth + 5;
      }
    });
    
    // If cards ended mid-row, move Y to next row
    if (cardsInRow > 0) {
      yPos += cardHeight + 5;
    }
    
    return yPos;
  }
  
  renderSignatureBox(pdf, section, data, yPos) {
    // Section title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.section_name, 20, yPos);
    yPos += 10;
    
    section.fields.forEach(field => {
      const value = this.getFieldValue(data, section.section_id, field.field_id);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(field.field_name + ':', 20, yPos);
      
      if (field.field_type === 'signature' && value) {
        // Draw signature image
        pdf.addImage(value, 'PNG', 20, yPos + 2, 50, 15);
        yPos += 20;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.text(value || '-', 60, yPos);
        yPos += 7;
      }
    });
    
    return yPos;
  }
}

export const pdfService = new PDFService();
```

---

## 12. SECURITY & RLS FRAMEWORK

### 12.1 RLS Policies

```sql
-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Contracts: View contracts in own org
CREATE POLICY "view_org_contracts" ON contracts
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Templates: View public or org-specific
CREATE POLICY "view_templates" ON templates
  FOR SELECT USING (
    is_public = true
    OR
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Work Entries: Workers see own, Managers see all
CREATE POLICY "view_work_entries" ON work_entries
  FOR SELECT USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN projects p ON p.organization_id = om.organization_id
      JOIN contracts c ON c.project_id = p.id
      WHERE c.id = work_entries.contract_id
      AND om.user_id = auth.uid()
      AND om.role IN ('org_admin', 'manager')
    )
  );
```

---

## 13. MVP DEVELOPMENT PHASES

### 13.1 Phase 1: Foundation (Week 1-4)

**Objectives:**
- Authentication system
- RBAC foundation
- Organization/Project/Contract hierarchy
- Basic work entry (template-driven)

**Deliverables:**
- [ ] Users can sign up/login
- [ ] Org Admin can create organization
- [ ] Org Admin can invite users with roles
- [ ] Manager can create projects
- [ ] Manager can create contracts with contract category (PMC, CMC, AMC, etc.)
- [ ] Contracts linked to pre-built templates
- [ ] Workers can create basic work entries

**Time:** 32 hours (8 hours/week × 4 weeks)

### 13.2 Phase 2: Templates & Reports (Week 5-8)

**Objectives:**
- Pre-built template library working
- Dynamic form generation
- PDF generation (client-side)
- Client read-only access

**Deliverables:**
- [ ] 8 pre-built templates available (PMC, CMC, AMC, SLA, Corrective, Emergency, T&M, Construction)
- [ ] Org Admin can create custom templates
- [ ] Forms generated dynamically from templates
- [ ] Template validation working (including SLA auto-calculations)
- [ ] PDF reports generated client-side
- [ ] Client role can view reports

**Time:** 32 hours (8 hours/week × 4 weeks)

### 13.3 Phase 3: Offline-First (Week 9-12)

**Objectives:**
- IndexedDB integration
- Sync engine
- Conflict handling
- Attachment queue

**Deliverables:**
- [ ] Work entries saved to IndexedDB
- [ ] Templates cached offline
- [ ] Platform works completely offline
- [ ] Auto-sync when online
- [ ] Conflict resolution working
- [ ] Photos upload in background
- [ ] Sync status visible to user

**Time:** 32 hours (8 hours/week × 4 weeks)

**STOP HERE. SHIP. LEARN.**

### 13.4 Total MVP Timeline

```
Phase 1: Foundation             ████████████████ 4 weeks (32 hours)
Phase 2: Templates & Reports    ████████████████ 4 weeks (32 hours)
Phase 3: Offline-First          ████████████████ 4 weeks (32 hours)

TOTAL: 12 weeks (3 months) | 96 hours total
```

---

## 14. PRE-BUILT TEMPLATE LIBRARY

### 14.1 Template Installation Script

```sql
-- Insert pre-built templates into database
-- Run this once during Phase 2 setup

-- 1. Preventive Maintenance Contract (PMC)
INSERT INTO templates (template_id, template_name, industry, contract_category, report_type, fields_schema, pdf_layout, is_public)
VALUES (
  'pmc-preventive-maintenance-v1',
  'Preventive Maintenance Report',
  'maintenance',
  'PMC',
  'per-visit',
  -- [FULL JSON from Section 6.3]
  '{...}',
  '{...}',
  true
);

-- 2. SLA-Based Maintenance
INSERT INTO templates (template_id, template_name, industry, contract_category, report_type, fields_schema, pdf_layout, is_public)
VALUES (
  'sla-maintenance-v1',
  'SLA Compliance Report',
  'maintenance',
  'SLA',
  'per-incident',
  -- [FULL JSON from Section 6.4]
  '{...}',
  '{...}',
  true
);

-- 3. Comprehensive Maintenance (CMC) Monthly
INSERT INTO templates (template_id, template_name, industry, contract_category, report_type, fields_schema, pdf_layout, is_public)
VALUES (
  'cmc-monthly-summary-v1',
  'Comprehensive Maintenance Monthly Report',
  'maintenance',
  'CMC',
  'monthly_summary',
  -- [FULL JSON from Section 6.5]
  '{...}',
  '{...}',
  true
);

-- 4-8: Additional templates...
```

### 14.2 Template Selection Flow

```jsx
// Contract creation - template selection
const ContractForm = () => {
  const [contractCategory, setContractCategory] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState([]);
  
  useEffect(() => {
    if (contractCategory) {
      loadTemplatesForCategory(contractCategory);
    }
  }, [contractCategory]);
  
  const loadTemplatesForCategory = async (category) => {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('contract_category', category)
      .eq('is_public', true);
    
    setAvailableTemplates(data);
  };
  
  return (
    <div>
      {/* Step 1: Select contract category */}
      <select onChange={(e) => setContractCategory(e.target.value)}>
        <option value="">Select Contract Type</option>
        <optgroup label="Maintenance Contracts">
          <option value="PMC">Preventive Maintenance (PMC)</option>
          <option value="CMC">Comprehensive Maintenance (CMC)</option>
          <option value="AMC">Annual Maintenance (AMC)</option>
          <option value="SLA">SLA-Based Maintenance</option>
          <option value="CORRECTIVE">Corrective/Breakdown</option>
          <option value="EMERGENCY">Emergency/On-Call</option>
        </optgroup>
        <optgroup label="Other Contracts">
          <option value="T_AND_M">Time & Material</option>
          <option value="CONSTRUCTION">Construction Daily</option>
        </optgroup>
      </select>
      
      {/* Step 2: Select specific template */}
      {availableTemplates.length > 0 && (
        <select>
          <option value="">Select Template</option>
          {availableTemplates.map(template => (
            <option key={template.id} value={template.id}>
              {template.template_name} (v{template.version})
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
```

---

## 15. DECISION-MAKING FILTER

### 15.1 The Daily Filter

Before building ANYTHING, ask these 5 questions:

```
1. Does this help users report work FASTER?
   → If no, defer it.

2. Does this work OFFLINE?
   → If critical and answer is no, redesign it.

3. Does this respect RBAC?
   → If no, it's a security vulnerability.

4. Does this avoid database SCHEMA CHANGES?
   → If no, can it use templates instead?

5. Does this keep costs at ZERO?
   → If no, find free alternative or defer.
```

**If ANY answer is "no", defer it.**

### 15.2 What NOT to Build Early

```
🚫 Charts & analytics
🚫 AI summaries (defer to post-MVP)
🚫 Real-time collaboration
🚫 Complex SLA calculations beyond basic response/resolution time
🚫 Over-custom UI theming
🚫 Multi-language support
🚫 Advanced notifications
🚫 Integration with external systems
```

---

## 16. FINAL REMINDERS

### 16.1 You Are Building

> **NOT:** "A maintenance reporting app"  
> **YES:** A contract-aware, offline-first reporting infrastructure for ANY industry that does work in the field

### 16.2 Success Factors

1. **Follow this guideline** - Proven tech (Contract Diary) + Flexible architecture (Platform Master) + Real templates (Malaysian market)
2. **Templates are your competitive advantage** - Competitors can't easily replicate 8+ industry-specific templates
3. **Test offline relentlessly** - This is your killer feature
4. **RBAC is non-negotiable** - Enterprises demand it
5. **Stay zero-budget in MVP** - Prove value before spending

### 16.3 Core Principles (Never Forget)

```
✅ Templates + Offline + RBAC = Scalable Multi-Industry Reporting

✅ Work Entry as the Factual Anchor
✅ Offline is NOT a feature, it's a DESIGN CONSTRAINT
✅ Never trust the frontend (RBAC at database level)
✅ Client = Temporary Authority, Server = Final Authority
✅ Drafts are editable, Submitted are locked, Approved are immutable
✅ Templates avoid database schema changes
✅ Client-side PDF = Zero cost + Offline capable
✅ Contract category drives template selection
✅ SLA auto-calculations save time and prevent disputes
```

---

## APPENDIX: QUICK REFERENCE

### Malaysian Contract Categories Cheat Sheet

| Code | Name | Template | When Used |
|------|------|----------|-----------|
| PMC | Preventive Maintenance | Checklist + photos | Regular servicing (monthly/quarterly) |
| CMC | Comprehensive Maintenance | Monthly summary | Full responsibility (labor + parts) |
| AMC | Annual Maintenance | Monthly summary | 1-year contracts |
| SLA | Service Level Agreement | KPI + response metrics | Critical systems, IT, utilities |
| CORRECTIVE | Breakdown/Reactive | Incident + root cause | After failures occur |
| EMERGENCY | On-Call/24-7 | Emergency callout | Urgent response needed |
| T&M | Time & Material | Timesheet + cost | Uncertain scope, ad-hoc |
| CONSTRUCTION | Daily Works | Construction diary | Building, infrastructure |

### Template Usage Examples

```javascript
// Freelance electrician doing monthly AC servicing
contract_category: 'PMC'
template: 'pmc-preventive-maintenance-v1'
reporting_frequency: 'monthly'

// Facility company with full M&E responsibility
contract_category: 'CMC'
template: 'cmc-monthly-summary-v1'
reporting_frequency: 'monthly'

// IT support company with response time SLA
contract_category: 'SLA'
template: 'sla-maintenance-v1'
sla_response_time_mins: 30
sla_tier: 'Gold'
```

---

**END OF FINAL ALIGNED GUIDELINE**

*Version: 2.1 (Maintenance Templates Integrated)*  
*Last Updated: January 25, 2026*  
*Merges: Contract Diary Platform + Platform Master Guideline + Malaysian Maintenance Industry*  
*Created for: WorkLedger - Multi-Industry Work Reporting Platform*  

**Bismillah, you now have the complete blueprint with real-world templates ready to implement. From construction sites to maintenance contracts, from freelancers to enterprises - WorkLedger can serve them all! 🚀**
