# BhuMi — updated five-minute pitch

## Slide 1

20 seconds. Introduce the team and BhuMi. The rebuilt product combines a bilingual guided explanation with an authenticated reviewer workflow and PostgreSQL backend. It compares the ownership that documented transactions support against the recorded mutation. All demonstration records are fictional.

## Slide 2

25 seconds. Explain the record mismatch without claiming a measured national error rate. A deed records a transfer, the prior history constrains what can be transferred, and the mutation records the resulting allocation. BhuMi tests whether those three accounts agree. A balanced total alone cannot answer that question.

## Slide 3

25 seconds. These are implemented features of the rebuilt version, not future plans. The public walkthrough does not require private workspace data. The reviewer experience adds individual authentication and saved evidence. Interface translations do not rewrite original source-record text. Light and dark preferences persist between visits.

## Slide 4

35 seconds. The TypeScript engine uses exact BigInt fractions. It starts from the baseline and applies sourced events in effective-date and explicit sequence order, checking transfers and evidence. It compares the expected state with a separate mutation snapshot. Missing evidence prevents false certainty. Corrected snapshots create new results, while earlier calculations remain reviewable. MATCH means the supplied records reconcile; it does not establish legal title.

## Slide 5

55 seconds including a short live interaction. Choose the 100-decimal public example or reviewer parcel DEMO-P4-011. Do not mix it with the separate 120-decimal example. After Rahim sells 25, the expected interests are 35, 40 and 25. Mutation instead shows 35, 30 and 35. Both totals equal 100, but Karim is short 10 and Nabila has an unsupported extra 10. Show the exact differences and source references. A corrected snapshot with A=7/20, B=2/5 and D=1/4 should match, while the old conflicting run remains. The shared demo may already contain changes from another visitor; rehearse first or use the deterministic public example.

## Slide 6

30 seconds. Explain what the backend enforces: individual accounts, administrator-only account management, parcel-scoped access, session revocation, origin checks, rate limits and strict input validation. Snapshot and review version checks protect against stale changes. Audit history is useful evidence, not tamper-proof storage against database administrators. Shared judge credentials are deliberately public and do not identify individual judges. These controls are a prototype foundation, not a production security certification.

## Slide 7

25 seconds. Frontend and backend run in one Next.js service, not two deployments. Hosted persistence uses external PostgreSQL with a maximum three-connection application pool and verified remote TLS. Local development can use embedded PGlite. Neon or Supabase are deployment options; do not imply which provider the live site uses without confirming it. Free services have quotas and cold starts. Monitoring is not an availability guarantee, and the live hosting configuration has not been independently verified from this environment.

## Slide 8

25 seconds. As recorded in docs/validation.md: 31 unit tests and nine browser journeys passed on the embedded adapter. The eight core journeys were also checked on native PostgreSQL during the rebuild, and the added judge journey was checked separately against PostgreSQL. Restart persistence was verified on both adapters. The subsequent branding update passed the build, lint and two relevant browser journeys. Do not claim every suite was rerun after every visual edit or that remote CI and production hosting were verified. These tests are synthetic validation, not a national accuracy estimate.

## Slide 9

25 seconds. Distinguish what exists from what remains. Bilingual UX, accounts and hosted PostgreSQL support are implemented. Next steps include domain review, an authorized pilot and operational controls. We have not measured officer time savings or national impact. No government integration, institutional adoption or legal verification is claimed. BhuMi should complement existing e-mutation processes and human decisions.

## Slide 10

35 seconds. Preserve the names and DIU IDs supplied in the uploaded deck. Invite judges to the live URL and repository. The shared account can run checks and save reviews on fictional parcels; its changes are visible to other visitors. It cannot manage users or change its password. Verify the live deployment and rehearse before presenting; this environment could not independently reach the site. If it is unavailable, use the editable numerical example on slide 5. Confirm team roles before submission. No mentor names were supplied, so none are invented. Total speaking time is approximately five minutes, with a separate three-minute Q&A. Student understanding and review of AI-assisted work remain essential.
