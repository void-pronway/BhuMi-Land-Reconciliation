# Demonstration guide

## Ninety-second recording

Use fictional records only. Choose বাংলা or English and a light or dark theme before recording. The public guided example works without an account; saving reviews requires sign-in.

- **0–12s:** Home: “A correct total can hide an incorrect owner allocation.” Open **Try the example** and choose the 120-decimal example.
- **12–28s:** Follow the guided steps through the baseline, sale and recorded mutation.
- **28–42s:** Show expected versus recorded shares: equal 120 totals, B −15 and D +15. Explain why totals alone miss the discrepancy.
- **42–60s:** In a prepared reviewer session, open DEMO-P4-001, run the check and create a review case with an evidence note.
- **60–80s:** Add a snapshot with A 1/4, B 1/3, C 1/6, D 1/4, E 0, an effective date after the events and a reason. Rerun to obtain MATCH.
- **80–90s:** Open the earlier saved report: the original CONFLICT remains. “BhuMi supports human review; it does not determine legal title.”

Rehearse with a separate demonstration database. Keep credentials and connection strings out of the recording. A completed review does not alter the original calculation.

## Five-minute finalist talk

1. Land-record discrepancies and existing e-mutation context (45s).
2. Why aggregate area checks miss co-owner loss (45s).
3. Guided example, authenticated review and correction (120s).
4. Exact arithmetic, access controls and measured tests (45s).
5. Limits and an authorized pilot path (45s).

The [nine-slide deck](presentation/README.md) uses the separate 100-decimal / 10-decimal example, DEMO-P4-011. Choose that example when presenting its live-example slide. Review the deck's older implementation details before submission.

## Prepare for questions

- **Does MATCH prove title?** No. Supplied records reconcile under explicit assumptions.
- **Does this decide inheritance?** No. Allocations and supporting evidence must be supplied.
- **Why fractions?** Thirds and sixths remain exact; rounding cannot change the result.
- **Can a reviewer hide a finding?** Review status does not modify the saved calculation. Database administrators remain trusted; storage is not tamper-proof.
- **Does it connect to government systems?** No. Included records are synthetic.
- **Can it run free?** One free Render web service plus a separate free PostgreSQL provider, subject to their quotas and cold starts. See [deployment](deployment.md).
- **Is it ready for actual land records?** No. Legal review, organizational security controls, operational backups and independent testing are still required.
