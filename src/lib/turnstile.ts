// Cloudflare Turnstile, invisible unless Cloudflare decides to ask the visitor.
// The token is verified by the proxy (server side) on every submit.
export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

let loading: Promise<void> | null = null;

function load(): Promise<void> {
  loading ??= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error("could not load Turnstile"));
    document.head.appendChild(s);
  });
  return loading;
}

/** Get a fresh single-use token. `host` is an element the widget may show a challenge in. */
export async function turnstileToken(host: HTMLElement): Promise<string> {
  await load();
  const ts = window.turnstile!;
  host.replaceChildren();
  return new Promise((res, rej) => {
    const id = ts.render(host, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: "interaction-only",
      execution: "render",
      callback: (token: string) => res(token),
      "error-callback": () => rej(new Error("human verification failed")),
      "expired-callback": () => ts.reset(id),
    });
  });
}
