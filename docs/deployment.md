# Free Render frontend + backend with persistent PostgreSQL

BhuMi runs its frontend and backend in **one Next.js web service**. The rebuilt hosted configuration stores records, accounts and sessions in external PostgreSQL, not Render's temporary filesystem. The small application pool has at most three connections and verifies remote TLS certificates.

## 1. Create a PostgreSQL database

Choose a provider offering a suitable free PostgreSQL tier, such as [Neon](https://neon.com/) or [Supabase](https://supabase.com/). Check its current free limits, inactivity policy and region before creating the project; free plans and quotas can change. No provider account has been created for you.

1. Create a project/database dedicated to BhuMi.
2. In the provider's connection settings, copy its **pooled PostgreSQL connection string**, including the user, password, host, port and database name.
3. Prefer an IPv4-capable pooler endpoint for Render. For Supabase, use its pooler connection details, not the public project HTTP URL or API key. For Neon, choose the pooled connection option.
4. Store it securely as Render's `DATABASE_URL`. Do not paste it into chat, commit it to Git or expose it to browser code.

The database user must be able to apply the supplied migrations to its database. The prototype runs versioned migrations at startup under a PostgreSQL transaction lock; it uses transaction-scoped advisory locks, not session-scoped locks. The application uses parameterized queries without named prepared statements. A transaction-mode pooler is therefore compatible with the implemented query pattern; actual provider connectivity still needs verification after configuration.

Remote connections always use certificate verification. Do not disable TLS or certificate validation to resolve connection errors. For a provider with a private CA, configure a supported Node trust certificate rather than modifying the adapter to accept invalid certificates.

## 2. Configure Render

Create or edit a **Web Service** connected to `void-pronway/BhuMi-Land-Reconciliation`, branch `main`.

| Setting        | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node                                                      |
| Plan           | Free, subject to Render's current availability and limits |
| Root directory | Empty                                                     |
| Build command  | `npm ci --include=dev && npm run build`                   |
| Start command  | `npm run start -- --port $PORT`                           |
| Health check   | `/api/health`                                             |
| Auto-deploy    | Off if you want manual releases                           |
| Disk           | None required                                             |

Set environment variables:

| Variable         | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| `NODE_VERSION`   | `24.19.0`                                                      |
| `NODE_ENV`       | `production`                                                   |
| `DATABASE_URL`   | Private pooled PostgreSQL connection string                    |
| `APP_ORIGIN`     | `https://bhumi.diu.my.id` if that is the actual browser domain |
| `ADMIN_EMAIL`    | Your chosen administrator email address                        |
| `ADMIN_PASSWORD` | A unique strong initial password, 12–128 characters            |
| `SEED_DEMO`      | `true` for the supplied fictional prototype                    |

Do not put credentials into variables beginning with `NEXT_PUBLIC_`. Those are browser-visible. Do not include a trailing slash in `APP_ORIGIN`. If using the Render-provided address, use its exact HTTPS origin instead of the custom domain. Only one reviewer-action origin is supported at a time.

`DATABASE_PATH`, `REVIEWER_PASSWORD` and `SESSION_SECRET` are not needed for this hosted version. The app refuses to silently fall back to an embedded directory when Render is detected without `DATABASE_URL`.

## 3. Deploy and verify

Choose **Manual Deploy → Deploy latest commit**. Startup applies missing migrations, adds missing fictional fixtures, and creates the first administrator if that email does not exist. Existing records are not reset.

1. Confirm `/api/health` returns HTTP 200 with `{"status":"ok"}`.
2. Visit the homepage and try the public guided demo in both languages.
3. Open Reviewer workspace and sign in using the configured administrator email/password.
4. Run DEMO-P4-001, create a review case, and save a note.
5. Restart the Render service. Sign in if needed and verify the run and case remain.
6. Create a reviewer with access to only one parcel. Confirm that account sees only the assigned parcel.
7. Change your initial administrator password in **My account**. Then remove the bootstrap `ADMIN_PASSWORD` from Render's environment if no longer needed; the database hash remains the login authority.

Changing the bootstrap environment password later does not reset the existing account. Password recovery email is not implemented; retain access securely. Before important changes, use the database provider's supported backup/export process and test restoration separately. A free tier's existence is not a backup guarantee.

## Upgrading an existing Render service

Configure the new variables **before redeploying the rebuilt commit**. Add `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the correct `APP_ORIGIN`; change the health check from `/api/workspace` to `/api/health`. The workspace API now correctly returns 401 to anonymous health probes.

Existing shared-password cookies are invalid after the upgrade. Sign in with your individual account. Legacy embedded files in `/tmp/bhumi` or `/var/data/bhumi` are **not automatically imported** into external PostgreSQL. If those contain work you need, preserve them before any redeploy; manual migration of those records is a separate task. A free Render filesystem may already have lost them. No recovery or migration is claimed here.

For a local upgrade with the same embedded directory, migration 002 adds account/access tables and integrity checks while keeping existing parcels, runs, cases and audit rows. Old audit rows have no parcel scope and are visible only to the administrator. New audit entries carry the authenticated actor and parcel scope where applicable.

## Free-tier behavior and troubleshooting

- Render and the database provider may sleep when idle. The UI shows a clear loading/retry state; the public demo does not fetch private workspace records. If Render itself is asleep, its initial HTTP response still needs time to wake up.
- No disk, worker process, cron service, upload bucket or second backend service is required. Uploaded evidence files are not supported; structured source references and notes are used.
- Build errors mentioning Tailwind: retain `--include=dev` in the build command.
- A 503 health/workspace response: inspect Render runtime logs for the safe diagnostic code and check provider connectivity, credentials, quotas and migration permissions. Never publish connection strings or SQL containing private data.
- A 403 invalid-origin response: verify the exact custom domain and HTTPS scheme in `APP_ORIGIN`, save and restart.
- A 401 response: sign in with the new email/password account; check whether access was revoked.
- A 409 response: a stale version or existing record conflicted with the requested change. Refresh and inspect the newer record.
- A 429 response: wait for the rate-limit window. Account login windows are 15 minutes; global login and normal request windows are one minute.

The PostgreSQL adapter is tested against PostgreSQL 17 locally. TLS configuration is unit-tested. No connection to your Neon/Supabase project or successful Render deployment is claimed until those are actually configured and checked.

## Public judge account

With `SEED_DEMO=true` and `PUBLIC_DEMO_ACCESS` unset or `true`, startup creates the public reviewer `judge@bhumi.demo` / `BhuMi-Judge-Demo-2026!`. Both credentials and a one-click login appear on the live sign-in page. Redeploy the latest commit to enable this feature; no manual database query is required.

This account can change shared fictional reviews and snapshots, cannot manage accounts, and cannot change its password. Keep administrator credentials private. Set `PUBLIC_DEMO_ACCESS=false` and restart to reject public judge logins and existing demo sessions before private use. Never put real records into demo parcel IDs. Normal throttling still applies; the shared demo account permits up to 100 active sessions (individual accounts remain limited to five).
