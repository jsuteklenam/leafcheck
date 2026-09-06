# LeafCheck — Setup & Deployment

## What's in this folder

- `index.html` — the app itself (frontend)
- `manifest.json`, `service-worker.js`, `icons/` — PWA support (installable, offline app shell)
- `api/diagnose.js` — the backend piece: a Vercel serverless function that
  privately calls the crop.health API using your API key, so the key is
  never exposed in the browser

## One-time setup

### 1. Add your Kindwise API key to Vercel

1. Push this whole folder to a GitHub repository.
2. Go to https://vercel.com, click "Add New Project", and import that repo.
3. Before (or after) the first deploy, go to your project's
   **Settings → Environment Variables** and add:
   - Name: `KINDWISE_API_KEY`
   - Value: (paste the crop.health API key from admin.kindwise.com)
4. Deploy (or redeploy, if you added the variable after the first deploy —
   Vercel needs a fresh deploy to pick up new environment variables).

That's it — Vercel automatically detects `index.html` and everything else
as static files, and `api/diagnose.js` as a serverless function, and wires
them together.

## How diagnosis works now

1. The app sends the photo to `/api/diagnose` (our own backend).
2. That function calls crop.health with your private key and gets back
   real classification data (crop type + disease suggestions with
   descriptions and treatment info).
3. Claude turns that structured data into the warm, plain-language,
   correctly-translated result you see in the app.
4. **Fallback:** if `/api/diagnose` isn't reachable — for example if
   you're just opening `index.html` locally as a file, before it's
   deployed — the app automatically falls back to Claude's vision-only
   diagnosis, so it still works while you're testing. Once deployed on
   Vercel with the API key set, it'll use the real crop.health data
   instead.

## Notes

- The `crop.health` API currently covers 23 major crops. For anything
  outside that list, Claude's fallback reasoning kicks in naturally
  since the structured data will come back empty/low-confidence.
- If you want a second Kindwise key for the broader `plant.id` Plant
  Health Assessment product as a wider fallback, you can extend
  `api/diagnose.js` to try that second product when crop.health returns
  no good matches — ask for help with that whenever you're ready.
