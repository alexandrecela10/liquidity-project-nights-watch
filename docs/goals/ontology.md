# /goal — Ontology & data architecture

## Objective
Produce a clear, **levelled** ontology for Night's Watch that makes two things obvious: (1) the **golden level of detail** — the early-warning model at `company × refresh` carrying the coverage signal + M1/M2/M3 + summary fields; and (2) the **level of detail of each input** — the grain each source arrives at and the exact bronze→silver standardisation that conforms it. Company is the spine; entities are phase-tagged (Now/Medium/Later).

## Constraints
- Only the **key fields** the product needs — no kitchen-sink schema.
- The **3 bank metrics** (M1 current transferable, M2 history, M3 T1 proxy) must be explicit in Gold.
- **ID creation rules** stated per input; the NBFI rule (`native id, else FI+country+currency`) justified against the real file (17 null IDs = 28% of cash; FI+country collides).
- **Standardisation steps** (parse, resolve ID, de-dup, re-derive USD, tag convertibility, validate/quarantine, resolve company) named precisely as the bronze→silver work.
- Diagrams must match `schema.sql` and `spec/ontology.json` 1:1.

## Verify with
- `docs/ontology.md` renders the source→golden flow + the ERD (Mermaid) on GitHub.
- `python3 -c "import json; json.load(open('spec/ontology.json'))"` passes; `metrics` lists M1/M2/M3.
- A reader can answer "what grain is each input?" and "where does standardisation happen?" from the doc alone.
