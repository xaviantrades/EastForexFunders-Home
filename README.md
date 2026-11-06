# EastForexFunders-Home

Static admin interface for East Forex Funders, deployed on Cloudflare Pages.

## Project layout

- `index.html` — page structure
- `styles.css` — responsive styling
- `app.js` — browser-side form and account-list behavior
- `functions/api/admin/[[path]].js` — server-side proxy for the protected Worker admin API
- `functions/api/config.js` — reports whether the server-side connection is configured (does not return secrets)

## Cloudflare Pages setup

The browser no longer needs the Worker URL or administrator key. Configure both values as server-side bindings in Cloudflare Pages:

1. Open the Cloudflare dashboard and select **Workers & Pages**.
2. Open the Pages project connected to this repository.
3. Open **Settings → Variables and Secrets** (the exact label may vary by dashboard version).
4. Add a variable named `WORKER_URL` with the base HTTPS URL of your existing Worker, for example `https://your-worker.your-account.workers.dev`. Do not add a trailing path such as `/api/admin`.
5. Add a **Secret** named `ADMIN_KEY` and paste the administrator key used by the existing Worker. Do not create this as a plain-text browser variable.
6. Add the bindings to both **Production** and **Preview** environments if you want both deployments to work. Use the appropriate Worker URL/key for each environment.
7. Save the settings, then trigger a new deployment (for example, **Deployments → Retry deployment** on the latest commit). Pages Functions receive updated bindings on a new deployment.

After deployment, open the site and select **Load accounts**. The browser calls the same-origin `/api/admin/...` Pages Function. The Function adds the `X-Admin-Key` header server-side and forwards only the three supported operations to the configured Worker:

- `GET /api/admin/users`
- `POST /api/admin/create-user`
- `PATCH /api/admin/update-balance`

The key is never embedded in HTML or JavaScript and is not returned by `/api/config`.

## Important

- Deploy this project as **Cloudflare Pages with Functions enabled**, using the repository root as the build output directory for a no-build static site. Do not deploy only the static files to a host that does not run Pages Functions.
- Keep `ADMIN_KEY` as a Cloudflare Secret. Never commit it to Git or put it in a `VITE_*`, `NEXT_PUBLIC_*`, or other browser-exposed variable.
- The Pages Function requires the Worker to accept the existing `X-Admin-Key` header and the three routes above.
- The Worker URL must use HTTPS. The proxy allowlists only these admin routes and methods.
