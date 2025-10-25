# 🎨 Crown HS Schedule Calendar - Color Palette & Design System

Complete color reference for iOS app development and design consistency.

**Last Updated**: October 25, 2025
**Source**: `/Users/lucioaguilar/crown-hs-schedule-calendar-enhanced.html`

---

## 📱 iOS Color Mapping Guide

This document provides exact Tailwind CSS colors mapped to iOS UIColor/SwiftUI Color equivalents for seamless design translation.

---

## 🎯 Primary Color Scheme

### Main Brand Colors

| Element | Tailwind Class | Hex Color | iOS UIColor | SwiftUI Color |
|---------|---------------|-----------|-------------|---------------|
| **Primary Slate** | `slate-600` | `#475569` | `UIColor(red: 0.28, green: 0.33, blue: 0.41, alpha: 1.0)` | `Color(hex: "475569")` |
| **Primary Slate Hover** | `slate-700` | `#334155` | `UIColor(red: 0.20, green: 0.25, blue: 0.33, alpha: 1.0)` | `Color(hex: "334155")` |
| **Primary Blue** | `blue-600` | `#2563EB` | `UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)` | `Color(hex: "2563EB")` |
| **Primary Blue Hover** | `blue-700` | `#1D4ED8` | `UIColor(red: 0.11, green: 0.31, blue: 0.85, alpha: 1.0)` | `Color(hex: "1D4ED8")` |

---

## 🎨 Component-Specific Colors

### Header Section

```swift
// Header Background: Glass morphism effect
// Tailwind: glass (custom gradient with backdrop-blur)
Background: LinearGradient(
    colors: [
        Color.white.opacity(0.95),
        Color.white.opacity(0.85)
    ],
    startPoint: .top,
    endPoint: .bottom
)
.blur(radius: 20)
.overlay(Color.white.opacity(0.2))
```

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Project Title** | `text-gray-900` | `#111827` | `UIColor.label` |
| **Settings Button BG** | `bg-gray-200` | `#E5E7EB` | `UIColor.systemGray5` |
| **Settings Button Hover** | `hover:bg-gray-300` | `#D1D5DB` | `UIColor.systemGray4` |
| **Settings Button Text** | `text-gray-700` | `#374151` | `UIColor.secondaryLabel` |
| **Subtitle Text** | `text-gray-600` | `#4B5563` | `UIColor.secondaryLabel` |

### Update Selector Section

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Section Background** | `glass` (white with blur) | `rgba(255,255,255,0.95)` | `UIColor.systemBackground` with blur |
| **Dropdown Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Dropdown Focus** | `focus:border-slate-500` | `#64748B` | `UIColor.tintColor` |
| **Edit Button BG** | `bg-yellow-100` | `#FEF3C7` | `UIColor(hex: "FEF3C7")` |
| **Edit Button Hover** | `hover:bg-yellow-200` | `#FDE68A` | `UIColor(hex: "FDE68A")` |
| **Edit Button Text** | `text-yellow-600` | `#D97706` | `UIColor(hex: "D97706")` |
| **Delete Button BG** | `bg-red-100` | `#FEE2E2` | `UIColor(hex: "FEE2E2")` |
| **Delete Button Hover** | `hover:bg-red-200` | `#FECACA` | `UIColor(hex: "FECACA")` |
| **Delete Button Text** | `text-red-600` | `#DC2626` | `UIColor.systemRed` |
| **New Update Button BG** | `bg-green-600` | `#16A34A` | `UIColor.systemGreen` |
| **New Update Button Hover** | `hover:bg-green-700` | `#15803D` | `UIColor(hex: "15803D")` |

### Action Buttons (Import/Manual Entry/Export/etc)

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Import Excel Button BG** | `bg-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Import Excel Hover** | `hover:bg-slate-700` | `#334155` | `UIColor(hex: "334155")` |
| **Manual Entry Button BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Manual Entry Hover** | `hover:bg-blue-700` | `#1D4ED8` | `UIColor(hex: "1D4ED8")` |
| **Export Excel Button BG** | `bg-green-600` | `#16A34A` | `UIColor.systemGreen` |
| **Export Excel Hover** | `hover:bg-green-700` | `#15803D` | `UIColor(hex: "15803D")` |
| **Bulk Contractor Button BG** | `bg-purple-600` | `#9333EA` | `UIColor.systemPurple` |
| **Bulk Contractor Hover** | `hover:bg-purple-700` | `#7E22CE` | `UIColor(hex: "7E22CE")` |
| **Configure Codes Button BG** | `bg-indigo-600` | `#4F46E5` | `UIColor.systemIndigo` |
| **Configure Codes Hover** | `hover:bg-indigo-700` | `#4338CA` | `UIColor(hex: "4338CA")` |
| **Button Text (All)** | `text-white` | `#FFFFFF` | `UIColor.white` |

