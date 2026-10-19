# Security model and remaining limits

## Separation of public and private data

The public homepage and guided example use bundled fictional fixtures and the pure reconciliation engine. They do not query the workspace database. `/api/workspace`, `/api/accounts` and printable reports require a server-side session; anonymous requests cannot retrieve saved evidence, review notes or audit data. Private API responses set `Cache-Control: private, no-store` and vary by cookie.

Administrators can access all parcels. Reviewers can access only IDs in `parcel_access`. This check applies to parcel detail, saved runs, reports, new calculations, snapshot appends and review actions. Lists are filtered in SQL. This is a single-organization role/grant model, not a multi-tenant institutional IAM system.

## Accounts and sessions

Passwords are salted with 16 random bytes and hashed using Node's scrypt with a 64-byte output. Hashes never appear in account-list responses. Login uses a dummy hash check for nonexistent users and a generic credential error. Session cookies hold a 256-bit random token; only its SHA-256 digest is stored in PostgreSQL. Cookies are HttpOnly, SameSite=Strict and Secure for a configured HTTPS origin. Sessions expire after eight hours; at most five per account are retained.

Sign-out deletes the server session. Account disable and password change delete all sessions; every authenticated request also checks whether the account is disabled. Bootstrap variables create the first administrator once and do not reset an existing hash. Email recovery, password expiry and MFA are not implemented. Administrators remain trusted to assign access.

## Request and database boundaries

- Zod strict objects reject unexpected action fields and invalid types.
- JSON is streamed with byte limits before parsing: normal mutations 24 KB, credentials 2 KB, account actions 12 KB.
- Every browser mutation requires an exact configured Origin in addition to authentication. GET handlers do not perform user-authorized writes, apart from internal initialization/rate-limit maintenance.
- Fraction validation rejects negative values, invalid notation and zero denominators. Snapshot writes additionally reject individual shares above one, duplicate/unknown parties and dates before the supplied chain. Bangla digits are normalized by the UI; the server still independently validates canonical input.
- Aggregate observed totals are allowed to disagree, so the engine can report real record mismatches. Do not confuse validation of an observation's shape with forcing it to reconcile.
- Parameterized Drizzle queries, unique keys, foreign keys and fraction/status check constraints enforce database consistency. Migration failures roll back; old records are not silently deleted to satisfy constraints.
- Case updates lock the row and compare its version. Snapshot appends lock the parcel and compare the most recent snapshot ID. A stale writer receives 409.
- Historical events, snapshots, run results and audit rows have no modification/deletion endpoint. Database administrators can still alter them; no tamper-proof guarantee is made.

## Resource bounds

The hosted pool uses at most three connections, a ten-second connection timeout and fifteen-second statement timeout. Listings return six parcels or ten runs/cases/audit/account rows per page. Selected parcel reconstruction queries are bounded; the write path caps snapshots at 100 per parcel. Reports return at most the latest 100 case audit actions. These limits suit the prototype; larger archives need a dedicated export workflow.

Rate limits are stored in PostgreSQL and shared across application processes: 60 login attempts per minute globally, 8 per account per 15 minutes, 120 workspace reads/minute per user, 30 mutations/minute per user, 10 account actions/minute per administrator, and 5 password-change attempts per 15 minutes. Global throttling limits password-hashing abuse without trusting spoofable client IP headers. It can also delay legitimate sign-ins during abuse; production deployments need additional edge protection.

## Transport, deployment and logging

Remote PostgreSQL connections verify TLS certificates. Loopback PostgreSQL is supported without TLS for isolated local testing. Cookies use the explicitly configured application origin rather than trusting an arbitrary forwarded host. The app adds frame, content-type, referrer, permissions and basic CSP restrictions. The CSP is intentionally limited; it does not claim full nonce-based script isolation.

Runtime API errors expose machine-readable codes, not SQL or credentials. Logs emit a sanitized diagnostic code and general guidance. Credentials belong in Render/provider settings, never in source control or `NEXT_PUBLIC_*` variables. Browser forms do not persist passwords in local storage. Theme/language preference cookies contain only display preferences.

## Before any real sensitive data

No real land records are required for this prototype. A validated fraction or source reference does not establish document authenticity, legal title or lawful entitlement. There is no malware-scanned document upload pipeline. A real deployment requires an approved data-handling basis, reviewed retention/redaction policies, institutional access controls, backup and recovery testing, domain/legal review, and an independent security assessment. Free hosting and passing automated tests do not establish those requirements.

## Deliberately public competition access

The seeded judge account has published credentials and reviewer access only to the 11 named fictional parcels. It is not an identity assertion: any visitor can use it, and its audit entries identify the shared demo account, not an individual judge. Its notes and changes are shared. Account administration and password changes are forbidden for this account. Private accounts and admin credentials are never published.

Disable with `PUBLIC_DEMO_ACCESS=false` or `SEED_DEMO=false` and restart; both fresh logins and existing demo sessions are rejected. Do not store private information in demo records, notes or fixture IDs. Individual account authentication, grants and throttling continue to apply.
