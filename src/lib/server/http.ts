import { NextResponse } from "next/server";
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.code }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return json({ error: "INVALID_INPUT" }, 400);
  // Never send database errors, SQL, tokens, or input values to the client/log.
  const details = error as {
    code?: unknown;
    cause?: { code?: unknown };
  } | null;
  const code = String(details?.cause?.code ?? details?.code ?? "UNKNOWN");
  console.error(
    "BhuMi operation failed; safe diagnostic code:",
    /^[A-Z0-9_]{2,30}$/.test(code) ? code : "UNKNOWN",
    "Check database connectivity, migrations and environment configuration.",
  );
  return json({ error: "SERVICE_UNAVAILABLE" }, 503);
}
export async function readJson(request: Request, max = 24000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError("INVALID_INPUT", 415);
  if (Number(request.headers.get("content-length")) > max)
    throw new ApiError("TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("INVALID_INPUT");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new ApiError("TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function assertOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN ?? "http://localhost:3000";
  if (request.headers.get("origin") !== expected)
    throw new ApiError("INVALID_ORIGIN", 403);
}
export const pageSchema = z.coerce.number().int().min(0).max(10000);
