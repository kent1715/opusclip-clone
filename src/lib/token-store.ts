import { readFileSync, writeFileSync, existsSync } from "fs";
import { mkdirSync } from "fs";
import path from "path";

interface ResetTokenData {
  email: string;
  expires: number;
}

// In-memory cache backed by a JSON file so tokens survive server restarts
const TOKEN_FILE = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "reset-tokens.json");

let tokens: Map<string, ResetTokenData>;

/**
 * Load tokens from the JSON file on disk.
 */
function loadTokens(): Map<string, ResetTokenData> {
  try {
    if (existsSync(TOKEN_FILE)) {
      const raw = readFileSync(TOKEN_FILE, "utf-8");
      const obj = JSON.parse(raw) as Record<string, ResetTokenData>;
      return new Map(Object.entries(obj));
    }
  } catch (err) {
    console.error("[token-store] Failed to load tokens from file:", err);
  }
  return new Map();
}

/**
 * Persist the current in-memory tokens to the JSON file.
 */
function saveTokens(): void {
  try {
    const dir = path.dirname(TOKEN_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, ResetTokenData> = {};
    tokens.forEach((value, key) => {
      obj[key] = value;
    });
    writeFileSync(TOKEN_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("[token-store] Failed to save tokens to file:", err);
  }
}

/**
 * Lazily initialise the token store on first use.
 */
function ensureLoaded(): void {
  if (tokens === undefined) {
    tokens = loadTokens();
    // Clean up expired tokens on load
    const now = Date.now();
    let changed = false;
    tokens.forEach((data, key) => {
      if (now > data.expires) {
        tokens.delete(key);
        changed = true;
      }
    });
    if (changed) saveTokens();
  }
}

/**
 * Store a password reset token.
 */
export function setResetToken(token: string, data: ResetTokenData): void {
  ensureLoaded();
  tokens.set(token, data);
  saveTokens();
}

/**
 * Retrieve a password reset token. Returns undefined if not found.
 */
export function getResetToken(token: string): ResetTokenData | undefined {
  ensureLoaded();
  return tokens.get(token);
}

/**
 * Delete a password reset token (e.g. after it has been used).
 */
export function deleteResetToken(token: string): void {
  ensureLoaded();
  tokens.delete(token);
  saveTokens();
}
