# Design Guidelines

## Philosophy

The UI is designed for **non-technical entrepreneurs** who may not be familiar with complex technical interfaces. The goal is to make powerful AI orchestration feel simple and intuitive.

**Core Principles:**
- Clarity over cleverness
- Progressive disclosure (show basics first, advanced features on demand)
- Consistent patterns across all pages
- Actionable feedback (confirm actions, show results)
- Accessibility built-in (WCAG 2.1 AA minimum)

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Build Tool | Vite | Latest |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui | Latest |
| State Management | React Query | Latest (tanstack/react-query) |
| Routing | React Router | 6 |
| Forms | React Hook Form | Latest |
| Validation | Zod | 3.22+ |

## Design System

### Color Palette

**Primary Colors:**
- Blue-600: Primary actions, links (interactive elements)
- Blue-700: Hover state
- Blue-50: Backgrounds, light sections

**Semantic Colors:**
- Green-600: Success, positive actions, completion
- Red-600: Errors, destructive actions, warnings
- Yellow-500: Warnings, caution
- Gray-500: Disabled, secondary text, dividers
- Gray-900: Primary text

**Background:**
- White: Main backgrounds
- Gray-50: Secondary backgrounds, section dividers
- Gray-100: Hover state for neutral elements

### Typography

```css
/* Headings */
h1: text-4xl font-bold text-gray-900
h2: text-3xl font-bold text-gray-900
h3: text-2xl font-bold text-gray-900
h4: text-lg font-semibold text-gray-900

/* Body */
p: text-base text-gray-700 leading-relaxed
small: text-sm text-gray-600

/* Buttons */
button: text-base font-medium
```

### Spacing

Use Tailwind spacing scale (4px base unit):
- `p-2` (8px): Small padding
- `p-4` (16px): Standard padding
- `p-6` (24px): Large sections
- `gap-4`: Space between elements

### Shadows & Elevation

```css
/* Card elevation */
shadow: box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);

/* Hover elevation */
hover:shadow-md: Increased shadow on hover

/* Deep elevation (modals) */
shadow-xl: For overlays and prominent modals
```

## Component Patterns

### Buttons

**Types:**
```jsx
// Primary action (blue background)
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Primary
</button>

// Secondary action (gray background)
<button className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">
  Secondary
</button>

// Destructive action (red background)
<button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
  Delete
</button>

// Ghost button (text only)
<button className="text-blue-600 hover:text-blue-700 underline">
  Link
</button>
```

**Usage:**
- Primary button: Main action per page (create, save, submit)
- Secondary button: Alternative actions (cancel, back)
- Destructive button: Only for delete/irreversible actions (with confirmation)
- Ghost button: Navigation, minor actions

### Cards

```jsx
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-700">Content goes here</p>
</div>
```

**Usage:** Group related information, section separators

### Forms

```jsx
<form className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-2">
      Email
    </label>
    <input
      type="email"
      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      placeholder="user@example.com"
    />
  </div>

  <div>
    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
      Submit
    </button>
  </div>
</form>
```

**Validation:**
- Show inline errors below field
- Highlight invalid field with red border
- Clear error when user corrects input

### Lists & Tables

**Simple List:**
```jsx
<ul className="space-y-2">
  {items.map((item) => (
    <li key={item.id} className="flex items-center justify-between p-4 border-b">
      <div>
        <h4 className="font-semibold">{item.name}</h4>
        <p className="text-sm text-gray-600">{item.description}</p>
      </div>
      <button className="text-blue-600">View</button>
    </li>
  ))}
</ul>
```

**Data Table:**
```jsx
<table className="w-full">
  <thead>
    <tr className="border-b bg-gray-50">
      <th className="px-4 py-2 text-left font-semibold">Name</th>
      <th className="px-4 py-2 text-left font-semibold">Status</th>
      <th className="px-4 py-2 text-right font-semibold">Actions</th>
    </tr>
  </thead>
  <tbody>
    {data.map((row) => (
      <tr key={row.id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-2">{row.name}</td>
        <td className="px-4 py-2">
          <StatusBadge status={row.status} />
        </td>
        <td className="px-4 py-2 text-right">
          <button className="text-blue-600">Edit</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Status Indicators

```jsx
// Badge (small label)
<span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
  Active
</span>

// Status badge with icon
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full bg-green-600"></div>
  <span className="text-sm">Online</span>
</div>
```

**Status Colors:**
- Green: Active, online, success
- Yellow: Pending, in progress, warning
- Red: Error, offline, terminated
- Gray: Inactive, paused

### Dialogs & Modals

```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
    <h2 className="text-xl font-bold mb-4">Confirm Action</h2>
    <p className="text-gray-700 mb-6">Are you sure?</p>
    <div className="flex gap-2 justify-end">
      <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded">
        Cancel
      </button>
      <button className="px-4 py-2 bg-red-600 text-white rounded">
        Delete
      </button>
    </div>
  </div>
</div>
```

**Guidelines:**
- Use modals for confirmations, forms, important information
- Always include close button
- Disable background interaction
- Focus management (trap focus in modal)

### Loading States

```jsx
// Skeleton loader
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
  ))}
</div>

// Spinner
<div className="flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
</div>

