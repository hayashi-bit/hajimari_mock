import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../../");

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { cwd: root, encoding: "utf-8" });
  } catch {
    return "";
  }
};

const log = git(`log --pretty=format:"%H|%h|%an|%ad|%s" --date=short`)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [hash, short, author, date, ...msg] = l.split("|");
    return { hash, short, author, date, message: msg.join("|") };
  });

const files = git(`ls-tree -r --name-only HEAD`).trim().split("\n").filter(Boolean);
const branch = git(`rev-parse --abbrev-ref HEAD`).trim() || "unknown";

const out = resolve(root, "client/src/git-data.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ log, files, branch }, null, 2), "utf-8");
console.log(`git-data.json: ${log.length} commits, ${files.length} files, branch=${branch}`);
