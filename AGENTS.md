# gymtracker project instructions

## Automatic publishing

The user wants Codex to publish completed website changes automatically to
https://gymtracker.kucera.uk after validation. Treat ordinary deployments of
requested website changes as authorized; do not ask for deployment confirmation
again unless the user overrides this preference.

- Finish the requested change before publishing. Do not deploy for read-only
  questions, planning, or instruction-only changes.
- Use `npm run publish:site` from the repository root. It runs typechecking,
  lint, design-token and contrast checks, then builds and deploys with the
  project's installed Wrangler. Stop if any check fails.
- Run any additional checks needed for the changed behavior before deployment.
- Production is the existing Cloudflare Worker `gymtracker`, using
  `wrangler.jsonc` and the custom domain `gymtracker.kucera.uk`. Preserve this
  target and its existing account. `npm run whoami` checks authentication.
- After deployment, verify the live home page and affected routes, check that
  the new assets or behavior are present, and report the URL and deployment
  result. Do not claim success from a build or dry run alone.
- Existing staged or unrelated edits are not automatically authorized for
  publication. Inspect the working tree and avoid publishing unfinished work.
- This preference authorizes website deployment, not automatic Git commits or
  pushes. Preserve the user's staging choices.
- Keep credentials in Wrangler's existing authentication storage, never in
  source code or logs. If authentication expires, report that login is needed.

## Project context

This is a React and TypeScript nutrition and body-weight tracker. Personal data
stays in the browser's IndexedDB database; there is no server-side user database.
Cloudflare serves the static build in `dist`. Preserve existing browser data and
the local-storage architecture when making unrelated changes.
