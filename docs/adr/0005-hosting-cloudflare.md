# ADR-0005: Hosting: Cloudflare Pages + Workers

Date: 2026-06-29
Status: Accepted

## Context

The site was hosted on Netlify. The domain is registered at Cloudflare, which means Cloudflare is already the DNS provider. Netlify was an extra vendor in the chain with no benefit over going directly to Cloudflare Pages.

The site is otherwise static. The one server-side requirement is a contact form that sends email without exposing an address in the HTML.

## Decision

Deploy to Cloudflare Pages via `adapter-cloudflare`. Handle the contact form with a Cloudflare Worker that validates submissions with a bot protection service and delivers email via a transactional email provider.

## Alternatives considered

**Stay on Netlify with Netlify Forms.** Netlify Forms handles the contact form with near-zero setup, just an HTML attribute. The free tier now includes unlimited form submissions (changed April 2026). The downside: Netlify's free bandwidth cap is ~15 GB/month and the site goes offline with no grace period if that's exceeded. Having the domain at Cloudflare and the site at Netlify also means managing two vendors when one covers both.

**`adapter-static` instead of `adapter-cloudflare`.** Pure static output, host-agnostic. No Workers support, so the contact form would need a third-party service. Using `adapter-cloudflare` keeps the contact form native to the stack while still prerendering everything at build time.

**A third-party form service** (Formspark, Splitforms, etc.). Works on any host. Adds a vendor dependency for functionality that a single Worker handles without one.

## Consequences

- DNS, CDN, and hosting are all in the same Cloudflare dashboard as the domain.
- Static asset requests are free and unlimited on Cloudflare Pages. No bandwidth cap.
- The contact form is a SvelteKit form action backed by a Worker. It works without JavaScript (progressive enhancement built in).
- The contact form uses a bot protection service integrated at the Worker level, not the client form layer, so it can't be bypassed by submitting the form endpoint directly.
- Rate limiting is enforced in the Worker independently of the email provider. Excessive requests from a single IP are rejected before they reach the email delivery step.
- Email delivery is handled by a transactional email provider via API call inside the Worker. Credentials are environment variables in the Cloudflare dashboard, not in the repo.
- HTTP security headers are configured via a `_headers` file in the Cloudflare Pages output. See ADR-0003 for the full header policy.