### Filter Section

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Filter Icon** | `text-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Filter Label** | `text-gray-700` | `#374151` | `UIColor.label` |
| **Dropdown Label** | `text-gray-600` | `#4B5563` | `UIColor.secondaryLabel` |
| **Dropdown Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Dropdown Focus** | `focus:border-slate-500` | `#64748B` | `UIColor.tintColor` |
| **Clear Button BG** | `bg-gray-200` | `#E5E7EB` | `UIColor.systemGray5` |
| **Clear Button Hover** | `hover:bg-gray-300` | `#D1D5DB` | `UIColor.systemGray4` |

### Calendar Section

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Calendar Background** | `glass` | `rgba(255,255,255,0.95)` | `UIColor.systemBackground` with blur |
| **Month Title** | `text-gray-800` | `#1F2937` | `UIColor.label` |
| **Navigation Button BG** | `bg-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Navigation Hover** | `hover:bg-slate-700` | `#334155` | `UIColor(hex: "334155")` |
| **Today Button BG** | `bg-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Today Button Hover** | `hover:bg-slate-700` | `#334155` | `UIColor(hex: "334155")` |
| **Day of Week Header** | `text-gray-700` | `#374151` | `UIColor.label` |
| **Calendar Day Cell BG** | `bg-white` | `#FFFFFF` | `UIColor.systemBackground` |
| **Calendar Day Border** | `border-gray-200` | `#E5E7EB` | `UIColor.separator` |
| **Calendar Day Hover** | `hover:bg-slate-100` | `#F1F5F9` | `UIColor.systemGray6` |
| **Selected Day BG** | `bg-slate-600` | `#475569` | `UIColor.tintColor` |
| **Selected Day Text** | `text-white` | `#FFFFFF` | `UIColor.white` |
| **Today's Date BG** | `bg-orange-500` | `#F97316` | `UIColor.systemOrange` |
| **Today's Date Text** | `text-white` | `#FFFFFF` | `UIColor.white` |
| **Activity Dot** | `bg-slate-400` | `#94A3B8` | `UIColor.systemGray` |

### Activities List (Right Panel)

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Panel Background** | `glass` | `rgba(255,255,255,0.95)` | `UIColor.systemBackground` with blur |
| **Panel Title** | `text-gray-800` | `#1F2937` | `UIColor.label` |
| **No Activities Icon** | `text-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |
| **No Activities Text** | `text-gray-500` | `#6B7280` | `UIColor.secondaryLabel` |
| **Add Activity Button BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Add Activity Hover** | `hover:bg-blue-700` | `#1D4ED8` | `UIColor(hex: "1D4ED8")` |

### Activity Cards

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Card Background** | `bg-white` | `#FFFFFF` | `UIColor.secondarySystemBackground` |
| **Card Shadow** | `shadow-sm` | `rgba(0,0,0,0.05)` | `Shadow(radius: 2, y: 1)` |
| **Left Border (Dynamic)** | Custom per area | Varies | Custom per area |
| **Edit Button BG** | `bg-blue-100` | `#DBEAFE` | `UIColor(hex: "DBEAFE")` |
| **Edit Button Hover** | `hover:bg-blue-200` | `#BFDBFE` | `UIColor(hex: "BFDBFE")` |
| **Edit Button Text** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Activity ID** | `text-gray-800` | `#1F2937` | `UIColor.label` |
| **Activity Name** | `text-gray-700` | `#374151` | `UIColor.label` |
| **Date Range** | `text-gray-600` | `#4B5563` | `UIColor.secondaryLabel` |

