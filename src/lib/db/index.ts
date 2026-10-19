import { connection, type Database } from "./connection";
import { hashPassword } from "../server/password";
import { ApiError } from "../server/http";
import type { User } from "../auth";
import { shareSchema } from "../domain/reconciliation/types";
import { fraction } from "../domain/reconciliation/fraction";
import { sql } from "drizzle-orm";
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
  version: number;
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
const state = globalThis as unknown as { bhumiReady?: Promise<Database> };
export async function database() {
  if (!state.bhumiReady)
    state.bhumiReady = (async () => {
      const db = await connection();
      await db.transaction(async (gate) => {
        await gate.execute(sql`select pg_advisory_xact_lock(20461020)`);
        if (process.env.SEED_DEMO !== "false") {
          for (const p of scenarios())
            await gate.transaction(async (tx) => {
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
        }
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
          if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            process.env.ADMIN_PASSWORD.length < 12 ||
            process.env.ADMIN_PASSWORD.length > 128
          )
            throw new Error("Invalid bootstrap account configuration");
          const found = await gate.execute(
            sql`select id from app_users where email=${email}`,
          );
          if (!found.rows.length) {
            const id = crypto.randomUUID(),
              hash = await hashPassword(process.env.ADMIN_PASSWORD);
            await gate.execute(
              sql`insert into app_users(id,email,display_name,password_hash,role) values(${id},${email},'Administrator',${hash},'ADMIN')`,
            );
          }
        }
      });
      return db;
    })().catch((error) => {
      state.bhumiReady = undefined;
      throw error;
    });
  return state.bhumiReady;
}
export async function loadParcels(parcelId?: string): Promise<Parcel[]> {
  const db = await database();
  const records = await db.execute(
    sql`select * from parcels ${parcelId ? sql`where id=${parcelId}` : sql``} order by id limit 12`,
  );
  const output: Parcel[] = [];
  for (const row of records.rows) {
    const id = String(row.id);
    const query = async (table: string) => {
      const { rows } = await db.execute(
        sql`select * from ${sql.identifier(table)} where parcel_id=${id} limit 1001`,
      );
      // Never reconcile a silently truncated ownership history.
      if (rows.length > 1000) throw new ApiError("RECORD_LIMIT", 422);
      return rows;
    };
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
                new Date(String(b.created_at)).getTime() ||
              String(a.id).localeCompare(String(b.id)),
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
export async function canAccess(user: User, parcelId: string) {
  const db = await database();
  const rows = await db.execute(
    sql`select id from parcels where id=${parcelId} and (${user.role === "ADMIN"} or exists(select 1 from parcel_access where parcel_id=${parcelId} and user_id=${user.id}))`,
  );
  if (!rows.rows.length) throw new ApiError("FORBIDDEN", 403);
}
export async function workspace(user: User, offset = 0, parcelId?: string) {
  const db = await database();
  if (parcelId) await canAccess(user, parcelId);
  const access = sql`(${user.role === "ADMIN"} or exists(select 1 from parcel_access a where a.parcel_id=p.id and a.user_id=${user.id}))`;
  const listed = await db.execute(
    sql`select p.id,p.metadata from parcels p where ${access} order by p.id limit 6 offset ${offset}`,
  );
  const total = await db.execute(
    sql`select count(*)::int as count from parcels p where ${access}`,
  );
  return {
    parcels: listed.rows.map((r) => ({ id: r.id, ...(r.metadata as object) })),
    total: Number(total.rows[0].count),
    parcel: parcelId ? (await loadParcels(parcelId))[0] : null,
    runs: parcelId
      ? (
          await db.execute(
            sql`select id,parcel_id,created_at,result->>'status' as status from runs where parcel_id=${parcelId} order by created_at desc,id desc limit 10 offset ${offset}`,
          )
        ).rows
      : [],
    reviews: (
      await db.execute(
        sql`select c.*,r.parcel_id,r.result->>'status' as outcome from review_cases c join runs r on r.id=c.run_id join parcels p on p.id=r.parcel_id where ${access} order by c.updated_at desc,c.id limit 10 offset ${offset}`,
      )
    ).rows,
    audit: (
      await db.execute(
        sql`select id,actor,action,entity_id,reason,created_at from audit_log l where ${user.role === "ADMIN"} or exists(select 1 from parcel_access a where a.parcel_id=l.parcel_id and a.user_id=${user.id}) order by created_at desc,id limit 10 offset ${offset}`,
      )
    ).rows,
  };
}
export async function getRun(user: User, id: string) {
  const db = await database();
  const row = (await db.execute(sql`select * from runs where id=${id}`))
    .rows[0];
  if (!row) throw new ApiError("NOT_FOUND", 404);
  await canAccess(user, String(row.parcel_id));
  return row as unknown as Run;
}
export async function runReconciliation(
  user: User,
  parcelId: string,
  snapshotId?: string,
) {
  await canAccess(user, parcelId);
  const p = (await loadParcels(parcelId))[0];
  if (!p) throw new ApiError("NOT_FOUND");
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
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason,parcel_id) values(${crypto.randomUUID()},${user.email},'RECONCILE',${id},${JSON.stringify({ status: result.status })}::jsonb,'Evaluated supplied records',${p.id})`,
    );
  });
  return id;
}
export async function createReview(user: User, runId: string, note: string) {
  const run = await getRun(user, runId);
  const db = await database();
  await db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`select result from runs where id=${runId}`,
    );
    if (!rows.rows.length || !(rows.rows[0].result as Result).findings.length)
      throw new ApiError("FINDINGS_REQUIRED");
    const id = crypto.randomUUID();
    const inserted = await tx.execute(
      sql`insert into review_cases(id,run_id,status,note) values(${id},${runId},'NEW',${note}) on conflict(run_id) do nothing returning id`,
    );
    if (inserted.rows.length)
      await tx.execute(
        sql`insert into audit_log(id,actor,action,entity_id,new_value,reason,parcel_id) values(${crypto.randomUUID()},${user.email},'OPEN_REVIEW',${id},'{"status":"NEW"}'::jsonb,${note},${run.parcel_id})`,
      );
  });
}
export async function updateReview(
  user: User,
  id: string,
  status: string,
  note: string,
  version: number,
) {
  const db = await database();
  const ref = (
    await db.execute(sql`select run_id from review_cases where id=${id}`)
  ).rows[0];
  if (!ref) throw new ApiError("NOT_FOUND", 404);
  const run = await getRun(user, String(ref.run_id));
  await db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`select * from review_cases where id=${id} for update`,
    );
    if (!rows.rows.length) throw new ApiError("NOT_FOUND");
    const prior = rows.rows[0];
    if (Number(prior.version) !== version)
      throw new ApiError("STALE_REVIEW", 409);
    const allowed: Record<string, string[]> = {
      NEW: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["NEEDS_EVIDENCE", "RESOLVED", "ESCALATED"],
      NEEDS_EVIDENCE: ["UNDER_REVIEW", "ESCALATED"],
      ESCALATED: ["UNDER_REVIEW"],
      RESOLVED: ["UNDER_REVIEW"],
    };
    if (!allowed[String(prior.status)]?.includes(status))
      throw new ApiError("INVALID_TRANSITION");
    await tx.execute(
      sql`update review_cases set status=${status},note=${note},updated_at=now(),version=version+1 where id=${id}`,
    );
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,previous_value,new_value,reason,parcel_id) values(${crypto.randomUUID()},${user.email},'REVIEW_ACTION',${id},${JSON.stringify(prior)}::jsonb,${JSON.stringify({ status, note })}::jsonb,${note},${run.parcel_id})`,
    );
  });
}
export async function appendSnapshot(
  user: User,
  parcelId: string,
  holdings: Parcel["baseline"],
  reason: string,
  effectiveDate: string,
  previousSnapshotId: string | null,
) {
  await canAccess(user, parcelId);
  const db = await database(),
    p = (await loadParcels(parcelId))[0];
  if (!p) throw new ApiError("NOT_FOUND");
  if (
    new Set(holdings.map((h) => h.party)).size !== holdings.length ||
    holdings.some((h) => !p.parties[h.party])
  )
    throw new ApiError("INVALID_PARTY");
  for (const h of holdings)
    h.share = fraction(shareSchema.parse(h.share)).toString();
  if (holdings.some((h) => fraction(h.share).compare(fraction("1")) > 0))
    throw new ApiError("INVALID_SHARE");
  if (
    effectiveDate < p.baselineDate ||
    p.events.some((e) => e.effectiveDate > effectiveDate)
  )
    throw new ApiError("INVALID_DATE");
  const id = crypto.randomUUID(),
    documentId = `DOC-${id}`;
  const doc = {
    id: documentId,
    reference: `SYN-AMENDMENT-${id.slice(0, 8)}`,
    type: "Reviewer-supplied synthetic snapshot",
    date: effectiveDate,
    status: "SUPPLIED",
    notes: reason,
  };
  const snap = {
    id,
    reference: doc.reference,
    effectiveDate,
    documentId,
    eventIds: p.events
      .filter((e) => e.effectiveDate <= effectiveDate)
      .map((e) => e.id),
  };
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from parcels where id=${p.id} for update`);
    const latest = (
      await tx.execute(
        sql`select id from snapshots where parcel_id=${p.id} order by created_at desc,id desc limit 1`,
      )
    ).rows[0];
    if ((latest?.id ?? null) !== previousSnapshotId)
      throw new ApiError("STALE_SNAPSHOT", 409);
    const count = (
      await tx.execute(
        sql`select count(*)::int as count from snapshots where parcel_id=${p.id}`,
      )
    ).rows[0];
    if (Number(count.count) >= 100) throw new ApiError("SNAPSHOT_LIMIT", 409);
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
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason,parcel_id) values(${crypto.randomUUID()},${user.email},'APPEND_SNAPSHOT',${id},${JSON.stringify({ ...snap, holdings })}::jsonb,${reason},${p.id})`,
    );
  });
  return id;
}
