import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const isWindows = process.platform === "win32";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command = process.env.NEXT_PRIVATE_STANDALONE === "true" ? "next" : "opennextjs-cloudflare";
const args = process.env.NEXT_PRIVATE_STANDALONE === "true" ? ["build"] : ["build"];
const bin = path.join(root, "node_modules", ".bin", isWindows ? `${command}.cmd` : command);

execFileSync(bin, args, {
	cwd: root,
	env: process.env,
	stdio: "inherit",
});

// After OpenNext build, ensure the worker-entry.mjs can resolve imports.
// The worker-entry.mjs in scripts/ references ../.open-next/worker.js and
// ../.open-next/server-functions/default/src/server/room-do.mjs.
// During wrangler dev/deploy, these paths are relative to the worker entry's
// location in the scripts/ directory and should resolve correctly since
// wrangler uses the main field's directory as the base for bundling.
