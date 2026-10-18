import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const secret = () => process.env.SESSION_SECRET;
export function configured() {
  return !!process.env.REVIEWER_PASSWORD && (secret()?.length ?? 0) >= 32;
}
export function passwordMatches(password: string) {
  const expected = process.env.REVIEWER_PASSWORD ?? "";
  const a = Buffer.from(password),
    b = Buffer.from(expected);
  return configured() && a.length === b.length && timingSafeEqual(a, b);
}
export function token() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${createHmac("sha256", secret()!).update(expires).digest("hex")}`;
}
export async function isReviewer() {
  if (!configured()) return false;
  const value = (await cookies()).get("bhumi_session")?.value ?? "";
  const [expires, signature] = value.split(".");
  if (!signature || Number(expires) < Date.now()) return false;
  const expected = createHmac("sha256", secret()!)
    .update(expires)
    .digest("hex");
  const a = Buffer.from(signature),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !!origin && origin === (process.env.APP_ORIGIN ?? "http://localhost:3000")
  );
}
