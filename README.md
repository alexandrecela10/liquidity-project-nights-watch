# Project Night's Watch

Real-time cash monitoring & early-warning for Liquidity's **Credit team**: catch a portfolio company's cash trouble *before* it becomes a missed payment.

> **Signal:** `coverage = expected transferable cash at the next payment (T1) ÷ cash to repay at T1`. Below **1.0** = at risk.

Synthetic data only. One company (**Sahel AgriCorp**) mirrors the numeric distribution of the provided real bank export — **$9.31M total cash but only $796K transferable** — as the worked example.

## What's here (six outputs, one product)

| Output | Where | What it answers |
|---|---|---|
| **Ontology & data architecture** | [`docs/ontology.md`](docs/ontology.md), [`docs/schema.sql`](docs/schema.sql) | The golden level of detail + the level of detail of each input + the bronze→silver standardisation. |
| **Interactive data-architecture diagram** | `web/diagram.html` | Explore Source → Bronze → Standardisation → Silver → Golden; click an input to trace its lineage. |
| **Lifecycle mock** | `web/lifecycle.html` | A new bank file → a High warning → a credit-team action → the updated database, step by step. |
| **Credit-team product** | `web/product.html` | At-risk companies ranked worst-first; understand why; loan follow-up; recoverability (first-pass → financials-enhanced); worst-case T1 forecast + expected range; P1–P4 action; log it. Hover any key metric for as-at date · formula · raw source(s) · evidence · lineage. Collapsible **filter panel** with a **company search** ("Find a company…", matches name / jurisdiction / loan ID) plus ontology filters (country, risk, principal size, seniority, coupon, coverage); **drill any row into the company + loan** (clear hover cue); a **Loan — detail & analytics** block in the look-up panel (coverage @ T1, cash due, shortfall, days to next payment, annual cash coupon, seniority, principal at risk, recovery — each with the same trust hover); row **quick actions** (assign, trigger alert) on hover; table **Export CSV** + **Share** (filter state encoded in the URL); inspector **Share** + **Download executive summary** (now carries the full loan-analytics block with discrete hover definitions). |
| **Data roadmap** | `web/roadmap.html` | What each horizon (Now/Medium/Later) unlocks and how the See→Decide→Act workflow deepens; deep-linkable via `?h=Now`. |
| **Data & formula dictionary** | `web/dictionary.html` | Every metric with its formula, as-at date, raw source file(s) and evidence, plus the raw-source-files registry. The desk hover popovers link straight into it. |
| **Product demo** | `web/demo.html` | Animated end-to-end walkthrough: a Teams alert fires → credit desk → see → understand → drill into loan → prioritise → decide → act → "Company processed — monitoring triggered." Auto-plays with subtitles and optional TTS voice narration; keyboard + button nav. |

### Live site (GitHub Pages)
Enable once in **Settings → Pages → Build and deployment → Deploy from a branch → Branch: `devin/nights-watch-spec` (or rename it to `main`), folder: `/ (root)` → Save**. The root [`index.html`](index.html) redirects to the landing page, so the site is served at:

```
https://alexandrecela10.github.io/liquidity-project-nights-watch/
```

(`.nojekyll` is included so the static files are served as-is.)

## Single source of truth
All outputs read from one spec, [`spec/ontology.json`](spec/ontology.json) — the data model, the synthetic portfolio, the lifecycle scenario, and the brand. The interactive pages load it via the generated `spec/ontology.js`:

```bash
python3 scripts/build_spec.py     # regenerate spec/ontology.js from spec/ontology.json
```

## Run locally
The pages are fully static. Serve the repo root and open the site:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/web/index.html
```

## The 3 bank metrics (all from the bank file)
- **M1 — current transferable cash**: sum of hard-currency (transferable) balances → **$796K** of $9.31M.
- **M2 — history of transferable cash**: M1 across snapshots → burn/day, runway.
- **M3 — proxy of transferable cash at T1**: the M2 trend projected to the next payment date.

## ID creation (NBFI rule)
The bank file has 17 of 62 rows with **no account id** (non-bank FIs) holding **28% of all cash**. Resolved as:
`account_key = COALESCE(native id, 'NBFI:'+FI+':'+country+':'+currency)` — currency is required because FI+country alone collides in the real file.

## Goal prompts
One per output, in [`docs/goals/`](docs/goals): `ontology.md`, `diagram.md`, `lifecycle.md`, `product.md`.
