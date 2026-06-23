---
name: Card click propagation fix
description: How to prevent dropdown menu actions from triggering card click/folder navigation in file-card and file-row
---

## The Rule
Never wrap folder cards in `<Link>`. Use programmatic `setLocation` instead. Add `data-no-card-click` / `data-no-row-click` on the actions container, check with `(e.target as HTMLElement).closest('[data-no-card-click]')` in the card onClick handler.

## Why
Radix UI DropdownMenu portals its content outside the DOM tree. When a menu item is clicked (rename, star, etc.) the dropdown closes and Radix returns focus to the trigger. If the trigger is inside a `<Link>` wrapper, wouter/the link may navigate. Additionally `e.stopPropagation()` on individual buttons is not reliable enough when dropdowns are involved. The `closest()` attribute check on the outer div is deterministic.

## How to apply
In file-card.tsx:
```tsx
const handleCardClick = (e: React.MouseEvent) => {
  if ((e.target as HTMLElement).closest('[data-no-card-click]')) return;
  if (isFolder) setLocation(`/drive/folder/${item.id}`);
  else actions.onPreview?.(item);
};
// actions container:
<div data-no-card-click>...</div>
```
Same pattern in file-row.tsx using `data-no-row-click`.

Also add `onClick={(e) => e.stopPropagation()}` to DropdownMenuContent as a belt-and-suspenders measure.
