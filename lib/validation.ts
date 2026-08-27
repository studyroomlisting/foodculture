/**
 * lib/validation.ts — shared field-level validators.
 *
 * Added because an audit found the same three field types (person/business
 * name, phone number, email) repeated across ~10 forms (auth, onboarding,
 * account, listing, enquiry, connect) with wildly inconsistent rigor — some
 * forms only checked "non-empty", most never rejected digits/symbols in a
 * name field, and phone numbers were accepted as pure freetext everywhere.
 * One shared set of validators means every form now enforces the same rule
 * and any future form gets it for free.
 *
 * Each `*Error` function returns a user-facing message string, or null when
 * the value is valid — so callers do `const err = nameError(x); if (err) {...}`.
 */

// Unicode-aware: letters (any script) plus spaces, hyphens, apostrophes and
// periods (for initials like "A. R. Rahman"). Deliberately does NOT allow
// digits or other symbols — that's the whole point of this check.
const NAME_CHARS_RE = /^[\p{L}][\p{L}\s'.-]*$/u

export function nameError(value: string, label = 'Name'): string | null {
  const v = (value ?? '').trim()
  if (!v) return `${label} is required.`
  if (v.length < 2) return `${label} must be at least 2 characters.`
  if (v.length > 60) return `${label} must be under 60 characters.`
  if (!NAME_CHARS_RE.test(v)) return `${label} can only contain letters, spaces, hyphens and apostrophes — no numbers or symbols.`
  return null
}

// Indian mobile numbers: 10 digits, first digit 6-9. Accepts an optional
// +91 / 91 prefix and spaces/hyphens the user may have typed, but the
// underlying number itself must be a real 10-digit Indian mobile number.
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/

export function phoneError(value: string, opts: { required?: boolean; label?: string } = {}): string | null {
  const label = opts.label ?? 'Phone number'
  const v = (value ?? '').trim()
  if (!v) return opts.required ? `${label} is required.` : null
  const digits = v.replace(/[\s-]/g, '').replace(/^\+?91/, '')
  if (!INDIAN_MOBILE_RE.test(digits)) return `Enter a valid 10-digit Indian mobile number.`
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailError(value: string, opts: { required?: boolean } = { required: true }): string | null {
  const v = (value ?? '').trim()
  if (!v) return opts.required === false ? null : 'Email is required.'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return null
}

// Business/restaurant names legitimately contain digits and symbols
// ("7 Spice Kitchen", "M&M Grill", "24/7 Diner") — so this is deliberately
// looser than nameError(): it just rejects names that are pure digits/
// symbols with no letters at all, which is never a real business name.
const HAS_LETTER_RE = /\p{L}/u

export function businessNameError(value: string, label = 'Name'): string | null {
  const v = (value ?? '').trim()
  if (!v) return `${label} is required.`
  if (v.length < 2) return `${label} must be at least 2 characters.`
  if (v.length > 100) return `${label} must be under 100 characters.`
  if (!HAS_LETTER_RE.test(v)) return `${label} must contain at least one letter.`
  return null
}

const INSTAGRAM_HANDLE_RE = /^[a-zA-Z0-9._]{1,30}$/

export function instagramHandleError(value: string, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim().replace(/^@/, '')
  if (!v) return opts.required ? 'Instagram handle is required — restaurants find you by this.' : null
  if (!INSTAGRAM_HANDLE_RE.test(v)) return 'Enter a valid Instagram handle — letters, numbers, periods and underscores only, no spaces or @ symbols.'
  return null
}
