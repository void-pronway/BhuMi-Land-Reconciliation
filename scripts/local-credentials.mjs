import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local exists; preserved without changes.");
} else {
  writeFileSync(
    ".env.local",
    `DATABASE_PATH=.data/bhumi\nREVIEWER_PASSWORD=${randomBytes(18).toString("hex")}\nSESSION_SECRET=${randomBytes(32).toString("hex")}\n`,
    { mode: 0o600 },
  );
  console.log(
    "Created private .env.local. Open it locally to retrieve your generated reviewer password. Do not commit or share this file.",
  );
}
