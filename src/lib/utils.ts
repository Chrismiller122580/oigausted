import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a field that may be stored as a JSON string (e.g. gig.fields, gig.addons).
 * Returns an array, or empty array on failure / missing value.
 */
export function parseJsonArrayField(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
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
export function parseCustomFields(value: any): Record<string, any> {
  if (!value) return {}
  let obj: any = {}
  if (typeof value === 'object' && !Array.isArray(value)) obj = value
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
  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith('__')) clean[k] = v
  }
  return clean
}

/**
 * Dev-only logging. Silences in production to keep Vercel logs clean.
 * Use for success/trace logs; keep console.error for real issues.
 */
export function devLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

