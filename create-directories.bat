@echo off
REM ============================================
REM WORKLEDGER - CREATE PROJECT DIRECTORIES
REM Windows Batch File
REM ============================================
REM This script creates all directories from dir_tree_masterplan.txt
REM Run this in your project root directory

echo.
echo ============================================
echo WorkLedger - Creating Project Directories
echo ============================================
echo.

REM Create .github directory structure
echo [1/15] Creating .github directories...
mkdir ".github\workflows" 2>nul

REM Create public directory structure
echo [2/15] Creating public directories...
mkdir "public\icons" 2>nul

REM Create src/assets directory structure
echo [3/15] Creating src/assets directories...
mkdir "src\assets" 2>nul

REM Create src/components directory structure
echo [4/15] Creating src/components directories...
mkdir "src\components\common" 2>nul
mkdir "src\components\layout" 2>nul
mkdir "src\components\auth" 2>nul
mkdir "src\components\templates" 2>nul
mkdir "src\components\workEntries" 2>nul
mkdir "src\components\contracts" 2>nul
mkdir "src\components\attachments" 2>nul
mkdir "src\components\reports" 2>nul

REM Create src/pages directory structure
echo [5/15] Creating src/pages directories...
mkdir "src\pages\auth" 2>nul
mkdir "src\pages\dashboard" 2>nul
mkdir "src\pages\work" 2>nul
mkdir "src\pages\projects" 2>nul
mkdir "src\pages\contracts" 2>nul
mkdir "src\pages\team" 2>nul
mkdir "src\pages\reports" 2>nul
mkdir "src\pages\settings" 2>nul

REM Create src/services directory structure
echo [6/15] Creating src/services directories...
mkdir "src\services\supabase" 2>nul
mkdir "src\services\offline" 2>nul
mkdir "src\services\api" 2>nul
mkdir "src\services\pdf" 2>nul
mkdir "src\services\permissions" 2>nul
mkdir "src\services\utils" 2>nul

REM Create src/hooks directory
echo [7/15] Creating src/hooks directory...
mkdir "src\hooks" 2>nul

REM Create src/context directory
echo [8/15] Creating src/context directory...
mkdir "src\context" 2>nul

REM Create src/constants directory
echo [9/15] Creating src/constants directory...
mkdir "src\constants" 2>nul

REM Create src/styles directory
echo [10/15] Creating src/styles directory...
mkdir "src\styles" 2>nul

REM Create database directory structure
echo [11/15] Creating database directories...
mkdir "database\schema" 2>nul
mkdir "database\seeds" 2>nul
mkdir "database\migrations" 2>nul

REM Create docs directory
echo [12/15] Creating docs directory...
mkdir "docs" 2>nul

REM Create .gitkeep files to preserve empty directories
echo [13/15] Creating .gitkeep files...
type nul > "public\icons\.gitkeep"
type nul > "src\assets\.gitkeep"
type nul > "src\components\common\.gitkeep"
type nul > "src\components\layout\.gitkeep"
type nul > "src\components\auth\.gitkeep"
type nul > "src\components\templates\.gitkeep"
type nul > "src\components\workEntries\.gitkeep"
type nul > "src\components\contracts\.gitkeep"
type nul > "src\components\attachments\.gitkeep"
type nul > "src\components\reports\.gitkeep"
type nul > "src\pages\auth\.gitkeep"
type nul > "src\pages\dashboard\.gitkeep"
type nul > "src\pages\work\.gitkeep"
type nul > "src\pages\projects\.gitkeep"
type nul > "src\pages\contracts\.gitkeep"
type nul > "src\pages\team\.gitkeep"
type nul > "src\pages\reports\.gitkeep"
type nul > "src\pages\settings\.gitkeep"
type nul > "src\services\supabase\.gitkeep"
type nul > "src\services\offline\.gitkeep"
type nul > "src\services\api\.gitkeep"
type nul > "src\services\pdf\.gitkeep"
type nul > "src\services\permissions\.gitkeep"
type nul > "src\services\utils\.gitkeep"
type nul > "src\hooks\.gitkeep"
type nul > "src\context\.gitkeep"
type nul > "src\constants\.gitkeep"
type nul > "src\styles\.gitkeep"
type nul > "database\schema\.gitkeep"
type nul > "database\seeds\.gitkeep"
type nul > "database\migrations\.gitkeep"

REM Verify directory structure
echo [14/15] Verifying directory structure...
if exist "src\components\" (
    echo    ✓ src/components directories created
) else (
    echo    ✗ Failed to create src/components directories
)

if exist "src\pages\" (
    echo    ✓ src/pages directories created
) else (
    echo    ✗ Failed to create src/pages directories
)

if exist "src\services\" (
    echo    ✓ src/services directories created
) else (
    echo    ✗ Failed to create src/services directories
)

if exist "database\" (
    echo    ✓ database directories created
) else (
    echo    ✗ Failed to create database directories
)

echo [15/15] Directory creation complete!
echo.
echo ============================================
echo SUCCESS! All directories created.
echo ============================================
echo.
echo Next steps:
echo 1. Copy configuration files into the root directory
echo 2. Run: npm install
echo 3. Copy .env.example to .env.local
echo 4. Update .env.local with your Supabase credentials
echo.
echo Ready to start Session 2: Database Foundation!
echo.
echo Bismillah! Let's build WorkLedger! 🚀
echo.
pause
