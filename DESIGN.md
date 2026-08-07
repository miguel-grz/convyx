# Design

The visual system as built. Written from the shipped code, not from intention.

## Direction

Convyx follows category convention deliberately. A visitor arrives mid-task with
a broken file and a few seconds of patience; the interface's job is to be
instantly legible, not memorable. Structure follows iLovePDF and Smallpdf — a
searchable grid of tool cards, category-coloured icons, obvious labelled
buttons, an evident three-step flow. Finish follows Linear and Vercel — precise
typography, restrained surfaces, one accent, careful micro-interaction.

Two concept-led directions were built and discarded before this one. Do not
reintroduce a visual metaphor without deliberately reopening that decision; it
is recorded as a brand commitment in [PRODUCT.md](./PRODUCT.md).

## Colour

Tokens live in `apps/web/src/styles/globals.css`. Nothing in a component uses a
raw hex value.

Dark is the default (`:root`); `.light` is a full peer, applied by an inline
script in `index.html` before first paint so the page never flashes.

| Token                       | Dark      | Light     | Use                                |
| --------------------------- | --------- | --------- | ---------------------------------- |
| `--bg`                      | `#08090B` | `#FFFFFF` | Page ground                        |
| `--bg-panel`                | `#0E1013` | `#FFFFFF` | Cards, menus, inputs               |
| `--bg-raised`               | `#16181D` | `#F6F7F9` | Tab tracks, hover fills, skeletons |
| `--fg` / `-muted`/`-subtle` | 3 steps   | 3 steps   | Body, secondary, tertiary          |
| `--line` / `--line-strong`  | `#1E2027` | `#E5E8ED` | Hairlines, input and card borders  |
| `--brand`                   | `#6E79F0` | `#4B56D8` | Primary action and focus ring only |
| `--ok`                      | `#2FC98A` | `#0F9D6F` | The "runs on your device" claim    |
| `--danger`                  | `#F2645A` | `#D33B32` | Errors and destructive controls    |

**Two colour systems, two jobs.** `--brand` marks the one action that starts the
work; it is never decorative. Each category owns a hue used _only_ on its icon
tile and its active tab, so a grid of 26 tools is scannable by colour before a
label is read:

```
pdf → rose      image → teal      audio → amber
video → violet  document → blue   generator → pink
```

A component opts in with `data-category={tool.category}` and the `cat-tint`
utility; the CSS resolves `--cat-color` / `--cat-soft`. Adding a category is a
token pair in `globals.css`, not a component change.

## Type

Inter Variable, self-hosted via `@fontsource-variable/inter`. One family — the
hierarchy comes from size and weight, not from a second face.

- Headings: 600, `letter-spacing: -0.022em` (`-0.035em` at `h1`)
- Body: 15px / 1.6
- Small print and specs: 12–13px
- Numbers in file sizes and counts use `tabular-nums` so columns do not jitter

Headline sizes are fluid, capped at `3.5rem`. Long-form paragraphs use
`text-pretty`; headings use `text-balance`.

## Shape and depth

- Radius: `0.5rem` controls, `0.625rem` cards and inputs, `0.875rem` panels
- Shadows are single-source with an offset and a blur — `--shadow-sm/md/lg`.
  There are no zero-offset halos and no glass.
- Borders are 1px and carry structure. No coloured left borders, no gradients on
  text.

## Components

Primitives are in `apps/web/src/components/ui/`, all styled from tokens:

- **Button** — `primary` (the only filled control on a screen), `secondary`,
  `ghost`, `danger`. Disabled drops out of the brand colour entirely rather than
  fading it, so an unavailable action never still reads as _the_ action.
- **Badge** — `neutral`, `brand`, `ok`, `outline`. Used for "On device",
  "Server", "Soon".
- **Accordion** — measures its content with a `ResizeObserver` and animates to a
  real height; `inert` when closed so its contents leave the tab order.
- **Dropdown** — closes on Escape, outside pointer-down, and focus leaving,
  including via Tab.
- **Icon** — resolves a manifest's icon name through `virtual:convyx-icons`, a
  module the `convyx:icons` Vite plugin generates from the manifests themselves.

## Motion

One idea, applied consistently: content settles upward as it enters the viewport.

- `useReveal` adds `data-reveal` **at runtime**, never in the markup. Content
  therefore ships visible, and the animation is the enhancement — if the script
  never runs, the observer is missing, or motion is reduced, nothing is hidden.
- `useParallax` drives `transform` only, from a rAF loop, disabled under reduced
  motion. Used once, on the hero's light source.
- Interactive transitions are 150ms; reveals are 700ms on an exponential
  ease-out. Menus use a 160ms `pop-in`.
- Looping tile animations are gated on `motion-safe:` and every transition is
  suppressed under `prefers-reduced-motion: reduce`.
- `useCountUp` starts at the target value and only counts up once observed, so a
  visitor who never triggers it reads the real number rather than a stuck zero.

## Browser surfaces

Scrollbars, selection, caret and focus ring are all themed from the palette.
Focus is a 2px `--brand` outline at 2px offset, visible on every interactive
element.

## Layout

`max-w-6xl` with `px-4 sm:px-6`; tool pages narrow to `max-w-3xl`. Sections are
separated by a full-bleed `border-line` rule rather than by spacing alone.

**The landing page carries no full tool grid.** A grid of every tool belongs on
`/tools`, where finding one is the job; on the landing page it grew with the
catalogue and pushed the explanation below the fold. The way in is the hero's
combobox, a bounded eight-card "Start here" selection, and the header's menus.

Sections run: hero → Start here → key features → three steps → privacy → FAQ.
Access precedes argument, because a visitor who already knows what they need
should not have to scroll past five reasons to trust us.

`KeyFeatures` is a five-tile bento (`lg:grid-cols-3`, first tile spanning two)
rather than a row of equal cards, and each tile carries a small animation that
_illustrates_ its claim: a file bouncing off the edge of the device, a retention
ring unwinding, a worker's progress bar with its cancel control, a count-up of
the catalogue size. Five claims stay five as the catalogue grows.

The catalogue grid on `/tools` is 1 / 2 / 3 / 4 columns at `sm` / `lg` / `xl`.

## Rules

1. No raw colour values in components — tokens only.
2. `--brand` is for the primary action and focus. Category hues are for icon
   tiles and active tabs. Neither is decorative.
3. Buttons say what they do, in sentence case.
4. Marketing copy names the result, never the mechanism. "Your files stay on
   your computer", not "15 tools run client-side in a Web Worker".
5. Any surface listing tools reads the registry; nothing is hardcoded.
6. Animation may never be the reason content is invisible.
