#!/usr/bin/env python3
"""Export the data behind the paper's teaser scatter (11_chunk_viz.py --scatter) for the website.

Run on the server, from latent_reasoning_pattern/ (it imports 11_chunk_viz.py and needs the same files:
RESULTS_LDA_DYN/.../models/res_L20_mean.joblib, .../vectors/res_L20_mean.npz and the q85 .pt under
/mnt/tmp/seogyeong). Nothing is recomputed differently: test dots are Z_te @ d for every operation
direction d, chunk stars are 11_chunk_viz._chunk_vecs(...) @ d, and the per-dot size/alpha weight is
the same own-label min-max score 11_chunk_viz._plot_pair uses.

Usage (server):
  cd latent_reasoning_pattern
  python /path/to/beneath-cot-live/scripts/export_teaser_scatter.py --out teaser_scatter.json
Then copy teaser_scatter.json to beneath-cot-live/public/data/teaser/even-perfect-scatter.json.

The token scores for the left panel come from the existing exporter:
  python 12_export_web_lda.py --from-start --out teaser_tokens.json
  → beneath-cot-live/public/data/teaser/even-perfect-tokens.json
"""
import argparse
import importlib.util
import json
from pathlib import Path

import numpy as np

HERE = Path.cwd()
spec = importlib.util.spec_from_file_location("chunk_viz", HERE / "11_chunk_viz.py")
cv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cv)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    mkey = f"{cv.REP_TYPE}_L{cv.LAYER:02d}_{cv.TOKEN_SEL}"
    res = cv._load_model(mkey)
    if res is None:
        raise SystemExit(f"model {mkey} not found")
    pca, lda, label_names, dir_list = res

    npz = np.load(cv._vectors_path(mkey))
    X_te, y_te = npz["X_te"].astype(np.float32), npz["y_te"]
    valid = y_te < len(label_names)
    X_te, y_te = X_te[valid], y_te[valid]
    Z_te = lda.transform(X_te).astype(np.float64)

    # Same own-label normalisation as _plot_pair (drives dot size and alpha).
    own = np.zeros(len(Z_te))
    for li, d in enumerate(dir_list):
        m = y_te == li
        if d is None or not m.sum():
            continue
        sc = Z_te[m] @ d
        span = sc.max() - sc.min()
        own[m] = (sc - sc.min()) / (span if span > 1e-10 else 1.0)

    scores = np.stack([Z_te @ d for d in dir_list], 1)  # (n, 8)

    reps = cv._load_reps(cv._rep_path())
    if reps is None:
        raise SystemExit(f"rep file not found: {cv._rep_path()}")
    chunk_zs = cv._chunk_vecs(reps, pca, lda, cv.VIZ_CHUNKS)
    chunks = []
    for (s, e), z in zip(cv.VIZ_CHUNKS, chunk_zs):
        if z is None:
            continue
        chunks.append({"seq_start": s, "seq_end": e, "scores": [round(float(z @ d), 6) for d in dir_list]})

    args.out.write_text(json.dumps({
        "meta": {
            "source": "11_chunk_viz.py --scatter (paper teaser)",
            "model_key": cv.MODEL_KEY, "domain": cv.DOMAIN, "query_idx": cv.QUERY_IDX, "try_idx": cv.TRY_IDX,
            "layer": cv.LAYER, "rep_type": cv.REP_TYPE, "token_sel": cv.TOKEN_SEL, "probe": mkey,
            "score": "z_lda @ d_c (unit operation direction in LDA space); test spans = held-out split",
        },
        "labels": label_names,
        "test": {
            "label": y_te.astype(int).tolist(),
            "own": np.round(own, 4).tolist(),
            "scores": np.round(scores, 4).tolist(),
        },
        "chunks": chunks,
    }, separators=(",", ":")))
    print(f"wrote {len(y_te)} test spans, {len(chunks)} chunks → {args.out}")


if __name__ == "__main__":
    main()
