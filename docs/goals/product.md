# /goal — Credit-team product (`web/product.html`)

## Objective
The product a credit specialist actually uses, as a static, brand-styled single screen. It must let them, fast: **(1) See** every portfolio company **ranked worst-first** (by principal at risk, then coverage) with a High/Medium/Low/None pill; **(2) Understand** why — transferable-vs-trapped split, coverage ratio (vs 1.0), runway, deteriorating flag, prior issues, data freshness; **(3) Get follow-up info** — loan seniority, coupon, cash/PIK, next payment date, cash due at T1; **(4) Be recommended an action** — the P1–P4 quadrant action with concrete steps; **(5) Act & record** — log the action (priority, note, outcome) to an in-page action log. Use `NW_SPEC.portfolio` + `NW_SPEC.actions_framework`. Sahel AgriCorp is the worked example ($9.31M total / $796K→$325K transferable, coverage 0.46, P1).

## Constraints
- Static only; read everything from `window.NW_SPEC` — never hardcode the portfolio.
- Follow `spec/INTEGRATION.md` (shared shell, theme, loader).
- ≤2 clicks from "what's at risk" to "act". Never present trapped cash as transferable. No invented numbers; show data freshness.
- The action log can persist in `localStorage` (no backend) — clearly a demo store.

## Verify with
- Page opens with no console errors; 8 companies render ranked worst-first; Sahel AgriCorp is #1 (High, coverage 0.46).
- Selecting a company shows the why + loan follow-up + the recommended P-action.
- Logging an action appends it to the visible action log (and survives reload via localStorage).
- Screenshot attached to the PR.
