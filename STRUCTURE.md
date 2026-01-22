# SPECTRE OSINT Platform - Modular Structure Guide

> **Version:** 2.2.0 (Power Features)  
> **Last Updated:** January 2026

---

## 📁 File Structure Overview

```
spectre-modular/
├── index.html          ← Main HTML page (edit for layout changes)
├── manifest.json       ← PWA manifest for installable app
├── sw.js               ← Service Worker for offline support
├── STRUCTURE.md        ← This documentation file
├── css/
│   ├── variables.css   ← Colors, fonts, themes (EDIT THIS FOR BRANDING)
│   ├── base.css        ← Basic styling (rarely needs editing)
│   ├── components.css  ← Buttons, cards, inputs (UI elements)
│   ├── layout.css      ← Page structure (landing, results)
│   └── utilities.css   ← Helper classes (spacing, animations)
├── icons/
│   └── icon.svg        ← PWA app icon
└── js/
    ├── tools-db.js     ← 🔧 TOOL DATABASE (EDIT THIS TO ADD/REMOVE TOOLS)
    ├── utils.js        ← Utility functions (rarely needs editing)
    ├── storage.js      ← Data persistence (rarely needs editing)
    ├── ui.js           ← User interface logic
    ├── export.js       ← Export functionality (JSON, CSV, etc.)
    ├── app.js          ← Core application logic
    ├── init.js         ← Initialization (loads last)
    │
    │── ENHANCED MODULES (v2.1) ──────────────────────
    ├── case-manager.js    ← 📁 Investigation/case management
    ├── custom-tools.js    ← 🛠️ User-defined custom tools
    ├── url-state.js       ← 🔗 URL state for shareable searches
    ├── api-integrations.js← 🌐 Live API integrations (EmailRep, IPinfo, etc.)
    ├── workflows.js       ← ⚡ Automated tool chains/workflows
    ├── smart-suggestions.js← 💡 Pattern detection & tool recommendations
    │
    │── POWER FEATURES (v2.2) ────────────────────────
    ├── command-palette.js ← 🎹 Ctrl+K quick command access
    ├── bulk-processing.js ← 📋 Bulk input processing
    ├── workspace.js       ← 🖥️ Split-pane results workspace
    └── pwa.js             ← 📱 PWA support & offline mode
```

---

## 🔧 Common Tasks for Non-Technical Users

### Task 1: Add a New OSINT Tool

**File to edit:** `js/tools-db.js`

1. Find the category you want to add to (e.g., `people`, `social`, `email`)
2. Add a new entry in the `tools` array:

```javascript
{ 
    name: "Tool Name", 
    url: "https://example.com/search?q={username}", 
    badge: "free",           // Options: free, freemium, paid, cli
    fields: ["username"],    // What inputs it needs
    desc: "Brief description of what this tool does"
}
```

**Available placeholders for URLs:**
- `{first}` or `{First}` - First name (lowercase/capitalized)
- `{last}` or `{Last}` - Last name (lowercase/capitalized)
- `{username}` - Username
- `{email}` - Email address
- `{phone}` or `{phoneClean}` - Phone number (with/without formatting)
- `{domain}` - Domain name
- `{ip}` - IP address
- `{company}` - Company name
- `{imageUrl}` - Image URL (for reverse image search)

**Example - Adding a new social media tool:**
```javascript
// Inside the social: { tools: [...] } section:
{ 
    name: "Mastodon", 
    url: "https://mastodon.social/@{username}", 
    badge: "free", 
    fields: ["username"], 
    desc: "View Mastodon profile" 
},
```

---

### Task 2: Add a New Category

**File to edit:** `js/tools-db.js`

Add a new section at the same level as existing categories:

```javascript
// Add this inside SPECTRE_TOOLS = { ... }
newcategory: {
    name: "Category Display Name",
    icon: "🔍",              // Use any emoji
    desc: "Description shown on landing page",
    tools: [
        { name: "Tool 1", url: "...", badge: "free", fields: [...], desc: "..." },
        { name: "Tool 2", url: "...", badge: "freemium", fields: [...], desc: "..." },
    ]
},
```

