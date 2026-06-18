# /goal — Lifecycle mock (`web/lifecycle.html`)

## Objective
A static, brand-styled **play-through** of one warning's full lifecycle, using `NW_SPEC.lifecycle` (Sahel AgriCorp): a **new bank file lands** → flows **Bronze → Standardisation → Silver → Gold** → **coverage drops below 1.0 and a High warning fires** → the **credit team logs a P1 action** → the **database state updates**. The viewer can **step** (Next/Back) or **play** the sequence. At each step show (a) what happens in plain language and (b) the concrete **DB changes** (e.g. "+1 gold.company_snapshot (coverage 0.46, High)"). End on a clear **before vs after** (transferable $795,714 → $324,857; coverage 1.14 → 0.46; Low → High) and the open action record.

## Constraints
- Static only; read the scenario from `window.NW_SPEC.lifecycle` — never hardcode numbers.
- Follow `spec/INTEGRATION.md` (shared shell, theme, loader).
- Honest by construction: the only thing that changed is the EUR account → $0; every downstream number must follow from that.

## Verify with
- Page opens with no console errors; stepping advances through all 7 steps with DB-change captions.
- The before/after panel shows $795,714 → $324,857 and coverage 1.14 → 0.46 (Low → High).
- The final state shows the logged **P1** action and that lineage stays intact.
- Screenshot attached to the PR.
