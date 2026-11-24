# Rixie — deploy notes

Rixie is the chat assistant on every page (`rixie.js` + `rixie.css`).

- **Smart mode (Claude):** `api/chat.js` is a Vercel serverless function. Deploy this folder to Vercel and set:
  - `ANTHROPIC_API_KEY` — required.
  - `RIXIE_SECRET` — any long random string (signs Rixie's replies so history can't be forged).
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — free Upstash Redis; makes the 5-questions-per-visitor limit durable. Without it the server limit is per-instance memory only (best effort).
  - `ALLOWED_ORIGINS` — optional, e.g. `https://your-domain.com`, to block other sites from using your endpoint.
- **Offline mode:** if `/api/chat` isn't reachable (opened as a file, static hosting such as GitHub Pages, missing key), Rixie answers from built-in facts in `rixie.js`. It never makes things up — unknown questions are redirected to Manish's email.

What Rixie knows lives in `api/_knowledge.js` (smart mode) and the `F` object in `rixie.js` (offline mode). Update both when your experience changes.

Limits: 5 questions per visitor per 24 hours — enforced on the server by IP and in the browser by localStorage. Questions are capped at 500 characters.
