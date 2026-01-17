# Insight Builder Studio

## Overview

Insight Builder Studio is an AI-assisted OCR and reporting workspace for inspection teams. Upload raw field reports, run OCR + OpenAI-powered corrections, and manage jobs, validations, and exports in a single React/Tailwind UI.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` (if you keep a template) or create `.env` in the repo root with the following keys. **Do not commit secrets.**

   ```
   VITE_OPENAI_API_KEY=<your OpenAI API key>
   VITE_GOOGLE_CLOUD_API_KEY=<your Google Vision key>
   VITE_FIREBASE_API_KEY=<your Firebase API key>
   VITE_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
   VITE_FIREBASE_PROJECT_ID=<firebase-project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
   VITE_FIREBASE_APP_ID=<firebase-app-id>
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Testing & linting

- `npm run test` executes the Vitest suite.
- `npm run lint` runs ESLint across the workspace.

## Building & deploying

- `npm run build` produces a production-ready `dist/`.
- `npm run preview` runs `vite preview` so you can sanity check the build locally.

### Deploying on Vercel

1. Connect your Git repository to Vercel and set the root to `/`.
2. Use `npm install` as the install command (default) and `npm run build` as the build command.
3. Set the environment variables listed above inside Vercel's dashboard (matching the `VITE_` prefix).
4. Optional: pin the Node.js version in Vercel's settings to the version you are developing with.

## Assets & metadata

- `public/favicon.ico` and `public/placeholder.svg` are the base assets delivered to browsers; replace them before launch if you want custom branding.
- `index.html` already reflects the Insight Builder Studio metadata (title, description, Open Graph tags) for social previews.

## Notes

- Secrets are only read at build time via `import.meta.env`, so they must exist in Vercel’s environment settings before the build runs.
- The project is self-contained in this repo and only needs the Vite/React/Tailwind setup shown here; all generator tooling was removed.
