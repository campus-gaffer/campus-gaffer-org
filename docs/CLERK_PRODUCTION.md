# Clerk: moving from Development to Production

The app currently runs on a Clerk **development** instance (`pk_test_…` keys).
That's fine for an MVP / closed beta, but the dev instance has real limits.
This doc captures what to do when it's time to flip to a **production** instance.

All Clerk configuration is env-driven, so **this is a configuration task, not a
code change.** Nothing in the app needs to be rebuilt beyond re-reading the new
values.

## When to flip

Treat either of these as the trigger:

- You're approaching the dev-instance **user cap** (historically ~100 users —
  new sign-ups start failing once you hit it). Confirm the current number in
  your Clerk dashboard.
- You're **sharing the app publicly** and want the Google/Apple consent screen
  to show "Campus Gaffer" instead of Clerk's shared dev branding.

## Why the dev instance isn't production-safe

- **User cap** — sign-ups hard-stop at the limit.
- **Shared social OAuth** — in dev, Google/Apple go through Clerk's *own* OAuth
  apps (shows Clerk branding, rate-limited, "not for production"). This matters
  because the app is **social-only** — no password fallback.
- **Weaker sessions** — dev tokens ride a cross-domain handshake reachable by
  JS, rather than a first-party httpOnly cookie on your domain.
- **Low rate limits / no durability** — dev API + email are throttled, and dev
  instances aren't SLA-backed and can be reset.

## Prerequisite: a custom domain

Clerk production **requires a domain you control** (you add DNS records to it).
You cannot do this on a `*.vercel.app` subdomain, so:

1. Buy a domain (e.g. `campusgaffer.com`, ~$10–15/yr).
2. Point the Vercel frontend at it.
3. Use it for Clerk (below). Your prod Clerk Frontend API lives at
   `https://clerk.<yourdomain>`.

## Step-by-step

### 1. Create the production instance
Clerk dashboard → environment switcher (top-left) → **Production**. It's a
separate instance: its own users, keys, social config, and webhooks. Nothing
copies over from Development automatically.

### 2. Add Clerk's DNS records
Clerk provides CNAMEs (`clerk.`, `accounts.`, `clkmail.`, DKIM `clk._domainkey…`).
Add them to your domain's DNS and let Clerk verify.

### 3. Bring your own social credentials
Production requires **your own** OAuth apps per provider:

- **Google** — create an OAuth client in Google Cloud Console, set the
  authorized redirect URI to what Clerk shows
  (`https://clerk.<yourdomain>/v1/oauth_callback`), paste the client ID/secret
  into Clerk.
- **Apple** — Apple Developer account → Services ID + key, per Clerk's Apple
  guide.

> Do this **before** cutting over: with no password fallback, mis-configured
> social = no working login.

### 4. Swap keys/secrets in all three places

| Value | Where | Dev → Prod |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Vercel project env vars | `pk_test_…` → `pk_live_…` |
| `CLERK_SECRET_KEY` | backend env / SSM `/campus-gaffer/clerk-secret-key` | `sk_test_…` → `sk_live_…` |
| `CLERK_ISSUER` | backend env / SSM `/campus-gaffer/clerk-issuer` | `https://<slug>.clerk.accounts.dev` → `https://clerk.<yourdomain>` |
| `CLERK_WEBHOOK_SECRET` | backend env / SSM `/campus-gaffer/clerk-webhook-secret` | new prod `whsec_…` (step 5) |

> The backend **pins the issuer** (`internal/auth/jwt.go`), so `CLERK_ISSUER`
> must be exactly the prod Frontend API domain or every token is rejected (401).
> On AWS the task reads these from SSM (`USE_SSM_CONFIG=true`) — update the SSM
> parameters and redeploy the service.

### 5. Re-create the webhook
The backend serves `POST /webhooks/clerk`. In the **production** dashboard →
Webhooks, add an endpoint at `https://<your-prod-api>/webhooks/clerk`, subscribe
to the user events, and copy the **new** signing secret into
`CLERK_WEBHOOK_SECRET` / the SSM param. (The dev secret won't validate prod
payloads.)

### 6. Allowlists
- **Clerk (prod)** → add your prod frontend origin as an allowed origin /
  redirect, including `https://<yourdomain>/sso-callback`.
- **Backend** `CORS_ALLOWED_ORIGINS` → add your prod frontend origin. It refuses
  to start empty and takes no wildcards.

### 7. Redeploy
- **Frontend:** Vite **inlines** `VITE_CLERK_PUBLISHABLE_KEY` at build time, so
  setting the Vercel env var is not enough — trigger a **new build**.
- **Backend:** redeploy so it picks up the new SSM values.

Once the app loads with `pk_live_…`, the "development keys" console warning
disappears.

## Quick verification

- [ ] Console no longer shows the development-keys warning.
- [ ] Google/Apple consent screen shows "Campus Gaffer", not Clerk.
- [ ] Sign-in completes and lands on `/home` (no 404 on `/sso-callback`).
- [ ] An authenticated API call succeeds (backend accepts the prod-issuer JWT).
- [ ] A new sign-up creates a user row via the prod webhook.
