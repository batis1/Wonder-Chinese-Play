# Wonder Chinese Play

HSK 5 games and workbook practice, with 36 lessons, 216 activities, original illustrations, audio and the supplied answer keys.

## Applications

- `whsk-frontend`: React application. Screens load on demand; navigation intent preloads the next screen. Public course requests share a bounded browser cache. Account responses remain fresh.
- `whsk-backend`: Express API backed by MongoDB Atlas. Concurrent requests share one database connection pool. Public question and dictionary reads share bounded caches; successful writes invalidate them.
- `vercel.json`: one deployment containing frontend and backend services. Vercel Services is currently in beta. `/api` selects the backend; browser routes select the frontend. Audio, PDFs and illustrations are static CDN assets rather than database queries.

## Local Setup

Use Node.js 22. Install dependencies in both application folders with `npm ci --legacy-peer-deps`. Set backend environment variables using `.env.example`, and run `npm start` in `whsk-backend`. In `whsk-frontend`, run `npm run build` and `npm run start:production`. Open http://localhost:3000.

The production frontend proxies `/api` to localhost:5000 locally. Cloud deployments use the same relative API URLs. The frontend build works on Windows and Linux and preserves the running build until replacement assets are ready.

## Deployment Settings

Create one Vercel project connected to this repository, at the repository root, with Node.js 22. The checked-in configuration owns both services and uses an Express API with Fluid compute. Configure `MONGODB_URL`, `GOOGLE_CLIENT_ID`, `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_API_BASE_URL=/api` as Vercel environment variables. Profiles currently use a generic account symbol, without uploaded images or image requests.

Google OAuth must allow the final site origin in the Google Cloud client configuration. Deployment protection uses the project's Vercel defaults.

## Workbook Assets

Deployment copies are under `whsk-backend/public/workbook/hsk5`. There are 72 mono MP3 tracks encoded at 64 kbps, four original PDF documents, typed lesson JSON, supplied answer keys and workbook illustrations. The original files were preserved outside this repository. Paragraph question 32 has no model answer in the supplied source and remains a self-review exercise.

`scripts/prepare-release.cjs <original-workspace>` imports app source and prepares deployment assets using FFmpeg. Run it only from the original workspace containing both applications and `Workbook`; existing generated audio is reused. See `reports/media.json` for transfer-size measurements. No database dump, `.env` file, runtime log or local user progress belongs in this repository.

## Verification

Backend: `node --test tests/*.test.js` from `whsk-backend`. Frontend: build first, then `node --test scripts/*test.cjs` from `whsk-frontend`. PDF provenance and audio checks also work against the included deployment assets when the original `Workbook` folder is absent.

See `PERFORMANCE.md` for measured results and verification limits. Timings vary with device, network, database state and cold starts; they are measurements rather than a guarantee of maximum speed.
