# /goal — Agentic workflow mockup (`web/agent.html`)

> **Challenges to the brief and design refinements** are marked with **(C)** below.

## Objective

A static, brand-styled, interactive mockup of an **agent-driven, dashboard-less credit desk** — the "later-phase" vision where an AI agent sweeps the portfolio overnight, triages every company against the P1–P4 framework, and presents a **morning briefing** with drafted actions, evidence, and guardrails. The analyst's role shifts from "find and analyse" to "review and approve." Tagline: *"6 holding, 2 need you."*

The page has three core zones:

1. **Morning briefing** (the home screen) — agent header ("ran 06:00 · 8 swept · 2 need you"), a natural-language overnight summary, tool-call chips showing what the agent used, a stream of action cards (highest priority first), a collapsed "6 companies holding" strip, and a conversational input.
2. **Action cards** (the core unit) — one per company needing attention. Shows priority badge (P1–P4), company name + money at risk, the agent's plain-English read, "Agent recommends" block with drafted steps, evidence chips with trace links, and action buttons whose behaviour depends on reversibility/stakes.
3. **Conversational input** — analyst asks a portfolio-wide question; agent answers grounded in data with source chips.

Sahel AgriCorp is the worked P1 card (human-only approval). Kigali Agro is the P4 card demonstrating auto-run + 15-minute undo buffer.

**(C) "Dashboard-less" risks losing spatial memory.** Credit analysts develop muscle memory for table positions. The brief wisely keeps the ranked table accessible but collapsed — I'll frame this as **"agent-first, not agent-only"** and ensure the collapsed strip expands to the full ranked table (identical to the existing credit desk layout) so the analyst can always fall back to the familiar view.

## Constraints

- Static only; read everything from `window.NW_SPEC` — never hardcode the portfolio.
- Follow `spec/INTEGRATION.md` (shared shell, theme, loader).
- Clearly marked **"Future · preview"** in the UI — this is a later-phase vision, not a shipped product.
- Synthetic data only; no real money movement, no real external sends.

### MCP simulation
- Tool calls are **simulated** (mock responses) but surfaced explicitly in the UI as chips/log entries: `banking-mcp → get_balances(Sahel) → 4 accounts, $796K transferable`.
- **(C) Show at least one non-happy-path state** (e.g., a "cached" or "retried" chip) so the architecture reads honestly about latency/failure. Real MCP calls can fail or stall — the mockup should acknowledge this.
- **Critical framing: MCP = reach, not intelligence.** The coverage metric, risk model, and priority logic live in our pipeline (medallion → gold). MCP is how the agent gathers fresh context and executes approved actions in external systems. The UI copy must never imply the analysis happens "in" MCP.

### Automation guardrails (the most important part)
Action autonomy scales **inversely with stakes**:

| Stakes | Examples | Button | Behaviour |
|--------|----------|--------|-----------|
| **Irreversible / high-stakes (P1/P2)** | Demand repayment, rewrite terms, send treasurer a funding commitment | "Approve plan & draft" | Drafts for review only; nothing executes until the analyst confirms. Lock icon + "nothing sends until you approve." |
| **Reversible / low-stakes (P4)** | Standard certificate-request notices, raise monitoring cadence, freeze advances | "Approve & auto-run" | Enters 15-minute hold-and-undo countdown before committing. Prominent **Undo** button. |

**(C) The 15-minute buffer is the right default, but the mockup should also show what happens AFTER approval for P1/P2 flows.** After "Approve plan & draft," the analyst sees a draft email to review and send manually — the second step. Otherwise the flow feels incomplete ("I approved… now what?").

**(C) The P4 auto-run scenario needs a concrete, believable action.** The brief says "small ticket, late compliance certificate." Kigali Agro (PIK, $0 cash due, P4) is the natural choice — its "action" is purely administrative. I'll frame it as: "Annual compliance certificate is 5 days overdue → agent drafts a standard reminder notice via `comms-mcp · draft_email` → auto-sent after 15-min window."

### Grounding & audit
- **Absolute grounding** — every agent claim links to its raw source (evidence chips with trace links to the data dictionary). No ungrounded claims.
- **Compliance note** — visible that actions respect access levels, confidentiality, and UAE data-sovereignty rules (ADGM/PDPL); irreversible/cross-border actions flagged for review.
- **Agent audit trail** — a persistent log of every agent action, tool call, approval, and undo. Distinct from the existing Action Log (which records human analyst actions).

**(C) Simulated conversational input must be carefully scoped.** Free-text "ask the desk anything" with only canned answers is fragile — any off-script question breaks the illusion. I'll offer **3–4 suggested questions** as clickable chips (e.g., "Which loans are most FX-exposed?", "Show me the stable six", "What changed since yesterday?") plus a free-text field with a graceful fallback ("I can answer questions about the portfolio based on the spec data — try one of the suggestions above for the best demo experience.").

## Demonstration artifacts

The mockup must demonstrate these specific interactions end-to-end:

1. **Briefing loads** — agent header shows "ran 06:00 · 8 companies swept · 2 need you"; natural-language summary paragraph present; tool-call chips visible (banking-mcp, crm-mcp); 2 action cards + collapsed "6 holding" strip.
2. **P1 card (Sahel)** — lock icon present; "Approve plan & draft" button; clicking it transitions to a draft-review state showing the drafted email/communication (not yet sent); "nothing sends until you approve" copy visible. Evidence chips (coverage 0.46, $324K transferable, $700K due) each with a trace link.
3. **P4 card (Kigali)** — "Approve & auto-run" button; clicking it starts a **visible 15-minute countdown** ("sending in 14:59…") with a prominent **Undo** button; clicking Undo cancels the auto-action and reverts the card state. The countdown component is the centrepiece guardrail.
4. **Collapsed "6 holding" strip** — click to expand; shows the 6 stable companies (Dar Telecom through Casablanca Foods) in the familiar ranked-table layout with key metrics.
5. **Conversational input** — clicking a suggested question (e.g., "Which loans are most FX-exposed?") returns a grounded answer with source chips citing specific companies and figures.
6. **Audit trail** — every interaction above (tool calls, approvals, undos) appears in the agent audit trail with timestamps.

## Verify with
- Page opens with no console errors; agent header shows "8 swept · 2 need you"; 2 action cards render (Sahel P1, Kigali P4).
- P1 card (Sahel): click "Approve plan & draft" → transitions to draft-review state with lock icon + "nothing sends until you approve."
- P4 card (Kigali): click "Approve & auto-run" → visible 15-minute countdown starts; click "Undo" → countdown cancels, card reverts.
- Collapsed "6 holding" strip expands to show 6 stable companies.
- Conversational input returns a grounded answer with source chips.
- Agent audit trail records tool calls, approvals, and undos.
- "Future · preview" marker visible.
- Screenshot attached to the PR.
