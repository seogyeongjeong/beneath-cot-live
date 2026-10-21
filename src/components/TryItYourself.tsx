import { useEffect, useRef, useState } from "react";
import { adaptResult, ContractError } from "../lib/adapt";
import { API_BASE, ApiError, ERROR_HINT, getHealth, runJob, type Health, type Progress } from "../lib/api";
import type { Trace } from "../lib/trace-types";
import { QUESTION_EXAMPLES, TRACE_EXAMPLES } from "../lib/tryExamples";
import { TURNSTILE_SITE_KEY, turnstileToken } from "../lib/turnstile";
import { TraceResult } from "./TraceResult";

// Hosted inference goes through the Cloudflare Worker proxy (beneath-cot-backend/cloudflare) to a
// Runpod GPU worker; this page only sends text and draws the returned scores. Limits mirror the proxy:
// MAX_TEXT_CHARS / MAX_QUESTION_CHARS from /api/health, GENERATE_TOKEN_CHOICES = 128, 256, and the
// worker scores at most the first 256 tokens of a pasted trace.
const TOKEN_CHOICES = [128, 256] as const;
const SCORED_TOKENS = 256;

type Mode = "analyze" | "generate";

function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!API_BASE) return;
    const ac = new AbortController();
    getHealth(ac.signal)
      .then(setHealth)
      .catch((e) => e.name !== "AbortError" && setError(e.message || "network error"));
    return () => ac.abort();
  }, []);
  return { health, error };
}

function useJob(health: Health | null) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const tsHost = useRef<HTMLDivElement>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function run(
    path: "/api/analyze" | "/api/generate",
    body: Record<string, unknown>,
    source: Mode,
    done: (t: Trace) => void,
    inputText?: string,
  ) {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setError(null);
    setProgress({ phase: "submitting" });
    try {
      if (health?.turnstile) {
        if (!TURNSTILE_SITE_KEY) throw new ApiError({ code: "turnstile_failed", message: "this build has no Turnstile site key" });
        body = { ...body, turnstile_token: await turnstileToken(tsHost.current!) };
      }
      const out = await runJob(path, body, setProgress, ac.signal);
      done(
        adaptResult(out.result, source, {
          inputText,
          job: { id: out.jobId, queueMs: out.queueMs, executionMs: out.executionMs, deduplicated: out.deduplicated },
        }),
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") setError({ code: "cancelled", message: "The request was cancelled." });
      else if (e instanceof ApiError) setError({ code: e.code, message: e.message });
      else if (e instanceof ContractError) setError({ code: "contract", message: `The server result failed validation: ${e.message}` });
      else setError({ code: "network", message: "Could not reach the analysis server." });
    } finally {
      setProgress(null);
    }
  }

  const status = (
    <>
      <div ref={tsHost} className="ts-host" />
      {progress && (
        <div className="try-status" role="status">
          <span className="spinner" aria-hidden />
          <span>
            {progress.phase === "submitting"
              ? "Sending the request…"
              : progress.phase === "queued"
                ? `Waiting for the GPU (${Math.round(progress.elapsedMs / 1000)} s). If the model is not loaded yet, starting it can take up to about four minutes.`
                : `Running on the GPU (${Math.round(progress.elapsedMs / 1000)} s)…`}
          </span>
          <button type="button" className="try-link" onClick={() => abort.current?.abort()}>
            Cancel
          </button>
        </div>
      )}
      {error && (
        <div className="try-error" role="alert">
          {ERROR_HINT[error.code] ?? error.message}
          {ERROR_HINT[error.code] && <span className="rw-muted"> ({error.message})</span>}
        </div>
      )}
    </>
  );
  return { run, busy: progress !== null, status };
}

function Availability({ health, error }: { health: Health | null; error: string | null }) {
  if (!API_BASE) return <p className="try-notice">The analysis server is not configured in this build of the page.</p>;
  if (error) return <p className="try-notice">The analysis server cannot be reached right now ({error}). The rest of the page is unaffected.</p>;
  if (!health) return <p className="try-notice rw-muted">Checking the analysis server…</p>;
  if (!health.enabled) return <p className="try-notice">The live GPU demo is paused at the moment. You can still prepare an input; please try again later.</p>;
  return null;
}

function Examples({ items, onPick }: { items: { title: string; text: string }[]; onPick: (t: string) => void }) {
  return (
    <div className="try-examples">
      <span className="sv-label">Examples</span>
      {items.map((x) => (
        <button key={x.title} type="button" onClick={() => onPick(x.text)}>
          {x.title}
        </button>
      ))}
    </div>
  );
}