---

### Task 3: Change Colors/Theme

**File to edit:** `css/variables.css`

The main colors are in the `:root` section:

```css
:root {
    /* Background Colors - darkest to lightest */
    --bg-void: #08090a;        /* Page background */
    --bg-primary: #0d0e10;     /* Main content area */
    --bg-secondary: #131517;   /* Cards, panels */
    
    /* Accent Colors - main brand colors */
    --accent-primary: #3b82f6;   /* Blue - main accent */
    --accent-secondary: #8b5cf6; /* Purple - secondary accent */
    --accent-green: #10b981;     /* Success/positive */
    --accent-amber: #f59e0b;     /* Warning */
    --accent-red: #ef4444;       /* Error/danger */
}
```

**Pre-built themes available:** `dark` (default), `light`, `hacker`, `nord`, `high-contrast`

---

### Task 4: Change the Logo/Branding

**File to edit:** `index.html`

Find the logo section (around line 50-70):

```html
<div class="logo-container">
    <div class="logo-icon">👁️</div>          <!-- Change emoji here -->
    <div class="logo-text">SPECTRE</div>      <!-- Change name here -->
    <div class="logo-tagline">OSINT Intelligence Platform</div>  <!-- Change tagline -->
</div>
```

---

### Task 5: Remove a Tool

**File to edit:** `js/tools-db.js`

1. Find the tool in the appropriate category
2. Delete the entire line (including the comma at the end if not the last item):

```javascript
// DELETE this entire block:
{ name: "ToolName", url: "...", badge: "...", fields: [...], desc: "..." },
```

---

## 📦 Module Reference

### CSS Modules (Styling)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `variables.css` | Colors, fonts, themes, spacing | Changing branding/colors |
| `base.css` | HTML reset, typography, scrollbars | Rarely |
| `components.css` | Buttons, cards, inputs, badges, modals | Adding new UI elements |
| `layout.css` | Landing page, results page, sidebar | Changing page structure |
| `utilities.css` | Tooltips, animations, spacing helpers | Rarely |

### JavaScript Modules (Functionality)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `tools-db.js` | **Tool database** | Adding/removing/editing tools |
| `utils.js` | Utility functions | Rarely (advanced) |
| `storage.js` | LocalStorage handling | Rarely (advanced) |
| `ui.js` | Modals, toasts, sidebar, theme | Adding new UI features |
| `export.js` | Export to JSON/CSV/MD/HTML | Adding export formats |
| `app.js` | Search, filtering, rendering | Adding new features |
| `init.js` | App initialization | Rarely |

---

## 🔌 Load Order (Important!)

The JavaScript files MUST load in this order:

1. `tools-db.js` - Data (no dependencies)
2. `utils.js` - Utilities (no dependencies)
3. `storage.js` - Storage (uses utils)
4. `ui.js` - UI (uses utils, storage)
5. `export.js` - Export (uses utils, ui)
6. `app.js` - App logic (uses all above)
7. `init.js` - **Must be last** (ties everything together)

---

## 🛠️ Troubleshooting

### Tools Not Showing
- Check `js/tools-db.js` for syntax errors (missing commas, brackets)
- Open browser console (F12) and look for red errors
- Ensure the category key matches (lowercase, no spaces)

### Broken Layout
- Check `index.html` for unclosed tags
- Verify all CSS files are linked correctly in the `<head>`

### JavaScript Errors
- Check browser console (F12 → Console tab)
- Ensure all JS files load in the correct order
- Look for missing commas in `tools-db.js`

### Quick Test
1. Open browser console (F12)
2. Type: `SPECTRE.debug()`
3. This shows the current state and any issues

---

## 📋 Badge Types Reference

| Badge | Color | Meaning |
|-------|-------|---------|
| `free` | Green | Completely free, no registration |
| `freemium` | Amber | Free tier available, paid upgrades |
| `paid` | Red | Requires payment |
| `cli` | Purple | Command-line tool (requires installation) |

---

## 🎨 Available Themes

Set theme in `index.html` by adding `data-theme="themename"` to the `<html>` tag:

