# Agyal tldraw Sync Worker

Real-time whiteboard sync for live streams. Deploy separately from the Next.js app.

## Prerequisites

- Cloudflare account
- R2 bucket (same bucket as the main app uploads)
- `TLDRAW_SYNC_SECRET` — same value as in the Next.js `.env`

## Setup

1. Edit `wrangler.toml`:
   - Set `bucket_name` to your R2 bucket name (same as `R2_BUCKET_NAME` in the main app)
   - Set `ALLOWED_ORIGINS` to your site URL(s), e.g. `http://localhost:3000,https://your-app.vercel.app`

2. Install and deploy:

```powershell
cd workers/tldraw-sync
npm install
npx wrangler secret put TLDRAW_SYNC_SECRET
npx wrangler deploy
```

3. Copy the deployed worker URL into the main app `.env`:

```
NEXT_PUBLIC_TLDRAW_SYNC_URL=https://agyal-tldraw-sync.your-account.workers.dev
TLDRAW_SYNC_SECRET=your-long-random-secret
NEXT_PUBLIC_TLDRAW_LICENSE_KEY=your-tldraw-license-key
```

## Local development

```powershell
npx wrangler dev
```

Point `NEXT_PUBLIC_TLDRAW_SYNC_URL` to `http://127.0.0.1:8787` while testing locally.

## First-time deploy: workers.dev subdomain required

If deploy fails with **code 10063** (`You need a workers.dev subdomain`), register one first:

1. Open: https://dash.cloudflare.com/a35b0118a60aff4493f481ac5cf1ff4d/workers/onboarding
2. Choose a subdomain (e.g. `agyal` → `agyal.workers.dev`)
3. Run `npx wrangler deploy` again

Or run deploy interactively in your terminal — Wrangler will prompt you to register a subdomain.

After deploy, set in the main app `.env`:

```
NEXT_PUBLIC_TLDRAW_SYNC_URL=https://agyal-tldraw-sync.<your-subdomain>.workers.dev
```
