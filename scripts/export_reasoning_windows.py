#!/usr/bin/env python3
"""Export the curated reasoning windows for the Representative examples viewer.

Sources (latent_reasoning_pattern/reasoning_windows/, written by build_and_score.py):
  examples.json         question, window text, GPT-5 operation spans (forward-token ranges)
  reasoning_scores.json per-token scores[layer][token][operation] for the window tokens

A score is the paper's operation-alignment score a_c = d_c . lda(pca(h/|h|)) of the mean-pooled
probe (res_L{ll}_mean), folded to w_c . (h/|h|) + b_c (beneath-cot-backend/live/probes.py), with h
the output of decoder layer l. Nothing is recomputed here: tokens, labels and scores are copied,
scores rounded to 4 decimals.

Usage:
  python scripts/export_reasoning_windows.py ../latent_reasoning_pattern/reasoning_windows [--all-layers]
"""
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "reasoning-windows" / "Qwen3-8B"

# Decoder layers exported by default: the panels used elsewhere on the site (paper Layers 1, 11, 21,
# 27, 36). Layer 20 is the teaser figure's layer (10_main_figure.py: LAYER = 20) and the default.
PAPER_LAYERS = [0, 10, 20, 26, 35]
DEFAULT_LAYER = 20

# Windows left out of the site (curation choice). Only the two DAPO-Math-17K windows (#138, #349)
# are kept for "Reaching the Final Answer".
EXCLUDE = {
    "04_final_1_TheoremQA_q255_t0",
    "04_final_3_TheoremQA_q153_t1",
    "04_final_5_dapo17k_q403_t0",
}


def main(src: Path, all_layers: bool) -> None:
    examples = {e["id"]: e for e in json.loads((src / "examples.json").read_text())["examples"]}
    rs = json.loads((src / "reasoning_scores.json").read_text())
    meta = rs["meta"]
    labels, layers_all = meta["labels"], meta["layers"]
    layers = layers_all if all_layers else PAPER_LAYERS

    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for s in sorted(rs["examples"], key=lambda x: x["id"]):
        if s["id"] in EXCLUDE:
            continue
        e = examples[s["id"]]
        w0, w1 = s["forward_token_range"]
        n = w1 - w0 + 1
        if len(s["tokens"]) != n or len(s["scores"]) != len(layers_all):
            raise ValueError(f"{s['id']}: inconsistent token/score shapes")

        # Annotated spans in window-token coordinates; span index per token (-1 outside spans).
        spans, span_of = [], [-1] * n
        for sp in e["labeled_spans"]:
            a, b = sp["forward_token_range"]
            a, b = max(a, w0) - w0, min(b, w1) - w0
            if a > b:
                continue
            k = len(spans)
            spans.append({"label": sp["label"], "start": a, "end": b, "text": sp["text"]})
            for i in range(a, b + 1):
                span_of[i] = k

        out = {
            "id": s["id"],
            "group": e["group"],
            "groupName": e["group_name"],
            "rank": e["rank_in_group"],
            "domain": e["domain"],
            "queryIdx": e["query_idx"],
            "tryIdx": e["try_idx"],
            "question": e["question"].strip(),
            "labels": labels,
            "tokens": s["tokens"],
            "spanOf": span_of,
            "spans": spans,
            "scores": {str(l): [[round(v, 4) for v in tok] for tok in s["scores"][layers_all.index(l)]] for l in layers},
        }
        (OUT / f"{s['id']}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
        index.append({
            "id": s["id"], "group": e["group"], "groupName": e["group_name"], "rank": e["rank_in_group"],
            "domain": e["domain"], "queryIdx": e["query_idx"], "tryIdx": e["try_idx"],
            "question": e["question"].strip(), "nTokens": n,
            "labelSequence": [sp["label"] for sp in spans],
        })

    (OUT / "index.json").write_text(json.dumps({
        "model": meta["model"],
        "score": meta["score"],
        "probe": "mean-pooled LDA probe per layer (res_L{ll}_mean), folded",
        "source": "latent_reasoning_pattern/reasoning_windows (build_and_score.py)",
        "labels": labels,
        "layers": layers,
        "defaultLayer": DEFAULT_LAYER,
        "examples": index,
    }, ensure_ascii=False, indent=1))
    print(f"wrote {len(index)} examples × {len(layers)} layers → {OUT}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--all-layers"]
    if len(args) != 1:
        sys.exit(__doc__)
    main(Path(args[0]), "--all-layers" in sys.argv)
