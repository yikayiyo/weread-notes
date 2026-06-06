import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Load .env then .env.local into process.env.
 * Variables already set in the shell are never overwritten.
 */
export function loadEnv(rootDir) {
  const initial = new Set(Object.keys(process.env));
  const merged = {};

  for (const file of [".env", ".env.local"]) {
    const path = join(rootDir, file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(merged)) {
    if (!initial.has(key)) process.env[key] = value;
  }
}
