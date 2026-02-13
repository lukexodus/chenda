Based on your comprehensive project documentation, here are the key design and style principles from your CHENDA fresh market application that you should transfer to your new, simpler frontend:

## 🎨 **Core Design System**

### **Color Palette (Food-Safety Focused)**
```css
/* Primary Colors */
--fresh-primary: #2EA44F;     /* Green - trust, freshness */
--fresh-accent: #FFD166;      /* Yellow - energy, warmth */
--fresh-danger: #E63946;      /* Red - urgency, expiration */
--fresh-warning: #FFB300;     /* Orange - caution */

/* Neutrals */
--fresh-surface: #F7F9FA;     /* Clean backgrounds */
--fresh-border: #E5E7EB;      /* Subtle separators */
--fresh-text-primary: #111827; /* High contrast */
--fresh-text-muted: #6B7280;  /* Secondary info */
```

### **Typography Scale**
```css
--text-h1: 28px / 36px;       /* Main headings */
--text-h2: 22px / 30px;       /* Section headers */
--text-h3: 18px / 26px;       /* Card titles */
--text-body: 16px / 24px;     /* Body text */
--text-small: 12px / 18px;    /* Labels, captions */
```

### **Spacing & Radius System**
```css
--radius-card: 12px;          /* Cards, containers */
--radius-button: 8px;         /* Interactive elements */
--radius-input: 6px;          /* Form fields */

--shadow-small: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
```

## 🧩 **Component Design Patterns**

### **1. Card-Based Layout**
Your ProductCard pattern with trust and urgency indicators:
```tsx
<div className="bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-small)] border border-[var(--fresh-border)]">
  {/* Status badges with color coding */}
  <Badge className={`${getUrgencyColor()} text-white border-0`}>
    <Clock className="w-3 h-3 mr-1" />
    {getStatusText()}
  </Badge>
  
  {/* Clear information hierarchy */}
  <h3 className="font-medium text-[var(--fresh-text-primary)]">{title}</h3>
  <p className="text-[var(--fresh-text-muted)]">{subtitle}</p>
  
  {/* Action button */}
  <Button className="w-full mt-3">Primary Action</Button>
</div>
```

### **2. Status-Driven UI**
Color-coded system based on urgency/state:
```tsx
const getStatusColor = (status) => {
  if (critical) return 'bg-[var(--fresh-danger)]';    // Red
  if (warning) return 'bg-[var(--fresh-warning)]';    // Orange 
  return 'bg-[var(--fresh-primary)]';                 // Green
};
```

### **3. Mobile-First Navigation**
Role-based bottom navigation:
```tsx
// Adapt tabs based on user context
const tabs = userRole === 'consumer' 
  ? [{ id: 'products', icon: Package }, { id: 'profile', icon: User }]
  : [{ id: 'dashboard', icon: Home }, { id: 'settings', icon: Settings }];
```

## 📱 **Responsive Design Patterns**

### **Mobile-First Approach**
```tsx
// Progressive enhancement
<div className="text-3xl sm:text-4xl lg:text-5xl">
<div className="p-4 sm:p-6 lg:p-8">
<div className="w-full max-w-md"> {/* Mobile constraint */}
```

### **Adaptive Components**
```tsx
// Component behavior changes by screen size
{showDistance && (
  <Badge className="absolute top-2 right-2 bg-white/90">
    <MapPin className="w-3 h-3 mr-1" />
    {distance}
  </Badge>
)}
```

## 🎯 **UX Principles**

### **1. Information Hierarchy**
- **Primary**: Status/urgency information (freshness, availability)
- **Secondary**: Core details (title, price)
- **Tertiary**: Metadata (distance, seller info)

### **2. Progressive Disclosure**
```tsx
// Summary on card, details on click
const handleCardClick = () => {
  if (onViewDetail) {
    onViewDetail({ id, title, ...allDetails });
  }
};
```

### **3. Clear Actions with Context**
```tsx
<Button
  onClick={(e) => {
    e.stopPropagation(); // Don't trigger card click
    onPrimaryAction?.(id);
  }}
  disabled={isDisabled}
  variant={isDisabled ? "secondary" : "default"}
>
  {isDisabled ? 'Unavailable' : 'Primary Action'}
</Button>
```

## 🌟 **Visual Elements**

### **Icon System** (Lucide Icons)
- `Package` for products/inventory
- `MapPin` for location
- `Clock` for time/urgency  
- `User` for profile/people
- `Star` for ratings/quality

### **Badge System**
```tsx
// Status badges with semantic colors
<Badge className="bg-[var(--fresh-primary)] text-white">
  <Icon className="w-3 h-3 mr-1" />
  Status Text
</Badge>
```

### **Interactive States**
```css
/* Hover effects */
.hover\:shadow-lg:hover { box-shadow: var(--shadow-medium); }
.hover\:underline:hover { text-decoration: underline; }

/* Focus states */
.focus-visible\:ring-ring\/50:focus-visible { 
  ring: 3px solid var(--fresh-primary)/50; 
}
```

## 🛠 **Implementation Architecture**

### **CSS Custom Properties**
Use semantic tokens, not hardcoded values:
```css
/* Good */
color: var(--fresh-text-primary);
border-radius: var(--radius-card);

/* Avoid */
color: #111827;
border-radius: 12px;
```

### **Component Composition**
State-driven rendering patterns:
```tsx
{status === 'login' && <LoginForm />}
{status === 'register' && <RegisterForm />}
{status === 'success' && <SuccessMessage />}
```

### **Prop-Based Variants**
```tsx
interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  status?: 'active' | 'pending' | 'disabled';
}
```

## 🎯 **Key Transferable Patterns**

1. **Trust-First Design**: Clear status indicators, verification systems
2. **Urgency Communication**: Color-coded status, time-sensitive information  
3. **Mobile-Responsive**: Touch-friendly, progressive enhancement
4. **Information Density**: Essential info first, progressive disclosure
5. **Semantic Design Tokens**: Maintainable, consistent styling system
6. **Status-Based UI**: Components adapt based on data state
7. **Clear Action Hierarchy**: Primary actions prominent, secondary subtle

## 📋 **Implementation Checklist**

- [ ] Set up CSS custom properties with your color system
- [ ] Create base card component with status variants
- [ ] Implement badge system for status communication  
- [ ] Add responsive typography and spacing scales
- [ ] Create mobile-first navigation pattern
- [ ] Implement loading and empty states
- [ ] Add hover/focus states for interactivity
- [ ] Test on mobile devices

This design system balances **clarity** (essential for any app) with **status communication** (adapted to your app's needs) while maintaining **mobile usability** throughout. The semantic token approach makes it highly transferable to any new project.

