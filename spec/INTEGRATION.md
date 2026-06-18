# Build contract — read before building any interactive page

All interactive pages are **static** (no backend, no build step beyond `scripts/build_spec.py`). They are deployed to GitHub Pages and must also work when opened directly as a file. Follow this contract exactly so the three pages compose into one product.

## Single source of truth
- The data model + portfolio + lifecycle + brand live in **`spec/ontology.json`**.
- Pages must **not** hardcode this data. Load the generated global instead:
  ```html
  <link rel="stylesheet" href="theme.css">
  <script src="../spec/ontology.js"></script>   <!-- defines window.NW_SPEC -->
  ```
  (When deployed, files are flattened into one folder — see "Paths" below. Use a small loader that tries `../spec/ontology.js` then `ontology.js`.)
- If you need a field that isn't in the spec, **add it to `spec/ontology.json`, re-run `python3 scripts/build_spec.py`, and use it** — never fork the data.

## Files you own
| Page | File | Owner |
|------|------|-------|
| Landing hub | `web/index.html` | parent |
| Architecture diagram | `web/diagram.html` | Child A |
| Lifecycle mock | `web/lifecycle.html` | Child B |
| Credit-team product | `web/product.html` | Child C |

Do **not** edit another page's file or `web/theme.css` / `spec/*` (except adding fields to the JSON + rebuilding, as above). Keep all page-specific CSS/JS **inside your own HTML file** to avoid collisions.

## Shared shell (paste at top of `<body>`)
Every page uses the same brand top bar + nav so they feel like one product:
```html
<div class="nw-topbar">
  <span class="nw-logo"><span class="dot"></span> Night's Watch</span>
  <span class="nw-tag">Liquidity · Credit early-warning</span>
  <nav class="nw-nav">
    <a href="index.html">Overview</a>
    <a href="product.html">Credit desk</a>
    <a href="diagram.html">Data architecture</a>
    <a href="lifecycle.html">Lifecycle</a>
  </nav>
</div>
```
Add `class="active"` to the link for the current page.

## Brand (already in theme.css — use the classes/tokens, don't invent colors)
- ink `#072708` · sand `#fdf5f0` · yellow `#ffde43` · taupe `#6f5f56` · sand-700 `#c8b1a4`
- Risk: High `#b3402e` · Medium `#c98a1a` · Low `#5e7d52` · None `#9f887c`
- Font: IBM Plex Sans. Use helper classes: `.nw-card`, `.nw-btn[.accent|.ghost]`, `.nw-pill.nw-risk-<Label>`, `.nw-layer-<layer>`, `.nw-phase-<phase>`, `.nw-wrap`.

## UX bar (the success criteria)
Minimalist, premium, **fast** (scannable, few clicks) and **trustworthy** (no invented numbers; every figure traceable; show the transferable-vs-trapped split honestly). Money is USD, formatted like `$324,857`. Coverage shown to 2 dp with a clear at-risk treatment when `< 1.0`.

## Paths (important for GitHub Pages)
Deployment copies `web/*` and `spec/ontology.js` into one published folder, so `index.html`, `diagram.html`, `lifecycle.html`, `product.html`, `theme.css`, `ontology.js` all sit **side by side**. Use this resilient loader so the page works both in-repo (`web/`) and deployed (flattened):
```html
<script>
  function loadSpec(srcs, done){ if(!srcs.length) return done(new Error('no spec'));
    var s=document.createElement('script'); s.src=srcs[0];
    s.onload=done; s.onerror=function(){loadSpec(srcs.slice(1),done);};
    document.head.appendChild(s); }
  loadSpec(['ontology.js','../spec/ontology.js'], function(){ /* window.NW_SPEC ready */ init(); });
</script>
```

## Definition of done (per page)
- Opens with no console errors; reads everything from `window.NW_SPEC`.
- Matches the brand; includes the shared top bar + nav with the right `active` link.
- Self-contained in its single HTML file.
- Commit on your own branch and open a PR into `devin/nights-watch-spec` (the integration branch), with a screenshot.