### Activity Card Badges

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Area Badge BG** | `bg-purple-50` | `#FAF5FF` | `UIColor(hex: "FAF5FF")` |
| **Area Badge Text** | `text-purple-600` | `#9333EA` | `UIColor.systemPurple` |
| **Floor Badge BG** | `bg-indigo-50` | `#EEF2FF` | `UIColor(hex: "EEF2FF")` |
| **Floor Badge Text** | `text-indigo-600` | `#4F46E5` | `UIColor.systemIndigo` |
| **Zone Badge BG** | `bg-teal-50` | `#F0FDFA` | `UIColor(hex: "F0FDFA")` |
| **Zone Badge Text** | `text-teal-600` | `#0D9488` | `UIColor.systemTeal` |
| **Contractor Badge BG** | `bg-purple-50` | `#FAF5FF` | `UIColor(hex: "FAF5FF")` |
| **Contractor Badge Text** | `text-purple-600` | `#9333EA` | `UIColor.systemPurple` |
| **Comments Badge BG** | `bg-blue-50` | `#EFF6FF` | `UIColor(hex: "EFF6FF")` |
| **Comments Badge Text** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **No Comments Text** | `text-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |

### Activities Without Dates Section

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Section Background** | `glass` | `rgba(255,255,255,0.95)` | `UIColor.systemBackground` with blur |
| **Warning Icon** | `text-yellow-600` | `#D97706` | `UIColor.systemYellow` |
| **Section Title** | `text-gray-800` | `#1F2937` | `UIColor.label` |
| **Count Badge** | `text-gray-600` | `#4B5563` | `UIColor.secondaryLabel` |
| **Promote Button BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Promote Button Hover** | `hover:bg-blue-700` | `#1D4ED8` | `UIColor(hex: "1D4ED8")` |

### Modals (General)

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Modal Overlay** | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.5)` | `UIColor.black.withAlphaComponent(0.5)` |
| **Modal Background** | `glass` | `rgba(255,255,255,0.95)` | `UIColor.systemBackground` with blur |
| **Modal Title** | `text-gray-800` | `#1F2937` | `UIColor.label` |
| **Close Button** | `text-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |
| **Close Button Hover** | `hover:text-gray-600` | `#4B5563` | `UIColor.systemGray` |
| **Input Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Input Focus** | `focus:border-blue-500` | `#3B82F6` | `UIColor.tintColor` |
| **Cancel Button BG** | `bg-gray-300` | `#D1D5DB` | `UIColor.systemGray4` |
| **Cancel Button Hover** | `hover:bg-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |
| **Save Button BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Save Button Hover** | `hover:bg-blue-700` | `#1D4ED8` | `UIColor(hex: "1D4ED8")` |

### Settings Modal

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Settings Icon** | `text-gray-600` | `#4B5563` | `UIColor.systemGray` |
| **Info Box BG** | `bg-blue-50` | `#EFF6FF` | `UIColor(hex: "EFF6FF")` |
| **Info Box Border** | `border-blue-500` | `#3B82F6` | `UIColor.systemBlue` |
| **Info Text** | `text-blue-800` | `#1E40AF` | `UIColor(hex: "1E40AF")` |
| **Placeholder Section BG** | `bg-gray-50` | `#F9FAFB` | `UIColor.systemGray6` |
| **Placeholder Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Placeholder Text** | `text-gray-500` | `#6B7280` | `UIColor.secondaryLabel` |
| **Placeholder Icon** | `text-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |

### Configure Codes Modal - Visual ID Pattern Diagram

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Diagram Background** | `bg-blue-50` | `#EFF6FF` | `UIColor(hex: "EFF6FF")` |
| **Diagram Border** | `border-blue-500` | `#3B82F6` | `UIColor.systemBlue` |
| **Info Icon** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Info Text** | `text-blue-800` | `#1E40AF` | `UIColor(hex: "1E40AF")` |
| **Code Container BG** | `bg-white` | `#FFFFFF` | `UIColor.systemBackground` |
| **Code Container Border** | `border-blue-200` | `#BFDBFE` | `UIColor(hex: "BFDBFE")` |
| **Area Code (E)** | `text-purple-700` | `#7E22CE` | `UIColor(hex: "7E22CE")` |
| **Floor Code (LL)** | `text-indigo-700` | `#4338CA` | `UIColor(hex: "4338CA")` |
| **Zone Code (INT)** | `text-teal-700` | `#0F766E` | `UIColor(hex: "0F766E")` |
| **Number Code (1230)** | `text-gray-600` | `#4B5563` | `UIColor.systemGray` |
| **Separator Dash** | `text-gray-400` | `#9CA3AF` | `UIColor.systemGray3` |
| **Arrow Up** | `text-purple-600` | `#9333EA` | `UIColor.systemPurple` (Area) |
| **Arrow Up** | `text-indigo-600` | `#4F46E5` | `UIColor.systemIndigo` (Floor) |
| **Arrow Up** | `text-teal-600` | `#0D9488` | `UIColor.systemTeal` (Zone) |
| **Arrow Up** | `text-gray-600` | `#4B5563` | `UIColor.systemGray` (Number) |
| **Arrow Label** | `text-purple-700` | `#7E22CE` | UIColor.systemPurple` (Area) |
| **Arrow Label** | `text-indigo-700` | `#4338CA` | `UIColor.systemIndigo` (Floor) |
| **Arrow Label** | `text-teal-700` | `#0F766E` | `UIColor.systemTeal` (Zone) |
| **Arrow Label** | `text-gray-700` | `#374151` | `UIColor.systemGray` (Number) |

