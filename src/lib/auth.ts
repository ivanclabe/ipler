// Cuentas creadas con el esquema anterior (usuario → usuario@ipler.local):
// si se escribe solo el nombre, se completa con este dominio.
const LEGACY_DOMAIN = 'ipler.local'

export const DEFAULT_PASSWORD = 'admin123'
export const MIN_PASSWORD_LENGTH = 6

export function toLoginEmail(input: string): string {
  const value = input.trim().toLowerCase()
  return value.includes('@') ? value : `${value}@${LEGACY_DOMAIN}`
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong'

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  if (password.length < MIN_PASSWORD_LENGTH) return 'weak'
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  if (password.length >= 12 && variety >= 3) return 'strong'
  if (password.length >= 8 && variety >= 2) return 'fair'
  return 'weak'
}
