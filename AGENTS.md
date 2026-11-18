# Jake Kaplan Personal Website

Personal website for Jake Kaplan, software engineer. A simple dark page with slow, ever-shifting magic in the background.

## Style

Simple and clear in front, quietly magical behind.

- The foreground is plain: one monospace family, small type, a narrow centered column, no decoration.
- The background is the one expressive element: dark smoke that never stops shifting, with a few drifting motes of light. It stays dim enough to read over, and dims further behind pages meant for reading.
- The theme is atmosphere, not literal fantasy imagery. No runes, sigils, or game elements.
- The background answers the pointer like real smoke: moving through it stirs it, the stirred smoke glows while it is still moving, and it drifts back to rest over a few seconds. A press puffs it outward.
- Motion belongs to the background. The foreground only fades in when a page appears and responds to hover and focus.

## Architecture

The site uses a **persistent background** pattern: a fullscreen WebGL canvas runs continuously behind all content and persists across route navigation.

```
main.tsx (router, default not-found page)
└── __root.tsx (Root Layout)
    └── ErrorBoundary
        ├── Background (fullscreen canvas, persistent)
        └── .app
            ├── Header (email, GitHub and LinkedIn links in the corner; nav)
            ├── main
            │   └── <Outlet /> (route content)
            └── Footer (source link)
```

## Structure

```
src/
├── main.tsx                    # App entry point
├── routes/
│   ├── __root.tsx              # Root layout + persistent background
│   ├── index.tsx               # Homepage (name and one-line role)
│   ├── about.tsx               # About page
│   ├── blog.index.tsx          # Writing list
│   └── blog.$slug.tsx          # Post
├── components/
│   ├── Background.tsx          # WebGL setup and animation loop
│   ├── Background.frag         # Fragment shader that draws the background
│   ├── Flow.frag               # Fragment shader that simulates the stirred smoke
│   ├── NotFound.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ErrorBoundary.tsx
├── lib/
│   └── blog.ts                 # Markdown post loading
├── content/blog/               # Posts
└── index.css
```

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run test      # Run tests
npm run lint      # Biome check
npm run lint:fix  # Auto-fix
```

## Background

`Background.frag` draws the image: layered noise warped by more noise (the smoke), a ridge through it (the brighter wisps), and a sparse grid of flickering points (the motes). Everything fades toward the edges of the screen. The tunable values are the multipliers in `main()`; raise them carefully, since the page text sits directly on top.

`Flow.frag` is the stirring. It keeps a small texture where each texel holds how fast the smoke there is moving and how far it has been pushed from rest. Every frame it carries that flow along itself, lets it fade, and adds a push along the path the pointer just travelled. `Background.frag` reads that texture to offset where it samples the smoke and to light the parts still moving. The push strength, how long motion lasts, and how slowly the smoke returns are the constants in `Flow.frag`.

`Background.tsx` runs both shaders on one fullscreen triangle every frame: a flow step into an offscreen float texture, then the image. It needs WebGL2 with float render targets and leaves the plain `--night` page color showing without them. The image renders at half resolution because it is soft, and the flow at half of that again. When the visitor prefers reduced motion it draws a single still frame and ignores the pointer.

## Theming

Dark only. Colors are CSS variables in `index.css` `:root`: `--night`, `--stone`, `--seam` for surfaces, `--ash`, `--mist`, `--moon` for text, and `--ember` for hover and focus. The shader has its own color constants at the top of `Background.frag`; keep `NIGHT` in sync with `--night`.

## Code Patterns

- **Styling in `index.css`** with plain class names; no inline styles
- **Pure functions in `lib/`**, stateless and testable