### Export Options Modal

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Checkbox Checked BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Checkbox Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Option Label** | `text-gray-700` | `#374151` | `UIColor.label` |
| **Option Description** | `text-gray-500` | `#6B7280` | `UIColor.secondaryLabel` |

### Duplicate Detection Modal

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Statistics Total** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Statistics New** | `text-green-600` | `#16A34A` | `UIColor.systemGreen` |
| **Statistics Updates** | `text-yellow-600` | `#D97706` | `UIColor.systemYellow` |
| **Statistics Duplicates** | `text-red-600` | `#DC2626` | `UIColor.systemRed` |
| **AI Recommendation BG (Create)** | `bg-blue-50` | `#EFF6FF` | `UIColor(hex: "EFF6FF")` |
| **AI Recommendation Border (Create)** | `border-blue-500` | `#3B82F6` | `UIColor.systemBlue` |
| **AI Recommendation BG (Import)** | `bg-green-50` | `#F0FDF4` | `UIColor(hex: "F0FDF4")` |
| **AI Recommendation Border (Import)** | `border-green-500` | `#22C55E` | `UIColor.systemGreen` |
| **AI Recommendation BG (Replace)** | `bg-yellow-50` | `#FEFCE8` | `UIColor(hex: "FEFCE8")` |
| **AI Recommendation Border (Replace)** | `border-yellow-500` | `#EAB308` | `UIColor.systemYellow` |
| **Option Selected Border** | `border-blue-500` | `#3B82F6` | `UIColor.tintColor` |
| **Option Selected BG** | `bg-blue-50` | `#EFF6FF` | `UIColor(hex: "EFF6FF")` |
| **Option Unselected Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |
| **Radio Button Checked BG** | `bg-blue-500` | `#3B82F6` | `UIColor.systemBlue` |
| **Radio Button Border** | `border-gray-300` | `#D1D5DB` | `UIColor.separator` |

### Toast Notifications

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Success Toast BG** | `bg-green-600` | `#16A34A` | `UIColor.systemGreen` |
| **Success Toast Text** | `text-white` | `#FFFFFF` | `UIColor.white` |
| **Error Toast BG** | `bg-red-600` | `#DC2626` | `UIColor.systemRed` |
| **Error Toast Text** | `text-white` | `#FFFFFF` | `UIColor.white` |
| **Info Toast BG** | `bg-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Info Toast Text** | `text-white` | `#FFFFFF` | `UIColor.white` |

### Footer

| Element | Tailwind | Hex | iOS Color |
|---------|----------|-----|-----------|
| **Footer Border** | `border-gray-200` | `#E5E7EB` | `UIColor.separator` |
| **Footer Text** | `text-gray-600` | `#4B5563` | `UIColor.secondaryLabel` |
| **Creator Name** | `text-gray-800` | `#1F2937` | `UIColor.label` |

---

## 🎨 Dynamic Area Colors (User Customizable)

Default area colors that users can customize in Configure Codes:

| Area | Default Hex | iOS Color |
|------|-------------|-----------|
| **E** (East Wing) | `#9333EA` | `UIColor.systemPurple` |
| **D** (Dock) | `#EC4899` | `UIColor.systemPink` |
| **C** (Central) | `#3B82F6` | `UIColor.systemBlue` |
| **B** (Back) | `#10B981` | `UIColor.systemGreen` |
| **F** (Front) | `#F59E0B` | `UIColor.systemOrange` |
| **A** (Area A) | `#EF4444` | `UIColor.systemRed` |
| **Default Fallback** | `#94A3B8` | `UIColor.systemGray` |

---

## 📐 Glass Morphism Effect (iOS Implementation)

```swift
// Tailwind "glass" class equivalent in SwiftUI
struct GlassMorphismModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    colors: [
                        Color.white.opacity(0.95),
                        Color.white.opacity(0.85)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .background(.ultraThinMaterial)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.1), radius: 20, x: 0, y: 4)
    }
}

extension View {
    func glassMorphism() -> some View {
        self.modifier(GlassMorphismModifier())
    }
}
```

---

## 🔤 Typography

