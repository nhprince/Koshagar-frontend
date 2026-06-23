---
name: Solid backgrounds for overlapping panels
description: Use inline style background for panels and dropdowns, not glass-card class
---

## The Rule
All floating panels (notification panel, dropdown menus over content) must use `style={{ background: "hsl(var(--card))" }}` for a fully opaque background. Never use `glass-card` class for overlapping UI.

## Why
`glass-card` has `bg-card/60 backdrop-blur-2xl` which makes it 60% transparent. When panels appear over other content (especially animated cards), the transparency shows through and looks broken.

## How to apply
- NotificationsPanel: inline style on the motion.div panel container
- DropdownMenuContent in admin pages: add `style={{ background: "hsl(var(--card))" }}` prop
- For drive file-actions.tsx DropdownMenuContent: same inline style
