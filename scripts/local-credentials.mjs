import { randomBytes } from "node:crypto";
import {
  existsSync,
  readFileSync,
  appendFileSync,
  writeFileSync,
} from "node:fs";
const path = ".env.local";
if (!existsSync(path))
  writeFileSync(
    path,
    "DATABASE_PATH=.data/bhumi\nAPP_ORIGIN=http://localhost:3000\n",
    { mode: 0o600 },
  );
const content = readFileSync(path, "utf8");
if (!/^ADMIN_EMAIL=/m.test(content))
  appendFileSync(path, "\nADMIN_EMAIL=admin@bhumi.local\n");
if (!/^ADMIN_PASSWORD=/m.test(content))
  appendFileSync(path, `ADMIN_PASSWORD=${randomBytes(24).toString("hex")}\n`);
console.log(
  "Private local configuration prepared. Read ADMIN_EMAIL and ADMIN_PASSWORD in .env.local locally. Existing settings preserved; never share this file. Bootstrap settings create an account once, not reset its password.",
);
