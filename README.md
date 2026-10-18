![BhuMi — Records. Reconciled.](public/wordmark.svg)

# BhuMi · Land Ownership Reconciliation Engine

**LandTech Innovation Hackathon 2026 · P4 — Smart e-Mutation & Registry**

A registered deed and the mutation that follows can tell different ownership stories. BhuMi reconstructs documented ownership interests using exact fractions, compares each party with the supplied mutation, and gives a simulated reviewer source-linked findings. **Correct total area does not necessarily mean correct ownership allocation.**

This is an independent, synthetic-data prototype, not a government service or a legal-title verification system. Undivided share equivalents do not establish physical boundaries.

## What works

- BigInt rational arithmetic, deterministic event replay and exact owner-by-owner comparison.
- Sales, gifts, explicit succession allocations, same-parcel partitions and documented reallocating corrections. No automatic inheritance-law decisions.
- Nine discrepancy categories, separate evidence completeness, four reconciliation outcomes.
- Eleven seeded scenarios, including the 120-decimal signature case and concept note’s 100-decimal example.
- Searchable parcel explorer, baseline distribution, expandable event history and source evidence.
- Persistent reconciliation runs, revised mutation snapshots, review cases and audit history.
- Password-protected simulated reviewer actions; read-only public demonstration.
- Printable source-linked reports; responsive desktop/mobile interface.

Planned, **not implemented**: hosted PostgreSQL adapter, institution-managed identities, bilingual UX, document/event ingestion editor, cross-parcel partition and legal-rule templates, official integrations. OCR, blockchain and AI ownership decisions are intentionally outside the prototype.

## Architecture

```text
Next.js / React workspace
   → Zod-validated, authorized route handlers
   → pure TypeScript reconciliation engine
   → Drizzle parameterized SQL + embedded PostgreSQL (PGlite)
   → historical runs, review cases, audit entries and printable reports
```

The baseline, ownership events and observed mutation snapshots remain separate. A mutation never becomes an ownership event. Runs capture their complete input and result; a revised snapshot creates a new calculation without changing earlier findings. Review decisions never rewrite ownership inputs.

See [architecture and rules](docs/architecture.md) and [demo guide](docs/demo.md).

## Prerequisites and local setup

Node.js **24 LTS** and npm. Dependencies are pinned by `package-lock.json`. PGlite runs real PostgreSQL in-process through WebAssembly: there is no external database account or daemon to configure.

```bash
npm ci
node scripts/local-credentials.mjs
npm run db:migrate
npm run db:seed
npm run dev
```

Open the application on local port **3000**. The setup helper creates an ignored `.env.local` with random credentials, preserving an existing file. Open that file locally to retrieve `REVIEWER_PASSWORD`, then use **Reviewer sign in**. Never commit or share the credential file. `SESSION_SECRET` must have at least 32 characters. Without these settings the application stays read-only.

`APP_ORIGIN` defaults to `http://localhost:3000`; set it to the exact browser origin if using another port or host. Mutating requests require this origin and an authenticated session. Use HTTPS for remotely accessed instances.

Database files live in `.data/bhumi` unless `DATABASE_PATH` is set. Migrations and seeding are idempotent and preserve existing records. The first API request also initializes a fresh database. Stop the application before running migration/seed commands against its database; **only one process may own a PGlite data directory**. Never run a second server on the same directory.

```bash
npm run build
npm run start
```

Do not deploy this local persistence adapter to ephemeral/serverless storage. A hosted deployment needs an explicit PostgreSQL connection adapter and migration process; merely setting a Supabase URL is insufficient. No hosted deployment or government integration has been performed.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:restart
```

If Chromium is already installed, skip its download and use:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts a production server on port 3001, creates isolated database files under `.data/e2e-*`, and uses ephemeral test credentials. Build first. The tests never reset your demo database. Generated traces and screenshots are ignored.

[Measured validation results](docs/validation.md) distinguish executed checks from limitations. Tests prove behavior on synthetic inputs, not effectiveness on real national records.

## Signature demonstration

1. Sign in and open **DEMO-P4-001**.
2. Inspect A = 1/2, B = 1/3, C = 1/6 of the 120-decimal parcel.
3. Expand `SALE-001`: A transfers 1/4 (30 decimals equivalent) to D.
4. Run reconciliation. Expected: A 30, B 40, C 20, D 30. Mutation: A 30, B 25, C 20, D 45.
5. Both totals equal 120. B’s −15 and D’s +15 are calculated, not hardcoded alerts.
6. Create a review case; open the review queue, begin review and request evidence with a note.
7. Return to the parcel. Append a revised snapshot with A `1/4`, B `1/3`, C `1/6`, D `1/4`, E `0` and an evidence note.
8. Run again: the new run matches. Select the earlier historical run to inspect the unchanged discrepancy and its review trail.
9. Open the printable evidence report; browser print supports PDF output.

An original temporary wordmark is included. The official logo was not supplied. Actual application screenshots: [dashboard](docs/screenshots/dashboard.png), [reconciliation](docs/screenshots/reconciliation.png), and [mobile](docs/screenshots/mobile-dashboard.png).

![BhuMi reviewer dashboard](docs/screenshots/dashboard.png)

## Security and privacy

Only fictional records are seeded. No genuine NIDs, private records, portal scraping, speculative government APIs or external accounts are used. Server-side reviewer checks, strict-origin checks, signed HttpOnly session cookies, parameterized queries, input validation and database transactions protect the prototype workflow. Login throttling is process-local and intentionally simple.

This is a single-instance demo with one shared reviewer identity, not production IAM. Public reads include synthetic evidence and audit information; real personal data would require per-record authorization and redaction. Database administrators can alter stored data: append-only application behavior is not a tamper-proof guarantee. Do not expose real data or claim legal certification.

## Sources and project ownership

Inspected: the supplied **BhuMi Concept Note** and **Master Development Prompt**. Not supplied: official rulebook, strategy report, competitor concept note, official logo. Compliance claims from those missing sources have not been independently checked. Original implementation; no competitor code, layout or branding copied.

Institutional context (not proof of legal completeness):

- [Bangladesh State Acquisition and Tenancy Act, 1950, section 89](https://bdlaws.minlaw.gov.bd/act-241/section-7068.html).
- [World Bank, Bangladesh Land Acquisition Diagnostic Review (2022)](https://documents1.worldbank.org/curated/en/099359509012228968/pdf/IDU05ea6dbd70b70e04c7f0b5ef06fbc25ad4670.pdf).
- The supplied concept note additionally cites Daily Sun (18 August 2025), Bangladesh Post (4 October 2024), and BSS (24 November 2025). Their claims were not independently reverified during implementation.

**AI assistance disclosure:** OpenAI ChatGPT (GPT-6) and Codex assisted with architecture, implementation, tests and documentation. Student developers must review, understand and demonstrate the submitted work. Ownership outcomes are deterministic rules, not AI judgments.

Team lead: [Name, DIU ID] · Student developer: [Name, DIU ID] · Faculty mentor: [Name, Department] · Industry mentor: [Name, Organisation].

Dependencies include Next.js, React, TypeScript, Tailwind CSS, Lucide, Zod, Drizzle ORM, PGlite, Vitest, Playwright and Prettier; their respective upstream licenses apply. No project license has been selected on the team’s behalf.

## Changelog

- Initial working prototype: exact engine, eleven synthetic fixtures, persistent reviewer workflow, report, automated tests and demo documentation.
- Post–Round 1 improvements: to be recorded by the team after submission; none claimed yet.
