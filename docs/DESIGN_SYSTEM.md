# Design System & Style Guide

**Stack**: Next.js 15 · Tailwind CSS v4 · shadcn/ui · Radix UI  
**Theme**: Green-tinted (`hue 155`), food-safety focused  
**Source**: `chenda-frontend/src/app/globals.css` · `chenda-frontend/src/components/ui/`

---

## Color Tokens

Two layers of color tokens are used in this project:

1. **Chenda semantic tokens** (`--fresh-*`) — app-specific, directly communicate meaning in the fresh-food domain
2. **shadcn/ui base tokens** — oklch-based, consumed by all shadcn/ui components

### Chenda Semantic Tokens

Defined in `:root` in `globals.css`. Use these in app code instead of raw hex values.

| Token | Light Value | Dark Value | Meaning |
|---|---|---|---|
| `--fresh-primary` | `#2EA44F` | (same) | Brand green — trust, freshness |
| `--fresh-primary-hover` | `#258F44` | (same) | Hover/active state for primary |
| `--fresh-accent` | `#FFD166` | (same) | Yellow — warmth, featured |
| `--fresh-danger` | `#E63946` | (same) | Red — expired, critical, error |
| `--fresh-warning` | `#FFB300` | (same) | Orange — expiring soon, caution |
| `--fresh-surface` | `#F7F9FA` | `#0F1419` | Page/section backgrounds |
| `--fresh-border` | `#E5E7EB` | `#2D3748` | Dividers, card outlines |
| `--fresh-text-primary` | `#111827` | `#F7FAFC` | Body and heading text |
| `--fresh-text-muted` | `#6B7280` | `#A0AEC0` | Captions, metadata, placeholders |

```css
/* Always use tokens, not hardcoded hex */
color: var(--fresh-text-primary);        /* ✓ */
color: #111827;                          /* ✗ */
```

### Status Color Mapping

| Freshness State | Token | Typical Usage |
|---|---|---|
| Fresh / Available | `--fresh-primary` | High freshness badges, in-stock |
| Warning / Expiring Soon | `--fresh-warning` | Low stock, < 30% freshness |
| Expired / Unavailable | `--fresh-danger` | Expired badge, error state |
| Featured / Highlight | `--fresh-accent` | Promoted products |

### shadcn/ui Base Tokens

Configured at oklch hue 155 (green) to match the brand. These are consumed by all shadcn/ui primitives (`Button`, `Card`, `Input`, etc.). Do not use these directly in app-level code — use `--fresh-*` tokens instead.

| Token | Light | Dark |
|---|---|---|
| `--primary` | `oklch(0.55 0.17 155)` | `oklch(0.65 0.17 155)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` |
| `--secondary` | `oklch(0.96 0.01 155)` | `oklch(0.269 0.01 155)` |
| `--muted` | `oklch(0.96 0.005 155)` | `oklch(0.269 0.008 155)` |
| `--muted-foreground` | `oklch(0.50 0.01 155)` | `oklch(0.708 0.01 155)` |
| `--accent` | `oklch(0.90 0.05 85)` | `oklch(0.40 0.08 85)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--background` | `oklch(0.985 0.002 155)` | `oklch(0.145 0.005 155)` |
| `--border` | `oklch(0.90 0.005 155)` | `oklch(1 0 0 / 10%)` |
| `--ring` | `oklch(0.55 0.17 155)` | `oklch(0.65 0.17 155)` |

### Chart Colors

Used in seller analytics dashboards.

| Token | Light Value | Represents |
|---|---|---|
| `--chart-1` | `oklch(0.55 0.17 155)` | Green — primary metric |
| `--chart-2` | `oklch(0.75 0.15 85)` | Yellow — secondary metric |
| `--chart-3` | `oklch(0.577 0.245 27.325)` | Red — alerts |
| `--chart-4` | `oklch(0.70 0.12 200)` | Blue — info |
| `--chart-5` | `oklch(0.80 0.10 60)` | Amber — comparison |

---

## Typography

