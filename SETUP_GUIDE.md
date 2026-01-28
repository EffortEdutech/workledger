# WORKLEDGER SETUP GUIDE

**Complete step-by-step guide to initialize WorkLedger project**

**Date:** January 25, 2026  
**Version:** 1.0  

---

## 📋 PREREQUISITES CHECKLIST

Before starting, ensure you have:

- [ ] **Node.js** >= 18.0.0 installed
- [ ] **npm** >= 9.0.0 installed
- [ ] **Git** installed and configured
- [ ] **GitHub account** (personal or Bina Jaya organization)
- [ ] **Supabase account** (free tier)
- [ ] **Vercel account** (free tier, optional for now)
- [ ] **Text editor** (VS Code recommended)

**Verify installations:**
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
git --version    # Should show git version 2.x.x
```

---

## 🚀 PART 1: GITHUB REPOSITORY SETUP

### Step 1: Create GitHub Repository

**Option A: Via GitHub Web Interface**
1. Go to https://github.com/new
2. Repository name: `workledger`
3. Description: `Contract-Aware, Offline-First Work Reporting Platform`
4. Visibility: **Private** (recommended for proprietary project)
5. **DO NOT** initialize with README, .gitignore, or license (we have our own)
6. Click "Create repository"

**Option B: Via GitHub CLI** (if installed)
```bash
gh repo create workledger --private --description "Contract-Aware, Offline-First Work Reporting Platform"
```

### Step 2: Initialize Local Repository

Create project directory and initialize git:
```bash
# Create project folder
mkdir workledger
cd workledger

# Initialize git repository
git init

# Set default branch to main
git branch -M main
```

### Step 3: Add Configuration Files

Copy all configuration files from Session 1 into the project:

```bash
workledger/
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── LICENSE
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── vercel.json
├── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml
└── docs/
    └── PROGRESS.md
