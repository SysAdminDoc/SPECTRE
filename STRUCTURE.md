# SPECTRE OSINT Platform - Modular Structure Guide

> **Version:** 2.0.0 (Modular)  
> **Last Updated:** January 2026

---

## 📁 File Structure Overview

```
spectre-modular/
├── index.html          ← Main HTML page (edit for layout changes)
├── STRUCTURE.md        ← This documentation file
├── css/
│   ├── variables.css   ← Colors, fonts, themes (EDIT THIS FOR BRANDING)
│   ├── base.css        ← Basic styling (rarely needs editing)
│   ├── components.css  ← Buttons, cards, inputs (UI elements)
│   ├── layout.css      ← Page structure (landing, results)
│   └── utilities.css   ← Helper classes (spacing, animations)
└── js/
    ├── tools-db.js     ← 🔧 TOOL DATABASE (EDIT THIS TO ADD/REMOVE TOOLS)
    ├── utils.js        ← Utility functions (rarely needs editing)
    ├── storage.js      ← Data persistence (rarely needs editing)
    ├── ui.js           ← User interface logic
    ├── export.js       ← Export functionality (JSON, CSV, etc.)
    ├── app.js          ← Core application logic
    └── init.js         ← Initialization (loads last)
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

*Built with ❤️ for the OSINT community*
