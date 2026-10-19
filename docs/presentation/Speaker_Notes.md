# BhuMi — five-minute speaker notes

## Slide 1

20 seconds. Introduce BhuMi and the P4 category. We compare the ownership that a documented transaction supports with the mutation that follows. This is a synthetic prototype supporting human review, not an official government service. The wordmark is a temporary original treatment; replace it with the official team logo if supplied.

## Slide 2

35 seconds. Explain the separation between transaction records and subsequent ownership updates. The World Bank diagnostic provides institutional context for linking registration and land-record updates; it does not validate our prototype. Our specific demonstration is entirely fictional. The key question is not only whether the total area is correct, but whether each person retains the interest supported by the transaction.

## Slide 3

30 seconds. Lead with the distinction: this is an ownership reconciliation system, not a generic fraud-score dashboard. Exact arithmetic and event replay provide an independent expected state. Findings explain who differs, by how much and according to which records. Reviewers make decisions; BhuMi does not approve mutations or declare legal ownership.

## Slide 4

35 seconds. Start from a sourced baseline and apply documented events in effective-date and explicit sequence order. Check that no sender transfers more than their recorded interest. Compare the reconstructed state to a separate mutation snapshot. Missing evidence or conflicting order stops a confident match. Corrections create new snapshots and runs; old calculations remain available.

## Slide 5

60 seconds. Open DEMO-P4-011 in the running application for this 100-decimal example. The prompt also includes DEMO-P4-001, a separate 120-decimal example with a 15-decimal discrepancy; do not mix them. In this slide, Rahim transfers 25, so expected interests are 35, 40 and 25. The mutation reports 35, 30 and 35. Both totals equal 100, but Karim is short 10 and Nabila has an unsupported extra 10. Run the actual engine and point to the owner differences and source references. A revised snapshot with shares A=7/20, B=2/5 and D=1/4 should match while the prior conflicting run remains.

## Slide 6

30 seconds. Summarize implemented features, not planned integrations. The nine rule categories cover exact accounting, mutation linkage and chain consistency. Explain that a revised snapshot generates a new run. Resolving a case changes workflow status, not the original calculation. Show a report or review queue during a live demo if time allows.

## Slide 7

25 seconds. The exact engine is isolated from UI and database code. PGlite runs real PostgreSQL in-process with durable storage; this is not a hosted Supabase integration. State only measured results: 27 unit tests, 3 browser tests, 11 scenario expectations, and a restart-persistence check passed. The production build, lint and TypeScript checks passed. These results are synthetic validation, not proof of national-scale accuracy. Remote deployment status has not been verified.

## Slide 8

35 seconds. Frame benefits as potential, not measured savings or adopted policy. The next step is domain-expert review and an authorized institutional pilot, not unauthorized government access. A broader rollout needs institutional identity, hosted PostgreSQL, data protection and approved interfaces. Do not claim current government partnerships, national scalability or integrations. We aim to complement existing e-mutation services.

## Slide 9

30 seconds. Replace all placeholders with confirmed team and mentor details before submission. Invite the judges to inspect the repository and try the synthetic demo. Disclose ChatGPT GPT-6 and OpenAI Codex assistance; the team must understand, review and demonstrate the work. Close by asking for feedback on reconciliation rules and authorized pilot requirements. Total suggested speaking time across the nine slides is five minutes. Prepare for a separate three-minute Q&A.
