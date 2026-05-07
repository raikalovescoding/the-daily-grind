## Goal
Make the theme toggle and the date button use a translucent blurred background (matching the `blur-btn` glassy look) instead of the current solid gray / pink gradient fills.

## Changes — `src/routes/index.tsx`

1. **Theme toggle button** (inside toys box)
   - Currently has `blur-btn` class but the gray comes from `--card-tint` being too opaque against the toys card.
   - Remove the `blur-btn` class on this one and inline a more transparent background, e.g. `background: "rgba(255,255,255,0.08)"` (light) handled via a new `.glass-btn` utility that uses a low-alpha tint + backdrop-blur so the gradient blobs show through.

2. **Date button** (`DateButton` component)
   - Remove the pink gradient `linear-gradient(135deg, oklch(...))` background.
   - Replace with the same `.glass-btn` translucent + blurred background.
   - Keep the pink border (`border-primary/40`) and pink text so it still reads as the accent control, just without the filled gradient.

3. **Add `.glass-btn` style** in the inline `<style>` block:
   ```css
   .glass-btn {
     background: color-mix(in oklab, var(--card-tint) 60%, transparent);
     backdrop-filter: blur(20px) saturate(1.2);
     -webkit-backdrop-filter: blur(20px) saturate(1.2);
   }
   ```
   This is more transparent than `blur-btn` so the colorful background blobs visibly shine through both buttons.

## Result
Both buttons become glassy / translucent — no gray fill on the theme toggle, no pink gradient fill on the date button. Borders and icon/text colors stay the same so they remain visually distinct.