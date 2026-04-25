# Chenda Frontend Design System

Design principles, tokens, and visual patterns for the Chenda fresh marketplace frontend.

---

## Color Palette

Food-safety focused color system communicating trust, freshness, and urgency.

```css
/* Primary */
--fresh-primary: #2EA44F;      /* Green — trust, freshness */
--fresh-accent: #FFD166;       /* Yellow — energy, warmth */
--fresh-danger: #E63946;       /* Red — urgency, expiration */
--fresh-warning: #FFB300;      /* Orange — caution */

/* Neutrals */
--fresh-surface: #F7F9FA;      /* Clean backgrounds */
--fresh-border: #E5E7EB;       /* Subtle separators */
--fresh-text-primary: #111827; /* High contrast text */
--fresh-text-muted: #6B7280;   /* Secondary / caption text */
```

### Status Color Mapping

| State      | Color              | Usage                             |
|------------|--------------------|-----------------------------------|
| Fresh/Good | `--fresh-primary`  | In-stock, high freshness          |
| Warning    | `--fresh-warning`  | Expiring soon, low stock          |
| Critical   | `--fresh-danger`   | Expired, unavailable              |
| Highlight  | `--fresh-accent`   | Featured items, promotions        |

---

## Typography

```css
--text-h1: 28px / 36px;   /* Page headings */
--text-h2: 22px / 30px;   /* Section headers */
--text-h3: 18px / 26px;   /* Card titles */
--text-body: 16px / 24px;  /* Body text */
--text-small: 12px / 18px; /* Labels, captions, badges */
```

Use `font-medium` for card titles, `font-semibold` for section headers, and `font-bold` sparingly for page headings only.

---

## Spacing, Radius & Shadows

```css
/* Border radius */
--radius-card: 12px;     /* Cards, containers */
--radius-button: 8px;    /* Buttons, interactive elements */
--radius-input: 6px;     /* Form fields */

/* Shadows */
--shadow-small: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-medium: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
```

Spacing follows Tailwind's 4px base unit. Standard content padding is `p-4` on mobile, `p-6` on tablet+.

---

## Layout Architecture

### Mobile-First Vertical Stack

```
┌─────────────────────┐
│   TopAppHeader      │  ← Fixed, context-aware title
├─────────────────────┤
│                     │
│   Scrollable        │  ← Main content area
│   Content           │
│                     │
├─────────────────────┤
│   BottomNav         │  ← Fixed, role-based tabs
└─────────────────────┘
```

- **Fixed header + footer**: Navigation always accessible
- **Scrollable middle**: Content scrolls between the fixed bars
- **Bottom padding**: Content area uses `pb-20` to clear the fixed bottom nav

### Responsive Breakpoints

| Breakpoint | Layout                                         |
|------------|------------------------------------------------|
| Mobile     | Single column, 2-col product grid              |
| `md`       | 3-col product grid                             |
| `lg`       | 4-col product grid, side-by-side map + list    |

```tsx
// Progressive enhancement pattern
<div className="p-4 sm:p-6 lg:p-8">
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
<div className="flex flex-col lg:flex-row gap-4">
```

---

## Navigation

### Top Header

- Displays app name "Chenda" by default with logo
- Shows contextual title + back button when in detail views
- Keeps location indicator visible

### Bottom Navigation

Role-adapted, maximum 4 tabs:

| Role   | Tabs                                    |
|--------|-----------------------------------------|
| Buyer  | Search · Orders · Profile               |
| Seller | Dashboard · Products · Orders · Profile |

Each tab uses icon + label. Badge indicators for unread counts.

### Navigation Hierarchy

Detail views layer over the main content. Back button unwinds the stack:

```
Level 0: Tab views (Search, Dashboard, etc.)
Level 1: Detail views (Product detail, Vendor detail)
Level 2: Modals (Checkout, Location picker)
```

---

## Component Patterns

### Product Card

```tsx
<Card className="rounded-[var(--radius-card)] shadow-[var(--shadow-small)] border border-[var(--fresh-border)]">
  {/* Status badge — top corner */}
  <Badge className="bg-[statusColor] text-white">
    <Clock className="w-3 h-3 mr-1" />
    Freshness label
  </Badge>

  {/* Image */}
  {/* Title — font-medium, --fresh-text-primary */}
  {/* Price + metadata — --fresh-text-muted */}
  {/* Distance badge if location available */}

  <Button className="w-full mt-3">Add to Cart</Button>
</Card>
```

