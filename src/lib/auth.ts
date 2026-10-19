import { DEMO_ACCOUNT, demoAccessEnabled } from "./demo-account";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { database } from "./db";
import { ApiError } from "./server/http";
import { hashPassword, verifyPassword } from "./server/password";
const dummyPasswordHash = hashPassword("non-account-placeholder");
export type User = {
  id: string;
  email: string;
  display_name: string;
  role: "ADMIN" | "REVIEWER";
};
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("bhumi_session")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await database();
  const rows = await db.execute(
    sql`select u.id,u.email,u.display_name,u.role from sessions s join app_users u on u.id=s.user_id where s.token_hash=${digest(token)} and s.expires_at>now() and not u.disabled`,
  );
  const user = (rows.rows[0] as unknown as User) ?? null;
  if (user?.id === DEMO_ACCOUNT.id && !demoAccessEnabled()) return null;
  return user;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError("UNAUTHORIZED", 401);
  return user;
}
export async function limit(key: string, max: number, seconds: number) {
  const db = await database();
  const hashed = digest(key);
  const rows = await db.execute(
    sql`insert into rate_limits(key,hits,expires_at) values(${hashed},1,now()+${seconds}*interval '1 second') on conflict(key) do update set hits=case when rate_limits.expires_at<=now() then 1 else rate_limits.hits+1 end,expires_at=case when rate_limits.expires_at<=now() then now()+${seconds}*interval '1 second' else rate_limits.expires_at end returning hits`,
  );
  if (Number(rows.rows[0].hits) > max) throw new ApiError("RATE_LIMIT", 429);
  await db.execute(
    sql`delete from rate_limits where expires_at<now()-interval '1 day'`,
  );
}
export async function login(email: string, password: string) {
  if (email === DEMO_ACCOUNT.email && !demoAccessEnabled())
    throw new ApiError("INVALID_CREDENTIALS", 401);
  await limit("login-global", 60, 60);
  await limit(`login:${email}`, 8, 900);
  const db = await database();
  const rows = await db.execute(
    sql`select * from app_users where email=${email} and not disabled`,
  );
  const found = rows.rows[0];
  // Perform the same expensive hash for unknown accounts to reduce enumeration.
  const stored = found ? String(found.password_hash) : await dummyPasswordHash;
  const valid = await verifyPassword(password, stored);
  if (!found || !valid) throw new ApiError("INVALID_CREDENTIALS", 401);
  const token = randomBytes(32).toString("hex");
  await db.transaction(async (tx) => {
    await tx.execute(sql`delete from sessions where expires_at<=now()`);
    await tx.execute(
      sql`insert into sessions(token_hash,user_id,expires_at) values(${digest(token)},${String(found.id)},now()+interval '8 hours')`,
    );
    await tx.execute(
      sql`delete from sessions where token_hash in (select token_hash from sessions where user_id=${String(found.id)} order by created_at desc offset ${String(found.id) === DEMO_ACCOUNT.id ? 100 : 5})`,
    );
  });
  return token;
}
export async function logout() {
  const token = (await cookies()).get("bhumi_session")?.value;
  if (token) {
    const db = await database();
    await db.execute(
      sql`delete from sessions where token_hash=${digest(token)}`,
    );
  }
}
export async function createAccount(
  admin: User,
  email: string,
  name: string,
  password: string,
  parcelIds: string[],
) {
  if (admin.role !== "ADMIN" || email === DEMO_ACCOUNT.email)
    throw new ApiError("FORBIDDEN", 403);
  const db = await database(),
    id = crypto.randomUUID(),
    hash = await hashPassword(password);
  await db.transaction(async (tx) => {
    if (
      (await tx.execute(sql`select id from app_users where email=${email}`))
        .rows.length
    )
      throw new ApiError("ACCOUNT_EXISTS", 409);
    for (const pid of parcelIds)
      if (
        !(await tx.execute(sql`select id from parcels where id=${pid}`)).rows
          .length
      )
        throw new ApiError("INVALID_PARTY");
    await tx.execute(
      sql`insert into app_users(id,email,display_name,password_hash,role) values(${id},${email},${name},${hash},'REVIEWER')`,
    );
    for (const pid of new Set(parcelIds))
      await tx.execute(sql`insert into parcel_access values(${id},${pid})`);
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},${admin.email},'CREATE_ACCOUNT',${id},${JSON.stringify({ email, parcelIds })}::jsonb,'Reviewer access granted by administrator')`,
    );
  });
  return id;
}
export async function disableAccount(admin: User, id: string) {
  if (admin.role !== "ADMIN" || admin.id === id)
    throw new ApiError("FORBIDDEN", 403);
  const db = await database();
  await db.transaction(async (tx) => {
    const result = await tx.execute(
      sql`update app_users set disabled=true where id=${id} and role='REVIEWER' returning id`,
    );
    if (!result.rows.length) throw new ApiError("NOT_FOUND", 404);
    await tx.execute(sql`delete from sessions where user_id=${id}`);
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},${admin.email},'DISABLE_ACCOUNT',${id},'{"disabled":true}'::jsonb,'Access revoked by administrator')`,
    );
  });
}

export async function changePassword(
  user: User,
  current: string,
  next: string,
) {
  if (user.id === DEMO_ACCOUNT.id) throw new ApiError("DEMO_PASSWORD", 403);
  await limit(`password:${user.id}`, 5, 900);
  const db = await database();
  await db.transaction(async (tx) => {
    const row = (
      await tx.execute(
        sql`select password_hash from app_users where id=${user.id} and not disabled for update`,
      )
    ).rows[0];
    if (!row || !(await verifyPassword(current, String(row.password_hash))))
      throw new ApiError("INVALID_CREDENTIALS", 401);
    const hash = await hashPassword(next);
    await tx.execute(
      sql`update app_users set password_hash=${hash} where id=${user.id}`,
    );
    await tx.execute(sql`delete from sessions where user_id=${user.id}`);
    await tx.execute(
      sql`insert into audit_log(id,actor,action,entity_id,new_value,reason) values(${crypto.randomUUID()},${user.email},'PASSWORD_CHANGED',${user.id},'{}'::jsonb,'Account password changed; sessions revoked')`,
    );
  });
}
