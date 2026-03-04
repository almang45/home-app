/**
 * Thin logger wrapper that gates debug/warn output behind the DEV flag.
 * Use this instead of raw `console.*` calls so no-console ESLint rule is satisfied
 * and debug noise is stripped from production bundles.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.debug('loaded', data)   // only in dev
 *   logger.warn('missing field')   // only in dev
 *   logger.error('fetch failed', err) // always logged (useful for prod error tracking)
 */

const isDev = import.meta.env.DEV

export const logger = {
  // eslint-disable-next-line no-console
  debug: (...args: unknown[]): void => { if (isDev) console.debug(...args) },
  // eslint-disable-next-line no-console
  warn: (...args: unknown[]): void => { if (isDev) console.warn(...args) },
  // eslint-disable-next-line no-console
  error: (...args: unknown[]): void => { console.error(...args) },
}
