import { z } from "zod";
import { fraction } from "./fraction";
export const shareSchema = z
  .string()
  .max(82)
  .refine((v) => {
    try {
      return fraction(v).compare(fraction("0")) >= 0;
    } catch {
      return false;
    }
  }, "Use a nonnegative fraction, e.g. 1/3");
const id = z.string().min(1).max(100);
const date = z.iso.date();
export const holdingSchema = z.object({ party: id, share: shareSchema });
export const documentSchema = z.object({
  id,
  reference: id,
  type: z.string(),
  date,
  status: z.enum(["SUPPLIED", "REVIEWED", "UNVERIFIED"]),
  notes: z.string(),
});
export const eventSchema = z.object({
  id,
  type: z.enum([
    "SALE",
    "GIFT",
    "SUCCESSION_ALLOCATION",
    "PARTITION",
    "CORRECTION",
  ]),
  effectiveDate: date,
  recordedAt: date,
  sequence: z.number().int().positive(),
  documentId: id,
  dependencies: z.array(id),
  allocations: z
    .array(
      z.object({
        from: id,
        to: id,
        share: shareSchema,
        statedArea: shareSchema.optional(),
      }),
    )
    .min(1),
  notes: z.string(),
});
export const snapshotSchema = z.object({
  id,
  reference: id,
  effectiveDate: date,
  documentId: id,
  eventIds: z.array(id),
  holdings: z.array(holdingSchema).min(1),
});
export const parcelSchema = z.object({
  id,
  title: z.string(),
  district: z.string(),
  upazila: z.string(),
  mouza: z.string(),
  khatian: z.string(),
  dag: z.string(),
  survey: z.string(),
  area: shareSchema,
  baselineDate: date,
  baselineDocument: id,
  baseline: z.array(holdingSchema),
  identityConfirmed: z.boolean(),
  parties: z.record(id, z.string()),
  documents: z.array(documentSchema),
  events: z.array(eventSchema),
  snapshots: z.array(snapshotSchema),
});
export type Parcel = z.infer<typeof parcelSchema>;
export type OwnershipEvent = z.infer<typeof eventSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Holding = z.infer<typeof holdingSchema>;
export type State = Record<string, string>;
export type Finding = {
  code: string;
  party?: string;
  expected?: string;
  actual?: string;
  difference?: string;
  eventIds: string[];
  documentIds: string[];
  explanation: string;
  recommendation: string;
  severity: "ATTENTION" | "HIGH";
};
export type Result = {
  status: "MATCH" | "CONFLICT" | "INSUFFICIENT_EVIDENCE" | "REVIEW_REQUIRED";
  rulesVersion: string;
  expected: State;
  observed: State;
  baseline: State;
  expectedTotal: string;
  observedTotal: string;
  findings: Finding[];
  evidenceStatus: "COMPLETE_SUPPLIED" | "INCOMPLETE" | "UNVERIFIED";
  timeline: { event: OwnershipEvent; before: State; after: State }[];
  input: Parcel;
  snapshotId: string | null;
};
