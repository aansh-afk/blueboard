# LTF1 client suite onboarding portal

React + Convex onboarding app for LTF1 client suite.

## What this includes

- Client-friendly multi-step questionnaire UX (non-technical tone)
- Convex backend to store responses
- Responses dashboard to view submissions
- Export any submission as JSON or Markdown
- PDF welcome letter generator (`scripts/generate_welcome_letter_pdf.py`)

## Project structure

- `src/` React frontend
- `convex/` backend schema + functions + HTTP endpoints
- `scripts/` utility scripts (PDF generation)
- `assets/` generated artifacts

## Local setup

```bash
npm install
cp .env.example .env.local
```

Set:

- `VITE_CONVEX_HTTP_URL` to your Convex site URL, for example:
  - `https://your-project-name.convex.site`
- Optional fallback: `VITE_CONVEX_URL` (Convex cloud URL). The app will map `.convex.cloud` to `.convex.site` automatically.

After editing `.env.local`, restart `npm run dev`.

Run frontend:

```bash
npm run dev
```

## Convex backend setup

```bash
npx convex dev
```

Then deploy backend:

```bash
npx convex deploy
```

HTTP endpoints exposed by Convex:

- `POST /api/submit`
- `GET /api/responses`
- `GET /api/response?id=<responseId>`

## Vercel deploy

Use these settings in Vercel:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_CONVEX_HTTP_URL` = your deployed Convex site URL
  - Optional fallback: `VITE_CONVEX_URL` = your Convex cloud URL

`vercel.json` includes SPA rewrite support for React Router.

## Generate welcome letter PDF

```bash
python3 -m venv .venv
.venv/bin/pip install reportlab
.venv/bin/python scripts/generate_welcome_letter_pdf.py
```

Output:

- `assets/ltf1_client_suite_welcome_letter.pdf`
