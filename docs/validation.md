# Measured validation

Executed on 19 October 2026 in the development cloud environment with Node 24, Next.js 16, system Chromium and a separate native PostgreSQL 17.11 server. All records were synthetic.

| Check                                            | Observed result                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Vitest                                           | 31 passed, 0 failed, 0 skipped                                                                      |
| Seeded scenario expectations                     | 11/11 passed                                                                                        |
| Planted nonmatching/evidence scenarios           | 8/8 classified as expected with expected rule codes                                                 |
| Clean scenarios incorrectly flagged              | 0 of 3                                                                                              |
| Exact arithmetic                                 | 1,000 rational transfer-conservation iterations inside one unit test                                |
| Signature discrepancy                            | B −15, D +15; both total 120, asserted exactly                                                      |
| Browser journeys, embedded PostgreSQL            | 8 passed, 0 failed                                                                                  |
| Same browser journeys, native PostgreSQL adapter | 8 passed, 0 failed                                                                                  |
| Restart persistence, both adapters               | Saved run, input packet and audit survive restart; seed stays idempotent                            |
| TypeScript, ESLint, production build             | Passed                                                                                              |
| Remote TLS options                               | Certificate verification and pool bounds asserted in unit tests; no live provider connection tested |

Browser coverage includes:

1. Public Bangla/English guided demo, theme persistence and mobile overflow, with private APIs blocked.
2. Authenticated detection, review, corrected snapshot, MATCH, retained original evidence and translated printable report.
3. Anonymous protection, origin checks, bounded pagination, invalid/unknown fields, fraction/date validation and oversized request rejection.
4. Individual parcel grants, forbidden access to another parcel/report, administrator-only account operations and session revocation.
5. Concurrent snapshot submissions and stale review versions rejected without overwriting history.
6. Localized service-failure messages and retry behavior.
7. Login throttling without exposing whether an account exists.
8. Password changes invalidate previous sessions and reject the old password.

Screenshots in `docs/screenshots` are captured from the running rebuilt application. The existing local embedded database was migrated without deleting its 11 parcels. Native PostgreSQL suites each used a separate disposable database. A restart test initially ran against the browser suite's already-corrected fixture and expected its initial CONFLICT; rerunning on a fresh database verified the intended persistence assertion. This was test isolation, not a lost saved record.

To reproduce, follow the README verification section. Use a **fresh disposable database per suite** for `TEST_DATABASE_URL`; browser journeys intentionally modify snapshots and accounts. Never point these tests at a deployed database.

Not measured: national-scale accuracy/performance, legal correctness, production penetration testing, multiple application instances, government integration, hosted provider connectivity, real-data migration, production backup restoration or GitHub Actions execution. Local passes do not establish a successful Render deployment or remote CI run. Bangla interface copy still needs domain-expert review before institutional use.

## Public judge access update

The public-account update passed all 31 unit tests, ESLint, production build and all nine embedded-database browser journeys. The added journey exercises the visible Bangla one-click judge login, fixture grants, successful reconciliation, forbidden account administration and forbidden public-password changes. The same added journey also passed against a fresh native PostgreSQL database. The eight earlier native-adapter journeys were verified for the preceding rebuild, as recorded above.
