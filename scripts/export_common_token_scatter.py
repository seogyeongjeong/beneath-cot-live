#!/usr/bin/env python3
"""Export the shared-token scatter data behind the paper's Figure (fig:common-word-scatter)
for the website's interactive viewer.

Source: viz_data_sep.json written by latent_reasoning_pattern/08_token_label_separability.py
(the same file its --paper_viz mode re-plots into PLOT_PAPER/scatter_common_all/). Nothing is
recomputed here: coordinates, labels and tokens are copied as they are, only rounded to 4
decimals and regrouped into one file per operation pair.

Each point is one occurrence of a shared token (the intersection of the two operations' ten
most frequent tokens in balanced test spans). Its coordinates are the token's alignment with
the two operation vectors, z^T d_c, in the LDA probe space of that layer (probe fitted on
mean-pooled span representations, res_L{ll}_mean.joblib / res_embed_mean.joblib).

Usage:
  python scripts/export_common_token_scatter.py \
      ../latent_reasoning_pattern/VIZ_SEPARABILITY/connect_gpt-5/Qwen3-8B_correct_polya/viz_data_sep.json \\
      [--all-layers] [--all-pairs]
"""
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "common-token-scatter" / "Qwen3-8B"

# Pairs exported, as (Y operation, X operation). First the rows of the paper's figure in order,
# then the additional pairs chosen for the website. Pass --all-pairs to export all 28 pairs
# (pairs not listed here keep the lbl_a = Y, lbl_b = X orientation of the source file).
PAPER_PAIRS = [
    ("[STRUCTURAL-ANALYSIS.DECOMPOSITION]", "[INFERENCE-FLOW.CHAINING.DEDUCTION]"),
    ("[RETRIEVAL.RECALL]", "[EXECUTION.OPERATION.ALGEBRAIC-MANIPULATION]"),
    ("[RETRIEVAL.RECALL]", "[FINAL-ANSWER]"),
]
# Layers exported: the panels of the paper's figure (embedding layer, then 1-based Layers 1, 11,
# 21, 27, 36 = keys 0, 10, 20, 26, 35; PAPER_VIZ_LAYERS in 08_token_label_separability.py).
# Pass --all-layers to export every layer instead.
PAPER_LAYERS = ["embed", "0", "10", "20", "26", "35"]

EXTRA_PAIRS = [
    ("[EXTRACTION]", "[RETRIEVAL.RECALL]"),
    ("[EXTRACTION]", "[INFERENCE-FLOW.CHAINING.DEDUCTION]"),
    ("[INFERENCE-FLOW.CHAINING.DEDUCTION]", "[SYMBOLIZATION.DIRECT-MAPPING]"),
    ("[EXECUTION.OPERATION.ALGEBRAIC-MANIPULATION]", "[FINAL-ANSWER]"),
    ("[EXECUTION.OPERATION.ARITHMETIC-COMPUTATION]", "[FINAL-ANSWER]"),
]
SELECTED = PAPER_PAIRS + EXTRA_PAIRS


def short(label: str) -> str:
    return label.strip("[]").split(".")[-1]


def main(src: Path, all_layers: bool = False, all_pairs: bool = False) -> None:
    vd = json.loads(src.read_text())
    pairs = vd["pairs_data"]
    n_layers = vd["n_layers"]
    layer_keys = ["embed"] + [str(i) for i in range(n_layers)] if all_layers else PAPER_LAYERS

    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for entry in pairs.values():
        a, b = entry["lbl_a"], entry["lbl_b"]
        if (b, a) in SELECTED:
            y_lbl, x_lbl = b, a
        elif (a, b) in SELECTED or all_pairs:
            y_lbl, x_lbl = a, b
        else:
            continue
        y_is_a = y_lbl == a

        tokens: list[str] = []
        tok_idx: dict[str, int] = {}
        layers = {}
        for lk in layer_keys:
            pts = entry["layer_data"].get(lk, [])
            xs, ys, cls, tok = [], [], [], []
            for score_a, score_b, true_lbl, token in pts:
                if true_lbl not in (y_lbl, x_lbl):
                    raise ValueError(f"unexpected label {true_lbl} in {a} vs {b}")
                ys.append(round(score_a if y_is_a else score_b, 4))
                xs.append(round(score_b if y_is_a else score_a, 4))
                cls.append(0 if true_lbl == y_lbl else 1)  # 0: span of the Y operation, 1: of the X operation
                if token not in tok_idx:
                    tok_idx[token] = len(tokens)
                    tokens.append(token)
                tok.append(tok_idx[token])
            layers[lk] = {"x": xs, "y": ys, "c": cls, "t": tok}

        pid = f"{short(y_lbl)}_vs_{short(x_lbl)}"
        (OUT / f"{pid}.json").write_text(json.dumps(
            {"id": pid, "y": y_lbl, "x": x_lbl, "tokens": tokens, "layers": layers},
            separators=(",", ":")))
        group = "paper" if (y_lbl, x_lbl) in PAPER_PAIRS else "other"
        index.append({
            "id": pid, "y": y_lbl, "x": x_lbl, "group": group,
            "paperRow": PAPER_PAIRS.index((y_lbl, x_lbl)) if group == "paper" else None,
            "counts": {lk: len(layers[lk]["x"]) for lk in layer_keys},
        })

    order = {p: i for i, p in enumerate(SELECTED)}
    index.sort(key=lambda e: (order.get((e["y"], e["x"]), len(order)), e["id"]))
    if not all_pairs and len(index) != len(SELECTED):
        raise SystemExit(f"expected {len(SELECTED)} pairs, found {len(index)}")
    (OUT / "index.json").write_text(json.dumps({
        "model": "Qwen3-8B",
        "source": "latent_reasoning_pattern/08_token_label_separability.py → viz_data_sep.json",
        "tag": vd.get("tag"),
        "probe": "LDA probe on mean-pooled span representations (res_L{ll}_mean / res_embed_mean)",
        "layers": layer_keys,
        "pairs": index,
    }, indent=1))
    print(f"wrote {len(index)} pairs × {len(layer_keys)} layers → {OUT}")


if __name__ == "__main__":
    flags = {"--all-layers", "--all-pairs"}
    args = [a for a in sys.argv[1:] if a not in flags]
    if len(args) != 1:
        sys.exit(__doc__)
    main(Path(args[0]), all_layers="--all-layers" in sys.argv, all_pairs="--all-pairs" in sys.argv)