// Loading message
<div className="text-center py-8">
  <p className="text-gray-600">Loading...</p>
</div>
```

## Page Layouts

### Standard Page Layout

```jsx
export function PageTemplate({ title, description, children, actions }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {description && <p className="text-gray-600 mt-2">{description}</p>}
            </div>
            <div className="flex gap-2">{actions}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
```

### Two-Column Layout (Sidebar + Content)

```jsx
export function SidebarLayout({ sidebar, children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

### Grid Layout (Dashboard)

```jsx
export function DashboardLayout({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {children}
    </div>
  );
}
```

## Responsive Design

### Mobile-First Approach

Build for mobile first, then enhance for larger screens:

```jsx
// Mobile (320px): Single column
// Tablet (768px): Two columns
// Desktop (1024px): Three columns

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

### Breakpoints (Tailwind)

| Name | Width | Use Case |
|------|-------|----------|
| sm | 640px | Tablets (landscape) |
| md | 768px | Tablets (portrait) |
| lg | 1024px | Laptops |
| xl | 1280px | Large displays |
| 2xl | 1536px | Very large displays |

### Touch-Friendly Design

- Buttons: Minimum 44x44px (touch target)
- Spacing: Adequate gap between interactive elements
- Mobile menu: Hamburger menu for navigation below md breakpoint
- Avoid hover-only interactions on mobile

## Navigation Patterns

### Top Navigation Bar

```jsx
<nav className="bg-white border-b sticky top-0 z-40">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="text-2xl font-bold">AI Company</div>
    <ul className="flex gap-8">
      <li><a href="/" className="text-gray-700 hover:text-blue-600">Dashboard</a></li>
      <li><a href="/agents" className="text-gray-700 hover:text-blue-600">Agents</a></li>
      <li><a href="/issues" className="text-gray-700 hover:text-blue-600">Issues</a></li>
    </ul>
    <button>Profile</button>
  </div>
</nav>
```

### Breadcrumb Navigation

```jsx
<nav className="flex gap-2 text-sm mb-6">
  <a href="/" className="text-blue-600 hover:underline">Home</a>
  <span className="text-gray-500">/</span>
  <a href="/companies/123" className="text-blue-600 hover:underline">Company</a>
  <span className="text-gray-500">/</span>
  <span className="text-gray-700">Agents</span>
</nav>
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: 4.5:1 ratio (normal), 3:1 ratio (large text)
- Components: 3:1 ratio for UI controls

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Focus visible (outline visible)
- Logical tab order
- No keyboard traps

**Screen Readers:**
- Semantic HTML (buttons, links, forms)
- Image alt text
- ARIA labels for interactive elements
- Form labels linked to inputs

```jsx
// Good accessibility example
<button
  className="px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Create new issue"
  onClick={handleCreate}
>
  New Issue
</button>

// Form with proper labels
<div>
  <label htmlFor="email" className="block text-sm font-medium mb-2">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded"
    aria-required="true"
  />
</div>
```

### Focus Management

```jsx
// Focus management for modal
const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && modalRef.current) {
    modalRef.current.focus();
  }
}, [isOpen]);

return (
  <div ref={modalRef} role="dialog" tabIndex={-1}>
    {/* Modal content */}
  </div>
);
```

## Interaction Patterns

### Confirmation Before Destructive Actions

```jsx
function DeleteButton({ onConfirm }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={() => {
            onConfirm();
            setShowConfirm(false);
          }}
        >
          Delete
        </button>
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      onClick={() => setShowConfirm(true)}
    >
      Delete
    </button>
  );
}
```

### Error Handling & Feedback

```jsx
function Form() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setError(null);
      await submitForm(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-800 rounded border border-green-200">
          Successfully saved!
        </div>
      )}

      {/* Form fields */}
    </div>
  );
}
```

## Performance Optimization

### Code Splitting

```jsx
// Lazy load components
const AgentDetail = lazy(() => import('./AgentDetail'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AgentDetail />
    </Suspense>
  );
}
```

### Image Optimization

```jsx
// Use next-gen formats
<img
  src="image.webp"
  alt="Description"
  loading="lazy"
  width={400}
  height={300}
/>
```

### Bundle Size

- Code splitting by route
- Tree-shaking unused code
- Lazy load heavy libraries
- Monitor with `npm run build --report`

## Dark Mode (Future Enhancement)

When implementing dark mode:

```jsx
// Use CSS variables
:root {
  --bg-primary: white;
  --text-primary: #1f2937;
}

[data-theme="dark"] {
  --bg-primary: #1f2937;
  --text-primary: white;
}

// Use in components
<div style={{ background: "var(--bg-primary)" }}>
  {/* Content */}
</div>
```

## Component Library (shadcn/ui)

Use shadcn/ui components as building blocks:

- Button
- Input
- Card
- Dialog
- Dropdown
- Table
- Tabs
- Tooltip
- etc.

**Don't:**
- Modify shadcn components directly
- Create custom versions of shadcn components

**Do:**
- Use shadcn components as-is
- Extend with Tailwind classes
- Create custom components that compose shadcn

---

**Last Updated:** March 2026
**Version:** 1.0
**Reference:** See [system-architecture.md](./system-architecture.md) for execution flow details
