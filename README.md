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
3. Open **Settings → Variables and Secrets → Add**.
4. Add a plain-text variable named `WORKER_URL` with the base HTTPS URL of your existing Worker, for example `https://your-worker.your-account.workers.dev`. Do not add a trailing path such as `/api/admin`.
5. Add `ADMIN_KEY`, paste the administrator key used by the existing Worker, and select **Encrypt** so it is stored as a Secret.
6. Add the bindings to both **Production** and **Preview** environments if you need both deployments. Use the correct Worker URL/key for each environment.
7. Save the settings and trigger a new deployment. Pages Functions receive the updated bindings on deployment.

After deployment, open the site and select **Load accounts**. The browser calls the same-origin `/api/admin/...` Pages Function. The Function adds the `X-Admin-Key` header server-side and forwards only these supported operations:

- `GET /api/admin/users`
- `POST /api/admin/create-user`
- `PATCH /api/admin/update-balance`

The key is never embedded in HTML or JavaScript and is not returned by `/api/config`.

## Protect the admin site with Cloudflare Access

**Important: do not leave this administrator page publicly accessible.** The Pages Function holds the admin key, so anyone who can reach an unprotected page could call its proxy endpoints. Put the Pages site behind Cloudflare Access and create an Allow policy limited to your own email address (or trusted administrator emails).

For the `pages.dev` hostname, use the Pages project **Settings → Enable access policy** option. Cloudflare documents an additional step to protect the production `*.pages.dev` hostname: open the generated Access application, edit its public hostname, remove the wildcard subdomain, and save. If you use a custom domain, create a separate **Zero Trust → Access → Applications → Add application → Self-hosted** application for that hostname and apply the same restricted Allow policy. Also keep preview deployments protected.

## Important

- Deploy as **Cloudflare Pages with Functions enabled**, using the repository root as the build output directory for this no-build static site. Do not deploy only the static files to a host that does not run Pages Functions.
- Keep `ADMIN_KEY` encrypted as a Cloudflare Secret. Never commit it to Git or put it in a browser-exposed variable.
- The Pages Function requires the Worker to accept the existing `X-Admin-Key` header and the three routes listed above.
- The Worker URL must use HTTPS. The proxy allowlists only these admin routes and methods.