**Font family**: [Geist Sans](https://vercel.com/font) (body) + Geist Mono (code)  
Loaded via `next/font/google` and aliased as `--font-geist-sans` / `--font-geist-mono`.

```tsx
// Root layout (layout.tsx)
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

### Scale

| Role | Size / Line Height | Tailwind | Weight |
|---|---|---|---|
| Page heading | `28px / 36px` | `text-2xl` | `font-bold` |
| Section header | `22px / 30px` | `text-xl` | `font-semibold` |
| Card title | `18px / 26px` | `text-lg` | `font-medium` |
| Body | `16px / 24px` | `text-base` | `font-normal` |
| Small / label | `12px / 18px` | `text-xs` | `font-medium` |

Use `font-bold` sparingly — page headings only. `font-semibold` for section headers and card titles. `font-medium` for labels, badges, and nav items.

---

## Spacing & Layout

Spacing follows Tailwind's 4px base unit. Standard padding:

| Context | Mobile | Tablet+ |
|---|---|---|
| Page content | `p-4` (16px) | `p-6` (24px) |
| Card content | `px-6 py-6` | same |
| Form field gap | `space-y-4` | same |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `12px` | Cards, containers, modals |
| `--radius-button` | `8px` | Buttons, interactive elements |
| `--radius-input` | `6px` | Text inputs, textareas |
| `--radius` (shadcn base) | `0.625rem` (10px) | shadcn/ui components |
| `--radius-sm` | `calc(--radius - 4px)` = 6px | Small elements |
| `--radius-md` | `calc(--radius - 2px)` = 8px | Medium elements |
| `--radius-lg` | `var(--radius)` = 10px | Default rounded |
| `--radius-xl` | `calc(--radius + 4px)` = 14px | Cards (shadcn) |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-small` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Default card resting state |
| `--shadow-medium` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Card hover elevation |

Cards transition from `shadow-small` → `shadow-medium` on hover:
```tsx
className="shadow-[var(--shadow-small)] hover:shadow-[var(--shadow-medium)]"
```

---

## Responsive Breakpoints

| Breakpoint | Min Width | Layout Change |
|---|---|---|
| (default) | 0 | Single column, `grid-cols-2` product grid |
| `md` | 768px | `grid-cols-3` product grid |
| `lg` | 1024px | `grid-cols-4`, side-by-side map + list |

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" />
<div className="p-4 sm:p-6 lg:p-8" />
<div className="flex flex-col lg:flex-row gap-4" />
```

---

## Layout Architecture

```
┌─────────────────────┐
│   TopHeader         │  sticky top-0 z-40, h-14, border-b, backdrop-blur
├─────────────────────┤
│                     │
│   Scrollable        │  main content, pb-20 to clear BottomNav
│   Content           │
│                     │
├─────────────────────┤
│   BottomNav         │  fixed bottom-0 z-40, h-16, border-t, backdrop-blur
└─────────────────────┘
```

Both navigation bars use `bg-white/95` + `backdrop-blur` with `dark:bg-[var(--fresh-surface)]/95`.

---

## Components

### Button

Source: `components/ui/button.tsx` (shadcn/ui + CVA)

#### Variants

| Variant | Description | When to Use |
|---|---|---|
| `default` | Solid `--primary` fill, white text | Primary actions (Submit, Buy, Confirm) |
| `secondary` | Muted fill, muted text | Secondary actions, filters |
| `destructive` | Red fill, white text | Delete, cancel, danger actions |
| `outline` | Transparent + border | Tertiary actions, toggles |
| `ghost` | No border, hover accent fill | Icon buttons, nav items |
| `link` | Text-only, underline on hover | Inline links |

#### Sizes

| Size | Height | Padding | Use Case |
|---|---|---|---|
| `xs` | 24px (h-6) | `px-2` | Compact badge-like actions |
| `sm` | 32px (h-8) | `px-3` | Table actions, secondary controls |
| `default` | 36px (h-9) | `px-4` | Standard buttons |
| `lg` | 40px (h-10) | `px-6` | Full-width CTAs |
| `icon` | 36×36px | — | Square icon-only button |
| `icon-sm` | 32×32px | — | Small icon button |
| `icon-lg` | 40×40px | — | Large icon button |

```tsx
// Primary CTA
<Button>Add to Cart</Button>

// Destructive
<Button variant="destructive">Delete Product</Button>

// Icon button
<Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>

// Disabled state (use secondary variant)
<Button variant="secondary" disabled>Loading…</Button>
```

Minimum touch target: 44px. For small buttons in reachable areas, ensure adequate surrounding spacing.

### Badge

Source: `components/ui/badge.tsx` (shadcn/ui + CVA)

| Variant | Appearance | Usage |
|---|---|---|
| `default` | `--primary` fill, white text | Fresh / available / verified |
| `secondary` | Muted fill | Neutral labels, categories |
| `destructive` | Red fill, white text | Expired / unavailable |
| `outline` | Border only, foreground text | Inactive states |
| `ghost` | No background | Subtle tags |

For semantic freshness/status badges, use inline `className` overrides on top of a base variant:

```tsx
// Freshness badge — green
<Badge className="bg-[var(--fresh-primary)] text-white border-0">
  <Leaf className="w-3 h-3" /> Fresh
</Badge>

// Warning badge — orange
<Badge className="bg-[var(--fresh-warning)] text-white border-0">
  <Clock className="w-3 h-3" /> Expiring Soon
</Badge>

// Danger badge — red
<Badge variant="destructive">
  <AlertTriangle className="w-3 h-3" /> Expired
</Badge>

// Distance overlay (translucent white)
<Badge className="bg-white/90 text-gray-700">
  <MapPin className="w-3 h-3" /> 2.4 km
</Badge>
```

### Card

Source: `components/ui/card.tsx`

Base: `bg-card text-card-foreground rounded-xl border py-6 shadow-sm`

Sub-components: `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardAction>`, `<CardContent>`, `<CardFooter>`

For product cards, override radius and shadow with Chenda tokens:
```tsx
<Card className="rounded-[var(--radius-card)] shadow-[var(--shadow-small)] border-[var(--fresh-border)] hover:shadow-[var(--shadow-medium)]">
```

### Input

Source: `components/ui/input.tsx`

Height: `h-9` (36px). Rounded: `rounded-md`. Border: `border-input`.

Focus ring: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`  
Error ring: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`

Use `aria-invalid={!!error}` to trigger the error state automatically.

### Textarea

Source: `components/ui/textarea.tsx`

Same token usage as `Input`. Use for multi-line product descriptions.

### Slider

Source: `components/ui/slider.tsx`

Used for weight controls (proximity vs. freshness weighting) in the buyer search form. Renders as a range input on a `--muted` track with a `--primary` filled range and white thumb.

Default range: `min=0 max=100`. Values are sent to the algorithm as 0–1 floats (divide by 100 before API call).

### Select

Source: `components/ui/select.tsx`

Used in product forms (storage condition, unit). Composed of `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`.

### Dialog

Source: `components/ui/dialog.tsx`

Used for order detail modals on the seller orders page. Composed of `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`.

### Sheet

Source: `components/ui/sheet.tsx`

Slide-over panel variant of Dialog. Used for mobile-friendly side panels.

### Progress

Source: `components/ui/progress.tsx`

Used to display freshness percentage on product cards and detail views.

### Tabs

Source: `components/ui/tabs.tsx`

Used in seller dashboard for switching between views. Composed of `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`.

---

## Navigation

### TopHeader (`components/layout/navigation.tsx`)

- `sticky top-0 z-40`, height `h-14`
- Logo (`chenda.png`, 28×28px) + "Chenda" wordmark (`text-lg font-semibold`)
- Right side: Cart icon (buyers only, with item count badge) + Logout button
- Cart badge: `bg-[var(--fresh-primary)] text-white`, absolute position, capped at `9+`

### BottomNav (`components/layout/navigation.tsx`)

- `fixed bottom-0 z-40`, height `h-16`
- Role-adaptive tabs:

| Role | Tabs |
|---|---|
| `buyer` | Search (`/buyer`) · Orders (`/buyer/orders`) · Profile (`/buyer/profile`) |
| `seller` / `both` | Dashboard (`/seller/dashboard`) · Products (`/seller/products`) · Orders (`/seller/orders`) · Profile (`/seller/profile`) |

- Active tab: `text-[var(--fresh-primary)] font-medium`
- Inactive tab: `text-[var(--fresh-text-muted)] hover:text-[var(--fresh-text-primary)]`
- Each tab: icon (`h-5 w-5`) + text label (`text-xs`)

---

## Icon System

Using **Lucide React** icons throughout. Import directly from `lucide-react`.

| Icon | Usage |
|---|---|
| `Package` | Products, inventory, empty product state |
| `MapPin` | Location, distance, address |
| `Clock` | Time, urgency, freshness countdown |
| `User` | Profile, people |
| `Search` | Search tab, search input |
| `LayoutDashboard` | Seller dashboard |
| `ShoppingCart` | Orders tab, cart |
| `ShoppingBag` | Empty orders state |
| `SearchX` | No search results |
| `AlertTriangle` | Warnings, caution |
| `Leaf` | Freshness indicator |
| `LogOut` | Logout button |
| `CircleCheck` | Success toast |
| `OctagonX` | Error toast |
| `TriangleAlert` | Warning toast |
| `Info` | Info toast |

**Sizing conventions:**

| Context | Size Class |
|---|---|
| Navigation tabs | `h-5 w-5` |
| TopHeader actions | `h-5 w-5` |
| Body / button icons (auto) | `size-4` (via button CVA) |
| Badge icons | `w-3 h-3` |
| Empty state illustrations | `h-12 w-12` or `h-16 w-16` |

---

## Loading & Empty States

Source: `components/layout/states.tsx`

### Loading States

| Component | Usage |
|---|---|
| `<PageLoading />` | Full-page spinner (`min-h-[60vh]`) using `--fresh-primary` border spinner |
| `<ProductCardSkeleton />` | Skeleton matching `ProductCard` shape (image + content rows) |
| `<CardGridSkeleton />` | 2-column grid of `ProductCardSkeleton` |
| `<FormSkeleton />` | Skeleton for profile/product forms |
| `<MapSkeleton />` | Skeleton for Leaflet map areas |

Spinner color: `border-[var(--fresh-primary)] border-t-transparent animate-spin`  
Skeleton base: `bg-accent animate-pulse rounded-md`

### Empty States

Always provide: icon + title + description + action button.

```tsx
// No products found
<div className="flex flex-col items-center gap-3 py-12 text-center">
  <SearchX className="h-12 w-12 text-[var(--fresh-text-muted)]" />
  <p className="font-medium text-[var(--fresh-text-primary)]">No products found</p>
  <p className="text-sm text-[var(--fresh-text-muted)]">Try adjusting your search filters</p>
  <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
</div>
```

### Error States

```tsx
<div className="flex flex-col items-center gap-3 py-12 text-center">
  <AlertTriangle className="h-12 w-12 text-[var(--fresh-danger)]" />
  <p className="font-medium">Something went wrong</p>
  <p className="text-sm text-[var(--fresh-text-muted)]">{errorMessage}</p>
  <Button onClick={retry}>Try Again</Button>
</div>
```

---

## Toast Notifications

Source: `components/ui/sonner.tsx` — configured in root layout.

```tsx
// Root layout configuration
<Toaster position="top-center" richColors closeButton />
```

| Type | Function | When |
|---|---|---|
| Success | `toast.success("message")` | Order placed, profile saved, product added |
| Error | `toast.error("message")` | API failures, validation errors |
| Warning | `toast.warning("message")` | Low stock, expiring soon |
| Info | `toast.info("message")` | General notifications |

Custom icons: `CircleCheckIcon` (success), `OctagonXIcon` (error), `TriangleAlertIcon` (warning), `InfoIcon` (info).

Toast styling inherits `--popover` / `--popover-foreground` / `--border` / `--radius` tokens automatically.

---

## Interactive States

```css
/* Hover — cards and container surfaces */
hover:shadow-[var(--shadow-medium)]

/* Focus ring (keyboard accessibility) — primary color */
focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)]
focus-visible:ring-[var(--fresh-primary)]/50

