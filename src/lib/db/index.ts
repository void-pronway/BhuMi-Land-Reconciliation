import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { scenarios } from "../domain/reconciliation/scenarios";
import {
  parcelSchema,
  type Parcel,
  type Result,
} from "../domain/reconciliation/types";
import { reconcileMutation } from "../domain/reconciliation/engine";
export type Run = {
  id: string;
  parcel_id: string;
  result: Result;
  created_at: string;
};
export type Review = {
  id: string;
  run_id: string;
  status: string;
  note: string;
  updated_at: string;
};
export type Audit = {
  id: string;
  actor: string;
  action: string;
  entity_id: string;
  reason: string;
  created_at: string;
  previous_value: unknown;
  new_value: unknown;
};
const globalDb = globalThis as unknown as {
  bhumiDb?: Promise<ReturnType<typeof drizzle>>;
};
export async function database() {
  if (!globalDb.bhumiDb)
    globalDb.bhumiDb = (async () => {
      const path = resolve(process.env.DATABASE_PATH ?? ".data/bhumi");
      await mkdir(path, { recursive: true });
      const client = new PGlite(path);
      await client.exec(
        await readFile(resolve("migrations/001_initial.sql"), "utf8"),
      );
      const db = drizzle(client);
      for (const p of scenarios())
        await db.transaction(async (tx) => {
          const exists = await tx.execute(
            sql`select id from parcels where id=${p.id}`,
          );
          if (exists.rows.length) return;
          const {
            parties,
            documents,
            baseline,
            events,
            snapshots,
            ...metadata
          } = p;
          await tx.execute(
            sql`insert into parcels values(${p.id},${JSON.stringify(metadata)}::jsonb)`,
          );
          for (const [id, name] of Object.entries(parties))
            await tx.execute(
              sql`insert into parties values(${p.id},${id},${name})`,
            );
          for (const d of documents)
            await tx.execute(
              sql`insert into documents values(${p.id},${d.id},${JSON.stringify(d)}::jsonb)`,
            );
          for (const h of baseline)
            await tx.execute(
              sql`insert into baselines values(${p.id},${h.party},${h.share})`,
            );
          for (const e of events) {
            const { allocations, ...data } = e;
            await tx.execute(
              sql`insert into events values(${p.id},${e.id},${JSON.stringify(data)}::jsonb)`,
            );
            for (const [i, a] of allocations.entries())
              await tx.execute(
                sql`insert into allocations values(${p.id},${e.id},${i},${JSON.stringify(a)}::jsonb)`,
              );
          }
          for (const s of snapshots) {
            const { holdings, ...data } = s;
            await tx.execute(
              sql`insert into snapshots(parcel_id,id,data) values(${p.id},${s.id},${JSON.stringify(data)}::jsonb)`,
            );
            for (const h of holdings)
              await tx.execute(
                sql`insert into holdings values(${p.id},${s.id},${h.party},${h.share})`,
              );
          }
        });
      return db;
    })();
  return globalDb.bhumiDb;
}
export async function loadParcels(): Promise<Parcel[]> {
  const db = await database();
  const records = await db.execute(sql`select * from parcels order by id`);
  const output: Parcel[] = [];
  for (const row of records.rows) {
    const id = String(row.id);
    const query = async (table: string) =>
      (
        await db.execute(
          sql`select * from ${sql.identifier(table)} where parcel_id=${id}`,
        )
      ).rows;
    const [
      parties,
      documents,
      baseline,
      events,
      allocations,
      snapshots,
      holdings,
    ] = await Promise.all(
      [
        "parties",
        "documents",
        "baselines",
        "events",
        "allocations",
        "snapshots",
        "holdings",
      ].map(query),
    );
    output.push(
      parcelSchema.parse({
        ...(row.metadata as object),
        parties: Object.fromEntries(parties.map((p) => [p.id, p.name])),
        documents: documents.map((d) => d.data),
        baseline: baseline.map((h) => ({ party: h.party, share: h.share })),
        events: events.map((e) => ({
          ...(e.data as object),
          allocations: allocations
            .filter((a) => a.event_id === e.id)
            .sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
            .map((a) => a.data),
        })),
        snapshots: snapshots
          .sort(
            (a, b) =>
              new Date(String(a.created_at)).getTime() -
              new Date(String(b.created_at)).getTime(),
          )
          .map((s) => ({
            ...(s.data as object),
            holdings: holdings
              .filter((h) => h.snapshot_id === s.id)
              .map((h) => ({ party: h.party, share: h.share })),
          })),
      }),
    );
  }
  return output;
}
export async function workspace() {
  const db = await database();
  return {
    parcels: await loadParcels(),
    runs: (await db.execute(sql`select * from runs order by created_at desc`))
      .rows as unknown as Run[],
    reviews: (
      await db.execute(sql`select * from review_cases order by updated_at desc`)
    ).rows as unknown as Review[],
    audit: (
      await db.execute(sql`select * from audit_log order by created_at desc`)
    ).rows as unknown as Audit[],
  };
}
export async function runReconciliation(parcelId: string, snapshotId?: string) {
  const p = (await loadParcels()).find((p) => p.id === parcelId);
  if (!p) throw new Error("Parcel not found");
  const result = reconcileMutation(p, snapshotId),
    id = crypto.randomUUID();
  const db = await database();
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`insert into runs(id,parcel_id,result) values(${id},${p.id},${JSON.stringify(result)}::jsonb)`,
    );
    for (const finding of result.findings)
      await tx.execute(
        sql`insert into discrepancies values(${crypto.randomUUID()},${id},${JSON.stringify(finding)}::jsonb)`,
      );
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},'Simulated reviewer','RECONCILE',${id},${JSON.stringify({ status: result.status })}::jsonb,'Evaluated supplied records')`,
    );
  });
  return id;
}
export async function createReview(runId: string, note: string) {
  const db = await database();
  await db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`select result from runs where id=${runId}`,
    );
    if (!rows.rows.length || !(rows.rows[0].result as Result).findings.length)
      throw new Error("A run with findings is required");
    const id = crypto.randomUUID();
    const inserted = await tx.execute(
      sql`insert into review_cases(id,run_id,status,note) values(${id},${runId},'NEW',${note}) on conflict(run_id) do nothing returning id`,
    );
    if (inserted.rows.length)
      await tx.execute(
        sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},'Simulated reviewer','OPEN_REVIEW',${id},'{"status":"NEW"}'::jsonb,${note})`,
      );
  });
}
export async function updateReview(id: string, status: string, note: string) {
  const db = await database();
  await db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`select * from review_cases where id=${id} for update`,
    );
    if (!rows.rows.length) throw new Error("Review not found");
    const prior = rows.rows[0];
    const allowed: Record<string, string[]> = {
      NEW: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["NEEDS_EVIDENCE", "RESOLVED", "ESCALATED"],
      NEEDS_EVIDENCE: ["UNDER_REVIEW", "ESCALATED"],
      ESCALATED: ["UNDER_REVIEW"],
      RESOLVED: ["UNDER_REVIEW"],
    };
    if (!allowed[String(prior.status)]?.includes(status))
      throw new Error("Invalid review transition");
    await tx.execute(
      sql`update review_cases set status=${status},note=${note},updated_at=now() where id=${id}`,
    );
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,previous_value,new_value,reason) values(${crypto.randomUUID()},'Simulated reviewer','REVIEW_ACTION',${id},${JSON.stringify(prior)}::jsonb,${JSON.stringify({ status, note })}::jsonb,${note})`,
    );
  });
}
export async function appendSnapshot(
  parcelId: string,
  holdings: Parcel["baseline"],
  reason: string,
) {
  const db = await database(),
    p = (await loadParcels()).find((p) => p.id === parcelId);
  if (!p) throw new Error("Parcel not found");
  if (
    new Set(holdings.map((h) => h.party)).size !== holdings.length ||
    holdings.some((h) => !p.parties[h.party])
  )
    throw new Error("Duplicate or unknown party");
  const id = crypto.randomUUID(),
    documentId = `DOC-${id}`;
  const doc = {
    id: documentId,
    reference: `SYN-AMENDMENT-${id.slice(0, 8)}`,
    type: "Reviewer-supplied synthetic snapshot",
    date: "2026-04-01",
    status: "SUPPLIED",
    notes: reason,
  };
  const snap = {
    id,
    reference: doc.reference,
    effectiveDate: "2026-04-01",
    documentId,
    eventIds: p.events
      .filter((e) => e.effectiveDate <= "2026-04-01")
      .map((e) => e.id),
  };
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`insert into documents values(${p.id},${doc.id},${JSON.stringify(doc)}::jsonb)`,
    );
    await tx.execute(
      sql`insert into snapshots(parcel_id,id,data) values(${p.id},${id},${JSON.stringify(snap)}::jsonb)`,
    );
    for (const h of holdings)
      await tx.execute(
        sql`insert into holdings values(${p.id},${id},${h.party},${h.share})`,
      );
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},'Simulated reviewer','APPEND_SNAPSHOT',${id},${JSON.stringify({ ...snap, holdings })}::jsonb,${reason})`,
    );
  });
  return id;
}
