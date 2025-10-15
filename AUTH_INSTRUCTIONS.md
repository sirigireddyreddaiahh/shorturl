Google OAuth integration added.
- Set environment variables: NUXT_GOOGLE_CLIENT_ID, NUXT_GOOGLE_CLIENT_SECRET, NUXT_AUTH_SECRET
- Endpoints:
  - GET /api/auth/login -> redirects to Google consent
  - GET /api/auth/callback -> OAuth callback, sets SESSION cookie
  - GET /api/auth/logout -> clears session cookie
- Protected API: All /api/* (except /api/_) now require session cookie and will have event.context.user set.
- Link creation now attaches `owner` with {sub,email,name} and list endpoint filters by owner.
