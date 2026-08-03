// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  // Secrets set via `wrangler secret put` / the Cloudflare dashboard, not
  // wrangler.jsonc `vars` -- so they never end up committed to the repo.
  // Declared here to extend the generated worker-configuration.d.ts Env.
  interface Env {
    // Optional on purpose: Pages Functions support only a subset of bindings
    // and the rate limit binding is not in it, so this is undefined in the
    // deployed Pages runtime. Bound only when running as a Worker.
    CONTACT_FORM_RATE_LIMITER?: RateLimit;
    TURNSTILE_SECRET_KEY: string;
    RESEND_API_KEY: string;
    CONTACT_TO_EMAIL: string;
    CONTACT_FROM_EMAIL: string;
  }

  namespace App {
    interface Platform {
      env: Env;
      ctx: ExecutionContext;
      caches: CacheStorage;
      cf?: IncomingRequestCfProperties;
    }

    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
  }
}

export {};