```

**Quick method (if files are in a folder):**
```bash
# If all config files are in /path/to/workledger-config/
cp -r /path/to/workledger-config/* .
```

### Step 4: Create Folder Structure

Create all necessary folders:
```bash
# Public folder
mkdir -p public/icons

# Source folders
mkdir -p src/components/{common,layout,auth,templates,workEntries,contracts,attachments,reports}
mkdir -p src/pages/{auth,dashboard,work,projects,contracts,team,reports,settings}
mkdir -p src/services/{supabase,offline,api,pdf,permissions,utils}
mkdir -p src/hooks
mkdir -p src/context
mkdir -p src/constants
mkdir -p src/styles
mkdir -p src/assets

# Database folders
mkdir -p database/{schema,seeds,migrations}

# Create .gitkeep files to preserve empty folders
find src -type d -exec touch {}/.gitkeep \;
find database -type d -exec touch {}/.gitkeep \;
```

### Step 5: Install Dependencies

```bash
# Install all dependencies
npm install

# This will install:
# - React 18.2.0
# - Supabase client
# - Dexie (IndexedDB)
# - jsPDF + AutoTable
# - React Hook Form + Zod
# - Tailwind CSS
# - And more...
```

**Expected output:**
```
added 500+ packages in 30s
```

### Step 6: Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values
# (You'll add Supabase credentials in Session 2)
```

**For now, .env.local should contain:**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
VITE_APP_NAME=WorkLedger
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
```

### Step 7: Verify Setup

Test that everything is configured correctly:
```bash
# Check if Node modules installed
ls node_modules/ | wc -l   # Should show 500+

# Verify package.json scripts
npm run --help

# Try to start dev server (will fail without src files, that's OK)
npm run dev
```

### Step 8: Initial Git Commit

```bash
# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "chore: initial project setup

- Add package.json with all dependencies
- Add Vite + PWA configuration
- Add Tailwind CSS with design system
- Add environment variables template
- Add comprehensive README
- Add GitHub Actions workflow
- Add ESLint configuration
- Add folder structure
- Add PROGRESS.md tracking

Session 1 complete: Repository structure & configuration"

# Link to GitHub (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/workledger.git

# Push to GitHub
git push -u origin main
```

### Step 9: Verify GitHub

Visit your GitHub repository:
```
https://github.com/YOUR-USERNAME/workledger
```

You should see:
- âœ… README.md displayed
- âœ… 11 configuration files
- âœ… Folder structure created
- âœ… .github/workflows/deploy.yml present
- âœ… docs/PROGRESS.md present

---

## 🗄️ PART 2: SUPABASE PROJECT SETUP

**Note:** This will be covered in detail in Session 2, but here's the overview:

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Project details:
   - **Name:** workledger
   - **Database Password:** (generate strong password - SAVE THIS!)
   - **Region:** Singapore (closest to Malaysia)
   - **Pricing Plan:** Free
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### Step 2: Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL** (e.g., https://abcdefgh.supabase.co)
   - **anon public** key (safe to expose in frontend)
3. Update `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Setup Database (Session 2)

We'll run SQL scripts in this order:
1. `database/schema/001_initial_schema.sql` - Core tables
2. `database/schema/002_rls_policies.sql` - Security policies
3. `database/schema/003_functions.sql` - Database functions
4. `database/seeds/001_templates.sql` - Pre-built templates

**DO NOT do this yet - wait for Session 2 where we'll create these scripts.**

---

## 🔧 PART 3: DEVELOPMENT ENVIRONMENT

### Recommended VS Code Extensions

Install these for best experience:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "mhutchie.git-graph",
    "streetsidesoftware.code-spell-checker",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

Save this as `.vscode/extensions.json`

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^'\"`]*)(?:'|\"|`)"]
  ],
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".vite": true
  }
}
```

---

## 📦 PART 4: VERCEL DEPLOYMENT (Optional - Post-MVP)

**Note:** You can skip this for now. Deploy when you have working code.

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Project
```bash
vercel
# Follow prompts to link project
```

### Step 4: Add Environment Variables in Vercel
```bash
# Via CLI
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Or via dashboard:
# https://vercel.com/your-username/workledger/settings/environment-variables
```

### Step 5: Deploy
```bash
vercel --prod
```

---

## âœ… VERIFICATION CHECKLIST

After completing Part 1 (GitHub setup):

- [ ] Git repository initialized
- [ ] All 11 config files present
- [ ] Folder structure created
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] `.env.local` created (even if empty for now)
- [ ] Initial commit made
- [ ] Pushed to GitHub
- [ ] GitHub repository accessible online
- [ ] README.md displays correctly on GitHub
- [ ] GitHub Actions workflow file present

After completing Part 2 (Supabase, in Session 2):

- [ ] Supabase project created
- [ ] API credentials copied
- [ ] `.env.local` updated with real credentials
- [ ] Database schema scripts ready
- [ ] Can access Supabase dashboard

---

## 🐛 TROUBLESHOOTING

### Issue: npm install fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Git push fails with authentication error
**Solution:**
```bash
# Use GitHub CLI for easier authentication
gh auth login

# Or setup SSH key:
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Issue: Vite dev server won't start
**Solution:**
This is expected! We haven't created `index.html` or `src/main.jsx` yet.
We'll do this in Session 3 (Frontend Scaffold).

### Issue: ESLint errors
**Solution:**
```bash
# Run lint to see errors
npm run lint

# Auto-fix what can be fixed
npm run lint -- --fix
```

---

## 📝 NOTES

### What's Not Included Yet
- âŒ `index.html` - Created in Session 3
- âŒ `src/main.jsx` - Created in Session 3
- âŒ `src/App.jsx` - Created in Session 3
- âŒ Database schema files - Created in Session 2
- âŒ Any actual components - Created in Session 3+
- âŒ Supabase client configuration - Created in Session 3

### What IS Included
- âœ… All configuration files (package.json, vite.config.js, etc.)
- âœ… Complete folder structure
- âœ… Design system (Tailwind config)
- âœ… Offline-first PWA configuration
- âœ… GitHub Actions workflow
- âœ… Comprehensive documentation
- âœ… PROGRESS.md tracking

---

## 🎯 NEXT STEPS

**Session 2: Database Foundation**
- Create database schema SQL scripts
- Setup Supabase tables
- Install RLS policies
- Seed pre-built templates (PMC, CMC, AMC, SLA, etc.)
- Test database access

**Session 3: Frontend Scaffold**
- Create `index.html`
- Create `src/main.jsx` and `src/App.jsx`
- Setup React Router
- Create basic layout components
- Setup IndexedDB (Dexie)
- Verify app runs on localhost:5173

**Session 4: Verification & Documentation**
- Test authentication flow
- Verify offline storage works
- Document Phase 1 preparation
- Plan detailed Phase 1 tasks

---

## 🆘 GETTING HELP

If stuck at any step:

1. **Check PROGRESS.md** - See what was done in previous sessions
2. **Check README.md** - Comprehensive project documentation
3. **Check WORKLEDGER_GUIDELINE_FINAL.md** - Complete technical specification
4. **Ask AI Assistant** - Claude can help troubleshoot specific issues

---

**Bismillah. You're ready to start coding! 🚀**

*Setup Guide Version: 1.0*  
*Last Updated: January 25, 2026*  
*For: WorkLedger Project - Session 1*
