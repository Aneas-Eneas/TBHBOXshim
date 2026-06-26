import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const script = join(root, "scripts", "extract_tbh_game_data.py");
const args = [script, ...process.argv.slice(2)];

const candidates = [
  process.env.TBH_PYTHON,
  join(process.env.USERPROFILE ?? "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
  "python",
  "py",
].filter(Boolean);

let lastError = "";
for (const command of candidates) {
  const commandText = String(command);
  if (commandText.includes("\\") && !existsSync(commandText)) {
    continue;
  }

  const commandArgs = commandText === "py" ? ["-3", ...args] : args;
  const result = spawnSync(commandText, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });

  if (result.status === 0) {
    process.exit(0);
  }

  lastError = result.error?.message ?? `exit code ${result.status}`;
}

console.error("Could not run the TBH game data extractor.");
console.error(lastError);
console.error("Set TBH_PYTHON to a Python executable with UnityPy available, or install UnityPy into .unitypy_vendor.");
process.exit(1);
