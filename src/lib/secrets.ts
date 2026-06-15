/** Sentinel sent by admin UI when a secret field was not edited. */
export const SECRET_UNCHANGED = '__UNCHANGED__'

export function isSecretUnchanged(value: unknown): boolean {
  return value == null || value === '' || value === SECRET_UNCHANGED
}

export function maskSecretConfigured(configured: boolean): string {
  return configured ? SECRET_UNCHANGED : ''
}