Cards use hover elevation: `hover:shadow-[var(--shadow-medium)]`.

### Badge System

Semantic color badges for statuses:

```tsx
<Badge className="bg-[var(--fresh-primary)] text-white border-0">
  <Icon className="w-3 h-3 mr-1" />
  Label
</Badge>
```

- Green badge: fresh / available / verified
- Orange badge: expiring soon / low stock
- Red badge: expired / unavailable
- White/translucent badge: distance overlay (`bg-white/90`)

### Dashboard Metrics

Seller/admin dashboards use a metrics grid at top, content below:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard />
</div>
<div className="mt-6 space-y-6">
  {/* Charts, tables, lists */}
</div>
```

### Search Interface

Stacked structure:

```
Search input
Filter controls (sliders, toggles)
Sort options (dropdown/tabs)
Results grid (product cards)
Map toggle (optional overlay)
```

---

## Loading & Empty States

### Skeleton Loading

Match the shape of the content being loaded:

```tsx
// Card grid skeleton
<div className="grid grid-cols-2 gap-4">
  <Skeleton className="h-48 rounded-[var(--radius-card)]" />
  <Skeleton className="h-48 rounded-[var(--radius-card)]" />
</div>

// Text skeleton
<Skeleton className="h-4 w-32" />
```

Use the app's primary color for spinner: `border-[var(--fresh-primary)]`.

### Empty States

Always provide icon + title + description + action:

```tsx
<EmptyState
  icon={Package}
  title="No products found"
  description="Try adjusting your search filters"
  action={<Button>Reset Filters</Button>}
/>
```

### Error States

- Clear error message
- Retry button
- Dev-only error details

---

## Icon System

Using **Lucide React** icons consistently:

| Icon      | Usage                    |
|-----------|--------------------------|
| `Package` | Products, inventory      |
| `MapPin`  | Location, distance       |
| `Clock`   | Time, urgency, freshness |
| `User`    | Profile, people          |
| `Star`    | Ratings, quality         |
| `Search`  | Search tab               |
| `Home`    | Dashboard                |
| `Leaf`    | Freshness indicator      |

Icon sizing: `w-4 h-4` in body text, `w-3 h-3` inside badges, `w-5 h-5` in navigation.

---

## Interactive States

```css
/* Hover — cards and clickable surfaces */
hover:shadow-[var(--shadow-medium)]

/* Focus — keyboard accessibility */
focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)]/50

/* Disabled */
opacity-50 cursor-not-allowed

/* Active/pressed */
scale-[0.98] transition
```

Buttons use the `default` variant for primary actions, `secondary` for secondary, `destructive` for danger. Disabled buttons switch to `secondary` variant.

---

## UX Principles

### Information Hierarchy

1. **Primary**: Status/urgency (freshness badge, availability)
2. **Secondary**: Core details (title, price)
3. **Tertiary**: Metadata (distance, seller name)

### Progressive Disclosure

- Card shows summary (image, title, price, freshness badge)
- Click opens full detail view (description, seller info, location, add to cart)
- Further drill-down to vendor profile

### Touch-First Design

- **44px minimum** touch target size
- Adequate spacing between clickable elements
- Important actions in thumb-reachable zones (bottom nav)
- Natural scroll behavior for content areas

### User Feedback

- Toast notifications for actions (add to cart, profile saved, errors)
- High-priority toasts: 6s duration with close button
- Position: top-center
- Use Sonner with `richColors` and `closeButton`

---

## CSS Approach

Use semantic design tokens, not hardcoded values:

```css
/* Preferred */
color: var(--fresh-text-primary);
border-radius: var(--radius-card);
box-shadow: var(--shadow-small);

/* Avoid */
color: #111827;
border-radius: 12px;
```

shadcn/ui component theming uses oklch-based CSS variables (green-tinted, hue 155) defined in `globals.css`. Custom `--fresh-*` tokens layer on top for app-specific semantics.

Dark mode is supported via `.dark` class with adjusted oklch values.

---

## Auth Pages

Centered card layout, no navigation bars:

```tsx
<div className="min-h-screen flex items-center justify-center bg-[var(--fresh-surface)]">
  <Card className="w-full max-w-md">
    {/* Logo + app name */}
    {/* Form fields */}
    {/* Submit button */}
    {/* Link to alternate auth page */}
  </Card>
</div>
```

---

## Currency

Philippine Peso (₱). Format: `₱{amount.toFixed(2)}`.