```html
<html lang="en" data-theme="hacker">
```

| Theme | Description |
|-------|-------------|
| (none/dark) | Default dark theme - blue accents |
| `light` | Light mode - white backgrounds |
| `hacker` | Matrix-style green on black |
| `nord` | Popular Nord color palette |
| `high-contrast` | Accessibility-focused high contrast |

---

## 💡 Tips for Editing

1. **Always backup first** - Copy the file before making changes
2. **Test after each change** - Refresh the browser and check console
3. **Use a code editor** - VS Code, Sublime Text, or even Notepad++
4. **Watch your commas** - Most errors are missing commas in JS arrays
5. **Keep URLs encoded** - Replace spaces with `%20` in URLs

---

## 🚀 Quick Reference: Adding a Tool

```javascript
// In js/tools-db.js, find the right category and add:

{ 
    name: "Display Name",                    // What users see
    url: "https://site.com/?q={username}",  // URL with placeholder
    badge: "free",                           // free/freemium/paid/cli
    fields: ["username"],                    // Required input fields
    desc: "What this tool does"              // Tooltip description
},
```

**That's it!** Save the file and refresh your browser.

---

## 📞 Need Help?

- Check the browser console (F12) for error messages
- Ensure JavaScript files load in the correct order
- Verify all files are in the correct folders
- Check for missing commas or brackets in edited files

---

## 🚀 Power Features (v2.2)

### 🎹 Command Palette (Ctrl+K)

Press `Ctrl+K` (or `Cmd+K` on Mac) anywhere to open the command palette:

- **Quick Search**: Type to fuzzy-search any command, tool, or action
- **Run Workflows**: Execute workflows directly from the palette
- **Tool Jump**: Open any tool instantly by typing its name
- **Export Data**: Quick export to JSON, CSV, Markdown, or HTML
- **Theme Switch**: Change themes without opening settings
- **Recent Commands**: Your last 10 commands are remembered

### 📋 Bulk Input Processing

Process multiple targets at once:

1. Click **📋 Bulk** in the header or press `Ctrl+Shift+B`
2. Paste your list (one item per line):
   ```
   john.doe@example.com
   jane.smith@company.org
   bob.wilson@test.net
   ```
3. SPECTRE auto-detects the input type (email, IP, username, etc.)
4. Click **Process** to run API lookups on all items
5. Results include breach data, reputation scores, and geolocation
6. Export all results to CSV or JSON

**Supported Input Types:**
- Emails → EmailRep breach check
- IP addresses → IPinfo geolocation
- Domains → Certificate transparency
- Usernames → Cross-platform enumeration
- Phone numbers → Format validation

### 🖥️ Results Workspace

A professional split-pane workspace for reviewing results:

1. Run a search as normal
2. Click **🖥️ Workspace** in the toolbar
3. **Left Panel**: List of all active tools with status indicators
4. **Right Panel**: Live iframe preview of the selected tool
5. **Bottom Panel**: Notes area for findings

**Features:**
- Navigate tools with keyboard (←/→ arrows)
- Mark tools as ✅ Useful or 👎 Dead End
- Take notes on each tool directly
- Add findings to your active case
- Filter tools by name
- Open any tool in a new tab

**Note:** Some sites block iframe embedding (Google, Facebook, etc.) - use "New Tab" button for these.

### 📱 PWA Support (Installable App)

SPECTRE can be installed as a standalone app:

1. Click **📱 App** in the header to see install options
2. Or look for the browser's install prompt
3. Once installed, SPECTRE works offline!

**PWA Features:**
- **Install to Home Screen**: Works like a native app
- **Offline Mode**: Core features work without internet
- **Background Sync**: Automatically syncs when back online
- **Cache Management**: View and clear cached data

---

## ⌨️ All Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+Shift+B` | Bulk Input Processor |
| `Ctrl+Shift+W` | Toggle Workspace |
| `Ctrl+Shift+C` | Copy All URLs |
| `Enter` | Run Search |
| `Escape` | Close Modal/Palette |
| `←/→` | Navigate Workspace Tools |

---

*Built with ❤️ for the OSINT community*
