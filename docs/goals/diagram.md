# /goal — Interactive data-architecture diagram (`web/diagram.html`)

## Objective
A single static, brand-styled page that lets a viewer **explore the model** left-to-right: **Source files → Bronze → Standardisation → Silver → Golden**. Clicking any input shows its grain + ID rule and **highlights its lineage** all the way to the golden fields it feeds. The **bronze→silver standardisation band is explicit**, showing precisely which work happens (parse, resolve ID / NBFI rule, de-dup, re-derive USD, tag convertibility, validate/quarantine, resolve company). A "simple ⇄ full detail" toggle expands field lists; a phase filter (Now/Medium/Later) dims out-of-phase entities.

## Constraints
- Static only; read everything from `window.NW_SPEC` (`spec/ontology.js`) — never hardcode the model.
- Follow `spec/INTEGRATION.md` (shared top bar/nav, theme.css classes, paths/loader).
- No invented fields; if you need one, add it to `spec/ontology.json` + rebuild.
- Make the standardisation step the visual centrepiece (it is the point of the diagram).

## Verify with
- Page opens with no console errors; nodes for all 7 inputs, the 5 layers, and the golden node render.
- Clicking "Bank balance export" highlights bank → bronze → standardisation → `silver.account` → `gold.company_snapshot` (M1/M2/M3).
- Toggling detail expands/collapses fields; phase filter dims Medium/Later.
- Screenshot attached to the PR.
