import { PGlite } from "@electric-sql/pglite";
import { drizzle as embeddedDrizzle } from "drizzle-orm/pglite";
import { drizzle as postgresDrizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Both Drizzle adapters implement this SQL/transaction interface. No adapter-
// specific operations are used by the repository services.
export type Database = ReturnType<typeof embeddedDrizzle>;
const state = globalThis as unknown as { bhumiConnection?: Promise<Database> };
export function postgresOptions(connection: string) {
  const url = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Invalid database protocol");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: local ? false : { rejectUnauthorized: true },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    application_name: "bhumi",
  };
}
export async function connection(): Promise<Database> {
  if (!state.bhumiConnection) {
    let pool: Pool | undefined;
    state.bhumiConnection = (async () => {
      let db: Database;
      if (process.env.DATABASE_URL) {
        pool = new Pool(postgresOptions(process.env.DATABASE_URL));
        pool.on("error", () =>
          console.error(
            "Database pool connection failed; credentials and queries omitted.",
          ),
        );
        db = postgresDrizzle(pool) as unknown as Database;
      } else {
        if (process.env.RENDER)
          throw new Error("DATABASE_URL is required on Render");
        const path = resolve(
          /* turbopackIgnore: true */ process.env.DATABASE_PATH ??
            ".data/bhumi",
        );
        await mkdir(path, { recursive: true });
        db = embeddedDrizzle(new PGlite(path));
      }
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(20461019)`);
        await tx.execute(
          sql`create table if not exists schema_migrations(version integer primary key)`,
        );
        for (const [version, file] of [
          [1, "001_initial.sql"],
          [2, "002_access.sql"],
        ] as const) {
          const exists = await tx.execute(
            sql`select version from schema_migrations where version=${version}`,
          );
          if (!exists.rows.length) {
            const source = (
              await readFile(resolve("migrations", file), "utf8")
            ).replace(/^--.*$/gm, "");
            for (const statement of source
              .split(";")
              .map((s) => s.trim())
              .filter(Boolean))
              await tx.execute(sql.raw(statement));
            await tx.execute(
              sql`insert into schema_migrations(version) values(${version}) on conflict do nothing`,
            );
          }
        }
      });
      return db;
    })().catch(async (error) => {
      await pool?.end().catch(() => undefined);
      state.bhumiConnection = undefined;
      throw error;
    });
  }
  return state.bhumiConnection;
}
