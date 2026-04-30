// ─── Auth Security Utilities ─────────────────────────────────────────────────
// Rate limiting, password validation, input sanitization, and session security

// ─── Rate Limiter ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
}

// In-memory rate limiter (for production, use Redis)
const loginAttempts = new Map<string, RateLimitEntry>();
const registerAttempts = new Map<string, RateLimitEntry>();

const LOGIN_MAX_ATTEMPTS = 10;     // Max 10 login attempts per window
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_BLOCK_MS = 30 * 60 * 1000;  // Block for 30 minutes after max attempts

const REGISTER_MAX_ATTEMPTS = 5;    // Max 5 registrations per IP per window
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if a login attempt should be rate-limited.
 * Returns { allowed: boolean, retryAfterMs?: number }
 */
export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterMs?: number;
  remainingAttempts?: number;
} {
  const entry = loginAttempts.get(identifier);

  // Clean up expired entries periodically
  cleanupExpiredEntries(loginAttempts, LOGIN_WINDOW_MS);

  if (!entry) {
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS - 1 };
  }

  // If blocked, check if block has expired
  if (entry.blocked) {
    const blockElapsed = Date.now() - entry.firstAttempt;
    if (blockElapsed > LOGIN_BLOCK_MS) {
      loginAttempts.delete(identifier);
      return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS - 1 };
    }
    const retryAfterMs = LOGIN_BLOCK_MS - blockElapsed;
    return { allowed: false, retryAfterMs };
  }

  // Check if window has reset
  const windowElapsed = Date.now() - entry.firstAttempt;
  if (windowElapsed > LOGIN_WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS - 1 };
  }

  // Check if max attempts reached
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    entry.blocked = true;
    const retryAfterMs = LOGIN_BLOCK_MS - windowElapsed;
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS - entry.count - 1 };
}

/**
 * Record a login attempt (successful or not)
 */
export function recordLoginAttempt(identifier: string, success: boolean) {
  if (success) {
    // Clear rate limit on successful login
    loginAttempts.delete(identifier);
    return;
  }

  const entry = loginAttempts.get(identifier);
  if (!entry || Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: Date.now(), blocked: false });
  } else {
    entry.count++;
  }
}

/**
 * Check if a registration attempt should be rate-limited.
 */
export function checkRegisterRateLimit(ip: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const entry = registerAttempts.get(ip);

  cleanupExpiredEntries(registerAttempts, REGISTER_WINDOW_MS);

  if (!entry) {
    return { allowed: true };
  }

  const windowElapsed = Date.now() - entry.firstAttempt;
  if (windowElapsed > REGISTER_WINDOW_MS) {
    registerAttempts.delete(ip);
    return { allowed: true };
  }

  if (entry.count >= REGISTER_MAX_ATTEMPTS) {
    const retryAfterMs = REGISTER_WINDOW_MS - windowElapsed;
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true };
}

/**
 * Record a registration attempt
 */
export function recordRegisterAttempt(ip: string) {
  const entry = registerAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAttempt > REGISTER_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, firstAttempt: Date.now(), blocked: false });
  } else {
    entry.count++;
  }
}

// Clean up expired entries to prevent memory leaks
function cleanupExpiredEntries(map: Map<string, RateLimitEntry>, windowMs: number) {
  const now = Date.now();
  for (const [key, entry] of map) {
    if (now - entry.firstAttempt > windowMs * 2) {
      map.delete(key);
    }
  }
}

// ─── Password Validation ────────────────────────────────────────────────────

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
  score: number; // 0-100
}

/**
 * Validate password strength beyond just length.
 * Returns validation result with strength assessment.
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // Length checks
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  } else if (password.length >= 8) {
    score += 20;
  } else {
    score += 10;
  }

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  if (hasLowercase) score += 15;
  if (hasUppercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecial) score += 15;

  // Recommend but don't require variety
  if (!hasUppercase && !hasSpecial) {
    // Only suggest if password is short
    if (password.length < 10) {
      errors.push("Consider adding uppercase letters or special characters for a stronger password");
    }
  }

  // Common password check
  const commonPasswords = [
    "password", "123456", "12345678", "qwerty", "abc123",
    "monkey", "1234567", "letmein", "trustno1", "dragon",
    "baseball", "iloveyou", "master", "sunshine", "ashley",
    "bailey", "passw0rd", "shadow", "123123", "654321",
    "superman", "qazwsx", "michael", "football", "password1",
    "password123", "batman", "admin", "welcome", "hello",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.min(score, 15);
    errors.push("This password is too common. Please choose a more unique password");
  }

  // Sequential characters
  const sequentialMatch = password.match(/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i);
  if (sequentialMatch) {
    score -= 10;
  }

  // Repeated characters
  const repeatedMatch = password.match(/(.)\1{2,}/);
  if (repeatedMatch) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let strength: PasswordValidation["strength"];
  if (score < 30) strength = "weak";
  else if (score < 55) strength = "fair";
  else if (score < 80) strength = "good";
  else strength = "strong";

  // Password is valid if it meets the minimum length requirement
  // (we only block on length, not on strength)
  const valid = password.length >= 6;

  return { valid, errors, strength, score };
}

// ─── Input Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize user input to prevent XSS and injection attacks.
 * Removes HTML tags, trims whitespace, and limits length.
 */
export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .replace(/<[^>]*>/g, "")           // Remove HTML tags
    .replace(/&/g, "&amp;")            // Escape ampersands
    .replace(/</g, "&lt;")             // Escape less-than
    .replace(/>/g, "&gt;")             // Escape greater-than
    .replace(/"/g, "&quot;")           // Escape quotes
    .replace(/'/g, "&#x27;")           // Escape single quotes
    .slice(0, maxLength);              // Limit length
}

/**
 * Sanitize email input (less aggressive — emails need @ and .)
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";

  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, "")   // Only allow valid email characters
    .slice(0, 254);                     // RFC 5321 max email length
}

// ─── Client IP Extraction ───────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 * Works with various proxy configurations.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback — in development this will be ::1 or 127.0.0.1
  return "unknown";
}

/**
 * Get rate limit identifier for login (email + IP combination)
 */
export function getLoginIdentifier(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

/**
 * Format retry time for user-friendly display
 */
export function formatRetryTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}