/* shadcn/ui standard focus ring */
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]

/* Disabled */
disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed

/* Active/pressed */
active:scale-[0.98] transition
```

---

## Auth Pages

Centered single-card layout, no navigation bars.

```tsx
<div className="min-h-screen flex items-center justify-center bg-[var(--fresh-surface)]">
  <Card className="w-full max-w-md mx-4">
    {/* Logo + app name */}
    {/* Form fields */}
    {/* Submit button */}
    {/* Link to alternate auth page */}
  </Card>
</div>
```

Pages: `/login`, `/register` (public, no `TopHeader` or `BottomNav`).

---

## Currency & Number Formatting

- **Currency**: Philippine Peso (₱)
- **Amount format**: `₱${amount.toFixed(2)}`
- **Freshness**: `${Math.round(freshness)}%`
- **Distance**: `${distance.toFixed(1)} km`

---

## Dark Mode

Dark mode is toggled via the `.dark` class (managed by `next-themes`). Adjustments in `.dark`:

- `--fresh-surface`: `#F7F9FA` → `#0F1419`
- `--fresh-border`: `#E5E7EB` → `#2D3748`
- `--fresh-text-primary`: `#111827` → `#F7FAFC`
- `--fresh-text-muted`: `#6B7280` → `#A0AEC0`
- All shadcn/ui base tokens switch to darker oklch variants

The `--fresh-primary`, `--fresh-danger`, `--fresh-warning`, and `--fresh-accent` colors do **not** change in dark mode.
