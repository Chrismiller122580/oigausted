import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Prisma } from "@prisma/client"
import type { DynamicFieldDef } from "@/types/gig-fields"
import type { JsonObject, JsonValue } from "@/types/json"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isSqliteDatabase(): boolean {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || ''
  return /file:|\.db|sqlite:/.test(dbUrl)
}

/**
 * Convert a string (e.g. businessName) into a URL-friendly slug.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces and -
    .replace(/[\s_-]+/g, '-') // collapse spaces, _, - into single -
    .replace(/^-+|-+$/g, ''); // trim leading/trailing -
}

/**
 * Safely parse a field that may be stored as a JSON string (e.g. gig.fields, gig.addons).
 * Returns an array, or empty array on failure / missing value.
 */
export function asJsonObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonObject
}

export function parseJsonArrayField<T = DynamicFieldDef>(value: unknown): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Safely parse customFields which may be stored as a JSON string on Order.
 * Returns a plain object (Record), or empty object on failure.
 */
export function parseCustomFields(value: unknown): JsonObject {
  if (!value) return {}
  let obj: JsonObject = {}
  if (typeof value === 'object' && !Array.isArray(value)) obj = value as JsonObject
  else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      obj = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  } else {
    return {}
  }
  // Strip internal bypass/debug keys (prefixed with __) from buyer/seller UI
  const clean: JsonObject = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith('__')) clean[k] = v
  }
  return clean
}

/**
 * Dev-only logging. Silences in production to keep Vercel logs clean.
 * Use for success/trace logs; keep console.error for real issues.
 */
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

/**
 * Convert a value (object) to what Prisma should receive for Json? fields.
 * - Under local SQLite dev (detected via DATABASE_URL containing file:/.db/sqlite), stringify
 *   because the with-local-sqlite.sh patches the schema + regenerates client treating these as String?
 * - In real Postgres (prod or direct pg dev), pass the native object so it stores as structured JSON.
 * This lets us use Json? in committed schema while keeping "npm run dev" working against sqlite.
 */
export function toPrismaJson(value: unknown): string | Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  if (isSqliteDatabase()) return JSON.stringify(value);
  return value as Prisma.InputJsonValue;
}

/** Assign to Prisma Json? (Postgres) or String? (sqlite dev shim) fields. */
export function toPrismaJsonField(
  value: unknown
): Prisma.AuditLogUncheckedCreateInput['details'] {
  return toPrismaJson(value) as Prisma.AuditLogUncheckedCreateInput['details'];
}

/**
 * Safely parse deliveryLog (or similar Json/String fields) that may be stored
 * as a JSON string (sqlite-dev shim) or native object (Postgres).
 * TODO (compat-cleanup): After full Postgres migration, consider removing
 * stringification path for deliveryLog/data if no longer needed for local dev.
 */
export function parseDeliveryLog(val: unknown): JsonObject {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as JsonObject) : {};
}

