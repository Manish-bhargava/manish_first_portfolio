# Deploying to Vercel

Everything is set up: `vercel.json` (functions + security headers), `.vercelignore` (keeps `.env`, old drafts and local tools off the server), `package.json` (Node 22, dependencies).

## First deploy (about 5 minutes)

```bash
cd ~/portfolio_1
npx vercel@latest login          # opens the browser once
npx vercel@latest link           # create / pick the project (accept the defaults)
npm run env:push                 # copies your .env settings to Vercel (values never printed)
npm run deploy                   # builds and publishes to production
```

The last command prints your live URL (e.g. `https://manish-portfolio.vercel.app`).

## What runs where
- Static site: `index.html`, `about.html`, CSS/JS, `images/`, `Fonts/`, resume PDF.
- `api/chat.js` → Rixie (OpenAI or Claude).  `api/contact.js` → messages & call requests to Gmail.
- Limits live in Upstash Redis, so they work across Vercel's servers.

## Later updates
`npm run deploy` again. If you change `.env`, run `npm run env:push` first.

## Custom domain
Vercel dashboard → Project → Settings → Domains. Nothing in the code needs to change: the API accepts requests from its own site on any domain.

## Handy
- Reset rate limits: `npm run reset-limits`
- Logs: `npx vercel@latest logs <your-url>`
