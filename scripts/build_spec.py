#!/usr/bin/env python3
"""Generate spec/ontology.js (a browser global) from the canonical spec/ontology.json.

The interactive pages are fully static (GitHub Pages, or open the file directly),
so they cannot fetch() a local JSON without a server. Embedding the spec as a JS
global keeps a single source of truth (the JSON) with zero runtime dependencies.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = json.loads((ROOT / "spec" / "ontology.json").read_text())
js = "// AUTO-GENERATED from spec/ontology.json by scripts/build_spec.py — do not edit by hand.\n"
js += "window.NW_SPEC = " + json.dumps(spec, indent=2, ensure_ascii=False) + ";\n"
(ROOT / "spec" / "ontology.js").write_text(js)
print(f"wrote spec/ontology.js ({len(js):,} bytes)")
