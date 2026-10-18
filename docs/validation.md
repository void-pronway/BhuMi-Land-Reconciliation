# Measured validation

Executed in the development cloud environment with Node 24, Next.js 16 and system Chromium. These results apply only to the included synthetic records.

| Check                                  | Observed result                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Vitest                                 | 27 passed, 0 failed, 0 skipped                                                             |
| Seeded scenario expectations           | 11/11 passed                                                                               |
| Planted nonmatching/evidence scenarios | 8/8 classified as expected, with expected rule codes asserted                              |
| Clean scenarios incorrectly flagged    | 0 of 3                                                                                     |
| Exact arithmetic                       | 1,000 rational transfer-conservation iterations passed inside one unit test                |
| Signature discrepancy                  | B −15, D +15; both total 120, asserted exactly                                             |
| Duplicate processing                   | Repeated event stopped; duplicate snapshot transaction reference flagged                   |
| Missing evidence                       | Missing baseline/provenance, dependency, identity and ambiguous holdings prevent MATCH     |
| Playwright                             | 3 passed, 0 failed: full acceptance journey, authorization/input boundaries, mobile layout |
| Restart persistence                    | Saved run/input packet and audit entries survived stop/start; no reseeding duplicates      |
| TypeScript                             | Passed                                                                                     |
| ESLint                                 | Passed                                                                                     |
| Production build                       | Passed                                                                                     |

The end-to-end journey signs in, runs the engine, inspects source-event replay, opens a case, records review and evidence-request actions, adds a corrected snapshot, obtains MATCH and verifies the prior CONFLICT and audit entries remain unchanged. It also opens the printable historical report. No browser page errors were observed during that journey. Desktop and mobile screenshots were captured from the actual running application.

Initial browser checks exposed a request-origin mismatch and were corrected with an explicit APP_ORIGIN setting. The results above are from the subsequent passing run. The bundled Chromium download was blocked by network policy; tests used the already installed system Chromium without bypassing TLS or integrity verification.

Not measured: national-scale accuracy/performance, legal correctness, multi-instance concurrency, production security, live government integration, hosted PostgreSQL migration or GitHub Actions execution. CI configuration is included; local passes do not establish that a remote CI run has completed.
