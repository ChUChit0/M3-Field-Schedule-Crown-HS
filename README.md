# Crown HS Schedule Calendar Application

Professional construction project schedule management application with intelligent duplicate detection and version control.

## 📁 Project Structure

```
crown-schedule-app/
├── original/                           # ⚠️  SOURCE FILES (DO NOT MODIFY)
│   ├── crown-hs-schedule-calendar-enhanced.html  # Original monolithic (181KB)
│   └── README.md                       # Protection rules & documentation
├── index.html                          # ✅ Main HTML entry point
├── README.md                           # ✅ This file
├── LICENSE                             # ✅ MIT License
├── .gitignore                          # ✅ Git ignore rules
├── PROJECT_STATUS.md                   # Migration progress tracker
├── MIGRATION_PLAN.md                   # Detailed migration instructions
├── COLOR_PALETTE.md                    # iOS development color reference
├── css/
│   └── styles.css                      # ✅ Application styles (glass morphism)
├── js/
│   ├── app.js                          # ✅ Main application orchestrator
│   ├── components/
│   │   ├── DuplicateDetectionModal.js  # ✅ Intelligent duplicate detection modal
│   │   ├── SettingsModal.js            # ✅ Project settings
│   │   ├── ConfigureCodesModal.js      # ✅ Activity ID configuration
│   │   ├── ImportWizard.js             # ✅ Excel import wizard (4 steps)
│   │   ├── ExportOptionsModal.js       # ✅ Export options with filtering
│   │   ├── BulkContractorModal.js      # ✅ Bulk operations
│   │   ├── ManualEntryModal.js         # ✅ Manual activity entry
│   │   ├── EditActivityModal.js        # ✅ Edit activity with date validation
│   │   ├── RenameUpdateModal.js        # ✅ Rename update version
│   │   ├── DeleteConfirmModal.js       # ✅ Delete confirmation
│   │   └── Toast.js                    # ✅ Toast notifications
│   ├── utils/
│   │   ├── excelUtils.js               # ✅ Excel processing utilities
│   │   ├── dateUtils.js                # ✅ Date conversion utilities (MM/DD/YY)
│   │   ├── duplicateDetection.js       # ✅ Intelligent duplicate detection algorithm
│   │   └── localStorage.js             # ✅ LocalStorage management
│   └── config/
│       └── areaConfig.js               # ✅ Area and field configuration
```

## 🎯 Key Features

### ✅ Fully Complete (100%)
1. **Modular Project Structure** - 17 organized JavaScript files
2. **Area Configuration** - Centralized area and field definitions
3. **Date Utilities** - Excel date conversion and MM/DD/YY formatting
4. **Excel Processing** - File parsing and data extraction
5. **Intelligent Duplicate Detection** - Fuzzy matching with 4 critical fields
6. **AI Recommendation Engine** - Context-aware import suggestions
7. **11 React Components** - All modals and UI components extracted
8. **Main Application Orchestrator** - Full state management in app.js
9. **Glass Morphism Design** - Modern, professional styling
10. **LocalStorage Persistence** - Auto-save/load with backup/restore
11. **Multi-Update Management** - Track multiple project versions
12. **Interactive Calendar** - Visual activity scheduling
13. **Bulk Operations** - Contractor assignment, filtering, export
14. **4-Step Import Wizard** - Upload → Map → Filter → Preview
15. **Activities Without Dates** - Special section for incomplete activities

## 🧠 Intelligent Duplicate Detection

The system uses a **4-field fuzzy matching algorithm** to detect duplicates:

### Critical Fields
- `id` - Activity ID
- `name` - Activity Name
- `start` - Start Date
- `finish` - Finish Date

### Match Scoring
- **4/4 fields match** → Exact duplicate (skip)
- **3/4 fields match** → Likely update (show changes)
- **<3 fields match** → New activity

### AI Recommendations

The system analyzes the import and provides intelligent recommendations:

#### 1. **Create New Update** (>50% duplicates/updates)
- Suggests creating Update 14, 15, etc.
- Preserves historical data
- Tracks changes over time
- **Use case**: Re-importing entire project file with updates

#### 2. **Import New Only** (<20% duplicates)
- Adds only new activities
- Skips all duplicates
- **Use case**: Adding Area B when Area A already imported

#### 3. **Replace & Import** (20-50% updates)
- Updates existing activities with new data
- Adds new activities
- **Use case**: Partial project updates

## 🏗️ Construction-Specific Design

### Why This Matters for Construction
1. **Version Control** - Track project changes over weeks/months
2. **Multi-Area Management** - Different areas progress at different rates
3. **Data Integrity** - Never lose historical schedule data
4. **Team Collaboration** - Multiple people can work on different areas
5. **Change Tracking** - See what changed between Update 13 and Update 14

## 🚀 Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/ChUChit0/M3-Field-Schedule-Crown-HS.git
cd M3-Field-Schedule-Crown-HS

# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

### Usage

1. **Import Excel File** - Click "Import Excel" → Upload your project schedule
2. **Map Columns** - Match Excel columns to activity fields
3. **Filter & Preview** - Select activities to import
4. **Manage Updates** - Create new updates (Update 13, 14, etc.)
5. **Export to Excel** - Filter, sort, and export activities
6. **Manual Entry** - Add individual activities with the calendar
7. **Bulk Operations** - Assign contractors to multiple activities

### Date Format
All dates use **US format: MM/DD/YY** (e.g., 12/25/24)

## 🎨 Design Philosophy

- **Modular**: Each feature in its own file
- **Maintainable**: Easy to find and update code
- **Scalable**: Can add features without touching existing code
- **Professional**: Construction-grade quality and reliability
- **Intelligent**: AI-powered recommendations for common workflows

## 🔧 Technologies

- **React 18** - UI components
- **Babel Standalone** - JSX transformation
- **TailwindCSS** - Styling
- **SheetJS (XLSX)** - Excel file processing
- **LocalStorage API** - Client-side persistence
- **ES6 Modules** - Modern JavaScript organization

---

## 📊 Project Statistics

- **17 JavaScript Files** - Fully modular architecture
- **11 React Components** - All UI elements extracted
- **4 Utility Modules** - Date, Excel, LocalStorage, Duplicate Detection
- **1,200+ Lines** - Main app.js orchestrator
- **100% Complete** - Ready for production use

---

**Status**: ✅ **COMPLETE** - Production Ready

**Repository**: [https://github.com/ChUChit0/M3-Field-Schedule-Crown-HS.git](https://github.com/ChUChit0/M3-Field-Schedule-Crown-HS.git)

**Created by**: Lucio Aguilar © 2024
