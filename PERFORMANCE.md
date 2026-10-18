# Performance and Validation

## Changes in This Release

- Navigation hover and keyboard focus load the selected route's JavaScript before the click. Game intent preloads the matching HSK 5 questions and compact dictionary; lesson intent preloads its typed questions and exercise code. Data Saver and 2G connections disable preloading.
- Tutorial forms, game audio players and sentence-reordering code load only when used. Game rules, timers, score bonuses, answer checks and animations retain their existing behavior.
- Concurrent public-data requests share a promise even when a slow response exceeds the cache TTL. TTL begins after the response completes; failures are evicted. Profile and authentication responses are excluded from public caching.
- Cold API requests share one MongoDB connection attempt and reuse its bounded pool. OCR and Google verification code initialize on their respective routes rather than during every backend startup.
- Vercel serves hashed frontend assets and workbook media through its CDN. The deployed app uses relative `/api` URLs, including saved vocabulary, rather than localhost or an older deployment.
- All 72 deployment audio tracks use 64 kbps mono MP3: 325,666,172 original bytes to 162,829,722 deployment bytes, a 50% reduction. Original audio/PDFs remain intact. The PDFs are copied without modification.
- Profile images are deferred at the user's request. Account symbols require no account-image fetches.
- Builds run on Windows and Linux and publish assets before replacing HTML, keeping the existing local application available during subsequent rebuilds. Unused frontend UI dependencies were removed from the backend install.

## Browser Measurements

Three cold browser navigations per route, disabled browser cache, 4x CPU slowdown, 1440x1000 viewport, local production frontend and the real Atlas-backed API. Ready means the page's usable content appeared. These are local measurements, not production Core Web Vitals or a guarantee for every device/network.

| Route | Before median | Initial optimized median |
| --- | ---: | ---: |
| Home | 894 ms | 1,014 ms |
| Login | 914 ms | 1,277 ms |
| Tutorial | 780 ms | 723 ms |
| Game | 2,102 ms | 858 ms |
| Scoreboard | 2,431 ms | 1,835 ms |

This sample supports faster game/tutorial/scoreboard readiness. Home and login were slower in this sample; no across-the-board first-load improvement is claimed. Browser/system load and Atlas latency vary. Intent preloading targets subsequent interactions, rather than downloading every screen during home-page startup. The sample predates the final profile-symbol and extra intent-data preloading changes.

Game JavaScript fetched by these cold runs decreased from 768,491 to 693,790 decoded bytes (about 10%); tutorial JavaScript decreased from 546,612 to 531,934 bytes. Initial home JavaScript increased by about 2.5 KB to support route preloading. All sampled pages made zero third-party asset requests during initial loading.

## Verification Boundaries

Automated checks cover cache expiration and concurrent reads, data-saver behavior, pooled database readiness, login errors/session handling, score queries, all workbook answer keys, question progression, writing self-review, audio/PDF range responses and production routing. Browser checks use controlled login/signup/profile/score mutations to avoid modifying real user accounts or scores. Read-only API checks use the configured database.

Live Google OAuth completion requires the deployed origin to be authorized in Google Cloud; loading the Google sign-in SDK is not equivalent to completing OAuth. Actual account mutations are not part of the smoke tests.
