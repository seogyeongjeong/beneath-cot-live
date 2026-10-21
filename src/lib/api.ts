// Client for the Cloudflare Worker proxy. The browser never talks to Runpod and
// holds no secret: only the public proxy URL and a per-job token from the proxy.
import type { WireResult } from "./trace-types";

export const API_BASE: string = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  constructor(body: ApiErrorBody) {
    super(body.message);
    this.code = body.code;
  }
}

export interface Health {
  ok: boolean;
  schema_version: string;
  enabled: boolean;
  generate_enabled: boolean;
  turnstile: boolean;
  max_text_chars?: number;
  max_question_chars?: number;
  /** GPU upstream behind the proxy ("runpod" | "modal"); informational only. */
  backend?: string;
}

export interface Quota {
  ip_remaining_today: number;
  global_remaining_today: number;
  global_remaining_month: number;
}

interface Submit {
  job_id: string;
  job_token: string;
  status: string;
  poll_url: string;
  poll_after_ms: number;
  deduplicated?: boolean;
  cost?: number;
  quota?: Quota;
}

interface JobStatus {
  job_id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
  queue_ms: number | null;
  execution_ms: number | null;
  result?: WireResult;
  error?: ApiErrorBody;
}

export interface JobOutcome {
  result: WireResult;
  jobId: string;
  queueMs: number | null;
  executionMs: number | null;
  deduplicated: boolean;
  quota?: Quota;
}

export type Progress = { phase: "submitting" } | { phase: "queued" | "running"; elapsedMs: number; jobId: string };

async function readJson(r: Response): Promise<any> {
  try {
    return await r.json();
  } catch {
    throw new ApiError({ code: "upstream_error", message: `unexpected response (HTTP ${r.status})` });
  }
}

export async function getHealth(signal?: AbortSignal): Promise<Health> {
  const r = await fetch(`${API_BASE}/api/health`, { signal });
  const body = await readJson(r);
  if (!r.ok) throw new ApiError(body.error ?? { code: "upstream_error", message: `HTTP ${r.status}` });
  return body;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new DOMException("aborted", "AbortError"));
    }, { once: true });
  });

const DEADLINE_MS = 4 * 60_000; // cold start (model load + self-test) can take minutes

export async function runJob(
  path: "/api/analyze" | "/api/generate",
  body: Record<string, unknown>,
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<JobOutcome> {
  onProgress({ phase: "submitting" });
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const sub: Submit & { error?: ApiErrorBody; dry_run?: boolean; checks?: Record<string, string> } = await readJson(r);
  if (!r.ok) throw new ApiError(sub.error ?? { code: "upstream_error", message: `HTTP ${r.status}` });
  if (sub.dry_run) {
    // Staging proxy (RUNPOD_DRY_RUN=1): every server check passed, no GPU job exists.
    const c = sub.checks ?? {};
    throw new ApiError({
      code: "dry_run",
      message: `server checks passed (origin ${c.origin}, input ${c.input}, Turnstile ${c.turnstile}, burst ${c.burst}); no GPU job was started`,
    });
  }

  const headers = { "X-Job-Token": sub.job_token };
  const t0 = Date.now();
  let wait = sub.poll_after_ms || 2000;
  try {
    while (Date.now() - t0 < DEADLINE_MS) {
      await sleep(wait, signal);
      const pr = await fetch(`${API_BASE}${sub.poll_url}`, { headers, signal });
      const s: JobStatus & { error?: ApiErrorBody } = await readJson(pr);
      if (pr.status === 429) {
        wait = Math.min(wait * 2, 10_000);
        continue;
      }
      if (!pr.ok) throw new ApiError(s.error ?? { code: "upstream_error", message: `HTTP ${pr.status}` });
      if (s.status === "COMPLETED" && s.result) {
        return {
          result: s.result, jobId: sub.job_id, queueMs: s.queue_ms, executionMs: s.execution_ms,
          deduplicated: !!sub.deduplicated, quota: sub.quota,
        };
      }
      if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(s.status)) {
        throw new ApiError(s.error ?? { code: "job_failed", message: s.status.toLowerCase() });
      }
      onProgress({ phase: s.status === "IN_PROGRESS" ? "running" : "queued", elapsedMs: Date.now() - t0, jobId: sub.job_id });
      wait = Math.min(wait * 1.4, 5000);
    }
    throw new ApiError({ code: "job_failed", message: "timed out waiting for the GPU" });
  } catch (e) {
    // Stop paying for a job nobody is waiting for.
    fetch(`${API_BASE}/api/jobs/${sub.job_id}/cancel`, { method: "POST", headers }).catch(() => {});
    throw e;
  }
}

export const ERROR_HINT: Record<string, string> = {
  dry_run: "This proxy is a dry-run staging instance; it never starts GPU jobs.",
  rate_limited: "Too many requests from your network. Wait a little and try again.",
  busy: "The GPU is busy with another request. Try again in a minute.",
  quota_exhausted: "The demo's GPU budget is used up for now. Please try again later; the rest of the page still works.",
  service_disabled: "The live GPU demo is paused right now. The rest of the page still works.",
  turnstile_failed: "Human verification failed. Reload the page and try again.",
  forbidden_origin: "This site is not allowed to call the API.",
  worker_unhealthy: "The GPU worker failed its start-up self-test, so it refused to score.",
  duplicate_in_progress: "The same request is already being submitted. Wait a few seconds.",
};
