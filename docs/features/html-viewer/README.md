# HTML Viewer Feature

A simple browser for local HTML files stored in the project's `public/html-files/` directory. Useful for viewing static reports, invoices, prototypes, or any self-contained HTML documents.

## Overview

The HTML Viewer is a read-only file browser accessible at `/html-viewer`. It displays a searchable, card-based grid of registered HTML files. Each card shows the file name, description, creation date, and file size, with an "Open" button that opens the file in a new browser tab.

## Features

- Card grid layout (responsive: 1 → 2 → 3 columns)
- Live search/filter by file name
- File metadata: name, description, creation date, size
- Opens files in a new tab with full browser rendering
- No backend required — file list is statically configured

## File Structure

```
src/features/html-viewer/
├── index.tsx           # HtmlViewer component
└── data/
    └── files.ts        # Static file registry

public/
└── html-files/         # HTML files served at /html-files/<filename>
```

## Adding New HTML Files

### Step 1: Add the file

Place your HTML file in `public/html-files/`:
```
public/html-files/my-report.html
```

### Step 2: Register the file

Edit `src/features/html-viewer/data/files.ts` and add an entry:

```typescript
export const htmlFiles: HtmlFile[] = [
  // ... existing files ...
  {
    id: '6',
    name: 'My Report',
    description: 'A brief description of the report.',
    path: '/html-files/my-report.html',
    createdAt: '2026-02-25',
    size: '120 KB',
  },
]
```

### HtmlFile Type

```typescript
type HtmlFile = {
  id: string        // Unique identifier
  name: string      // Display name shown in the card
  description: string  // Short description shown in the card
  path: string      // URL path (relative to public/, starts with /)
  createdAt: string // Display date (any string format)
  size: string      // Display size (any string format)
}
```

## Route

```
/html-viewer
```

Defined in `src/routes/_authenticated/html-viewer/index.tsx`.

## Notes

- HTML files must be placed in `public/` so Vite serves them as static assets
- Files opened via "Open" are rendered by the browser natively — no sandboxing or iframe
- The file list is static; there is no upload interface or backend integration
- Search filters by `file.name` only (not description or other fields)

## Developer Guidelines

### Extending the Viewer

If you need to add dynamic loading (e.g., from a database or directory scan), the pattern would be:
1. Replace the static `htmlFiles` array with a TanStack Query hook
2. Fetch file metadata from PocketBase or a server endpoint
3. Keep the existing card UI — it's already built to render from the `HtmlFile` type

### Sidebar Entry

The HTML Viewer is registered in `src/components/layout/data/sidebar-data.ts` under the "General" group:
```typescript
{
  title: 'HTML Viewer',
  url: '/html-viewer',
  icon: FileText,
}
```