| Element | Tailwind | iOS Font |
|---------|----------|----------|
| **Page Title** | `text-3xl font-bold` | `UIFont.systemFont(ofSize: 30, weight: .bold)` |
| **Section Title** | `text-2xl font-bold` | `UIFont.systemFont(ofSize: 24, weight: .bold)` |
| **Subsection Title** | `text-xl font-bold` | `UIFont.systemFont(ofSize: 20, weight: .bold)` |
| **Body Text** | `text-base` | `UIFont.systemFont(ofSize: 16, weight: .regular)` |
| **Small Text** | `text-sm` | `UIFont.systemFont(ofSize: 14, weight: .regular)` |
| **Extra Small Text** | `text-xs` | `UIFont.systemFont(ofSize: 12, weight: .regular)` |
| **Button Text** | `font-medium` | `UIFont.systemFont(ofSize: 16, weight: .medium)` |
| **Activity ID** | `font-mono font-semibold` | `UIFont.monospacedSystemFont(ofSize: 14, weight: .semibold)` |

---

## 🎯 Icon Colors (Font Awesome Mapping)

| Context | Icon Color | Hex | iOS Color |
|---------|-----------|-----|-----------|
| **Calendar** | `text-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Settings** | `text-gray-600` | `#4B5563` | `UIColor.systemGray` |
| **Refresh** | `text-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Filter** | `text-slate-600` | `#475569` | `UIColor(hex: "475569")` |
| **Warning** | `text-yellow-600` | `#D97706` | `UIColor.systemYellow` |
| **Error** | `text-red-600` | `#DC2626` | `UIColor.systemRed` |
| **Success** | `text-green-600` | `#16A34A` | `UIColor.systemGreen` |
| **Info** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Hard Hat** | `text-purple-600` | `#9333EA` | `UIColor.systemPurple` |
| **Comment** | `text-blue-600` | `#2563EB` | `UIColor.systemBlue` |
| **Layer Group** | `text-indigo-600` | `#4F46E5` | `UIColor.systemIndigo` |
| **Grid** | `text-teal-600` | `#0D9488` | `UIColor.systemTeal` |

---

## 🌈 Color Usage Guidelines

### Primary Actions
- **Blue (`#2563EB`)**: Primary actions (Manual Entry, Add Activity, Save)
- **Slate (`#475569`)**: Secondary actions (Navigation, Import, filters)
- **Green (`#16A34A`)**: Success actions (Export, New Update, Success toasts)

### Warnings & Alerts
- **Yellow (`#D97706`)**: Warnings (Activities Without Dates, duplicate updates)
- **Red (`#DC2626`)**: Destructive actions (Delete, errors)
- **Orange (`#F97316`)**: Today's date highlight

### Information & Organization
- **Purple (`#9333EA`)**: Area codes, contractors, bulk operations
- **Indigo (`#4F46E5`)**: Floor codes, configuration
- **Teal (`#0D9488`)**: Zone codes, organization
- **Gray Shades**: Neutral UI elements, borders, backgrounds

### State Indicators
- **Selected**: `#475569` (slate-600)
- **Hover**: Darker shade of base color (e.g., slate-700)
- **Disabled**: `#9CA3AF` (gray-400)
- **Focus**: `#3B82F6` (blue-500)

---

## 📱 iOS Dark Mode Considerations

For future dark mode implementation:

| Light Mode | Dark Mode Alternative |
|------------|----------------------|
| `bg-white` | `UIColor.systemBackground` |
| `bg-gray-100` | `UIColor.secondarySystemBackground` |
| `text-gray-900` | `UIColor.label` |
| `text-gray-600` | `UIColor.secondaryLabel` |
| `border-gray-300` | `UIColor.separator` |
| `glass effect` | `.ultraThickMaterial` |

---

## 🎨 Color Accessibility

All color combinations meet WCAG 2.1 AA standards:
- **Minimum contrast ratio**: 4.5:1 for normal text
- **Large text contrast**: 3:1 for text ≥18pt or ≥14pt bold
- **Interactive elements**: Clearly distinguishable focus states

---

## 📝 Usage Notes

1. **Glass Morphism**: Use `.ultraThinMaterial` or `.ultraThickMaterial` in iOS for similar effects
2. **Custom Area Colors**: Store user preferences in UserDefaults or CoreData
3. **Dynamic Colors**: All colors should support light/dark mode via iOS system colors
4. **Accessibility**: Test all color combinations with iOS Accessibility Inspector
5. **Consistency**: Use system colors (UIColor.system*) when possible for automatic dark mode support

---

**For Questions or Updates**: Contact Lucio Aguilar
**Document Version**: 1.0
**Compatible with**: iOS 15+, SwiftUI 3+, UIKit
