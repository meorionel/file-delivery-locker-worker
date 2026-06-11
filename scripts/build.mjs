import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
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

// Compile the Room Durable Object class so worker-entry.mjs can import it.
// The worker-entry.mjs imports ../.open-next/server-functions/default/src/server/room-do.mjs.
// OpenNext Cloudflare bundles server functions into worker.js, so we need to
// produce the .mjs file separately for wrangler to resolve during deploy bundling.
const esbuild = path.join(root, "node_modules", ".bin", isWindows ? "esbuild.cmd" : "esbuild");
const roomDoSource = path.join(root, "src", "server", "room-do.ts");
const roomDoOutput = path.join(root, ".open-next", "server-functions", "default", "src", "server", "room-do.mjs");

if (existsSync(roomDoSource)) {
	mkdirSync(path.dirname(roomDoOutput), { recursive: true });
	execFileSync(esbuild, [
		roomDoSource,
		"--format=esm",
		"--target=es2022",
		`--outfile=${roomDoOutput}`,
		"--bundle",
	], {
		cwd: root,
		env: process.env,
		stdio: "inherit",
	});
	console.log(`Compiled ${path.relative(root, roomDoSource)} -> ${path.relative(root, roomDoOutput)}`);
}