export function TryItYourself() {
  const { health, error: healthError } = useHealth();
  const [mode, setMode] = useState<Mode>("analyze");
  const [results, setResults] = useState<Record<Mode, Trace | null>>({ analyze: null, generate: null });
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [maxNew, setMaxNew] = useState<(typeof TOKEN_CHOICES)[number]>(128);
  const analyze = useJob(health);
  const generate = useJob(health);

  const live = !!API_BASE && !!health?.enabled;
  const genLive = live && !!health?.generate_enabled;
  const maxText = health?.max_text_chars ?? 1000;
  const maxQuestion = health?.max_question_chars ?? 1000;
  const result = results[mode];
  const gen = result?.generation;

  return (
    <section className="section section-plain wrap" id="try" aria-labelledby="try-title">
      <h2 id="try-title" className="section-heading">
        Try it yourself
      </h2>
      <p className="section-intro">Explore reasoning operations in your own text.</p>
      <div className="prose">
        <p>
          Analyze an existing reasoning trace, or let a model generate a solution to your question. Explore the
          resulting operation-aligned signals through an interactive token-level heatmap.
        </p>
      </div>

      <div className="try">
        <div className="try-tabs" role="tablist" aria-label="Mode">
          {(
            [
              ["analyze", "Analyze a Trace"],
              ["generate", "Generate & Analyze"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>

        <Availability health={health} error={healthError} />

        {mode === "analyze" ? (
          <form
            className="try-form"
            onSubmit={(e) => {
              e.preventDefault();
              analyze.run("/api/analyze", { text, include_cosine: false }, "analyze", (t) => setResults((r) => ({ ...r, analyze: t })), text);
            }}
          >
            <label className="try-label" htmlFor="try-text">
              Paste a reasoning trace
            </label>
            <textarea
              id="try-text"
              rows={6}
              maxLength={maxText}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. a few sentences of step-by-step reasoning"
            />
            <Examples items={TRACE_EXAMPLES} onPick={setText} />
            <div className="try-row">
              <span className="rw-muted">
                {text.length} / {maxText} characters · the first {SCORED_TOKENS} tokens are scored
              </span>
              <button type="submit" className="try-submit" disabled={!live || analyze.busy || !text.trim()}>
                Analyze
              </button>
            </div>
            {analyze.status}
          </form>
        ) : (
          <form
            className="try-form"
            onSubmit={(e) => {
              e.preventDefault();
              generate.run("/api/generate", { question, max_new_tokens: maxNew }, "generate", (t) => setResults((r) => ({ ...r, generate: t })));
            }}
          >
            <label className="try-label" htmlFor="try-question">
              Ask a question
            </label>
            <textarea
              id="try-question"
              rows={3}
              maxLength={maxQuestion}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. a short math problem"
            />
            <Examples items={QUESTION_EXAMPLES} onPick={setQuestion} />
            <div className="try-row">
              <span className="try-inline">
                <span className="sv-label">Maximum new tokens</span>
                {TOKEN_CHOICES.map((k) => (
                  <label key={k} className="try-radio">
                    <input type="radio" name="try-maxnew" checked={maxNew === k} onChange={() => setMaxNew(k)} /> {k}
                  </label>
                ))}
              </span>
              <button type="submit" className="try-submit" disabled={!genLive || generate.busy || !question.trim()}>
                Generate &amp; Analyze
              </button>
            </div>
            <p className="rw-muted try-hint">
              Qwen3-8B answers with thinking enabled, so even 256 tokens often stops it mid-solution.
              {live && !health?.generate_enabled && " Generation is not enabled on the server yet."}
            </p>
            {generate.status}
          </form>
        )}

        {result && (
          <div className="try-result">
            {gen && (
              <p className="try-gen-note">
                Generated {result.tokens.length} tokens;{" "}
                {gen.stop_reason === "max_new_tokens"
                  ? `stopped at the ${gen.max_new_tokens}-token limit, so the solution is cut off.`
                  : "the model finished its answer."}
              </p>
            )}
            {!gen && result.truncated && (
              <p className="try-gen-note">Only the first {result.nInputTokens} tokens of the text were scored.</p>
            )}
            {result.raw.infrastructure?.gpu && (
              <p className="try-infra">
                Computed on {result.raw.infrastructure.gpu}
                {result.raw.infrastructure.backend ? ` (${result.raw.infrastructure.backend})` : ""}.
              </p>
            )}
            <TraceResult key={result.job?.id ?? result.tokens.length} trace={result} />
          </div>
        )}

        <p className="try-fineprint rw-muted">
          Text is sent to a hosted GPU running Qwen3-8B and the paper's probes; the heatmap is drawn in your browser.
          Do not submit private information.
        </p>
      </div>
    </section>
  );
}
