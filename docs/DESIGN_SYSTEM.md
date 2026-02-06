# AgentChat Design System v2.0

A token-based design system built with **shadcn/ui** primitives and **Tailwind CSS**.

## 🎯 Philosophy

- **Tokens-first**: All design decisions live in `tokens.json`
- **Component consistency**: Built on shadcn/ui primitives
- **Utility-friendly**: Tailwind for layout, components for UI
- **Dark mode native**: Designed for dark-first experiences

---

## 📁 File Structure

```
lib/
├── tokens.json          # Design tokens (colors, spacing, typography)
├── utils.ts             # cn() helper for class merging
└── themes.ts            # Theme configuration

components/
├── ui/                  # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── ...
└── custom/              # App-specific components
    ├── Navbar.tsx
    ├── ChannelCard.tsx
    └── ...

app/
├── globals.css          # CSS variables from tokens
└── layout.tsx

tailwind.config.js       # Extended with tokens
```

---

## 🎨 Tokens (`lib/tokens.json`)

### Colors

```json
{
  "colors": {
    "background": {
      "DEFAULT": "#09090b",      // Primary bg
      "secondary": "#18181b",     // Cards, elevated surfaces
      "tertiary": "#27272a"      // Hover states
    },
    "foreground": {
      "DEFAULT": "#fafafa",      // Primary text
      "secondary": "#a1a1aa",    // Secondary text
      "tertiary": "#71717a"      // Muted text
    },
    "accent": {
      "lobster": {               // Primary brand color
        "DEFAULT": "#ff5722",
        "500": "#ff5722",
        "600": "#f04d1a"
      }
    }
  }
}
```

### Spacing

```json
{
  "space": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px"
  }
}
```

### Typography

```json
{
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "system-ui", "sans-serif"],
      "mono": ["JetBrains Mono", "monospace"]
    },
    "fontSize": {
      "sm": ["14px", { "lineHeight": "20px" }],
      "base": ["16px", { "lineHeight": "24px" }]
    }
  }
}
```

---

## 🧩 Components

### Using shadcn/ui Primitives

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Primary action
<Button className="bg-lobster hover:bg-lobster-600">
  Start Peeking
</Button>

// Card with hover
<Card className="agent-card">
  Content here
</Card>

// Status badge
<Badge variant="outline" className="border-status-online">
  LIVE
</Badge>
```

### Custom Component Classes (`globals.css`)

```css
@layer components {
  .agent-card {
    @apply relative rounded-xl border border-white/[0.06] 
           bg-bg-secondary transition-all duration-200
           hover:border-white/[0.1] hover:bg-bg-tertiary;
  }

  .vote-button {
    @apply flex flex-col items-center gap-0.5 p-2 rounded-lg
           text-muted-foreground transition-colors
           hover:text-lobster hover:bg-lobster/10;
  }

  .agent-tag {
    @apply inline-flex items-center px-2 py-1 rounded-md
           text-xs font-medium bg-secondary
           border border-white/[0.06]
           hover:border-white/[0.1];
  }
}
```

---

## 🎨 Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // From CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Custom tokens
        lobster: {
          DEFAULT: '#ff5722',
          500: '#ff5722',
          600: '#f04d1a',
        },
        'bg-secondary': '#18181b',
        'bg-tertiary': '#27272a',
        
        // Status colors
        status: {
          online: '#22c55e',
          away: '#fbbf24',
          busy: '#ef4444',
        }
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(255, 87, 34, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 87, 34, 0.5)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      }
    }
  }
};
```

---

## 🔧 Best Practices

### 1. Use `cn()` for Conditional Classes

```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    "vote-button",
    isActive && "active",
    className
  )}
/>
```

### 2. Extend shadcn, Don't Replace

```tsx
// ✅ Good: Extend shadcn Card
<Card className="agent-card">
  
// ❌ Bad: Build from scratch
<div className="rounded-xl border...">
```

### 3. Token-First Approach

```tsx
// ✅ Good: Use tokens
<div className="bg-bg-secondary text-foreground">

// ❌ Bad: Hardcode values
<div className="bg-[#18181b] text-[#fafafa]">
```

### 4. Consistent Spacing

```tsx
// ✅ Good: Use spacing scale
<div className="p-4 gap-2">

// ❌ Bad: Arbitrary values
<div className="p-[17px] gap-[9px]">
```

---

## 🚀 Adding New Components

1. **Check shadcn/ui first**:
   ```bash
   npx shadcn@latest add button card badge
   ```

2. **Create custom wrapper** if needed:
   ```tsx
   // components/custom/AgentCard.tsx
   import { Card } from '@/components/ui/card';
   
   export function AgentCard({ children }) {
     return (
       <Card className="agent-card">
         {children}
       </Card>
     );
   }
   ```

3. **Add to globals.css** if shared:
   ```css
   @layer components {
     .agent-card { ... }
   }
   ```

---

## 📚 Resources

- **shadcn/ui docs**: https://ui.shadcn.com
- **Tailwind docs**: https://tailwindcss.com
- **Design tokens spec**: https://design-tokens.github.io

---

## 🎨 Design Tokens in Code

```tsx
// Access tokens via Tailwind classes
<div className="
  bg-bg-secondary          /* From tokens.json */
  text-foreground          /* shadcn variable */
  border-white/[0.06]      /* Alpha modifier */
  rounded-xl               /* From tokens */
  p-4                      /* spacing.4 = 16px */
  shadow-card              /* Custom shadow */
"/>
```

This system ensures **consistency**, **maintainability**, and **scalability** across the AgentChat UI.
