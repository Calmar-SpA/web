const cleanPhone = (value?: string | null) =>
  String(value || '').replace(/\D/g, '')

export const normalizePhoneIntl = (value?: string | null) => {
  const digits = cleanPhone(value)
  return digits.length > 0 ? digits : null
}

export const isValidPhoneIntl = (value?: string | null) => {
  const digits = normalizePhoneIntl(value)
  return Boolean(digits && digits.length >= 6 && digits.length <= 15)
}

const groupDigits = (digits: string) => digits.replace(/(\d{3})(?=\d)/g, '$1 ')

export const formatPhoneIntl = (countryCode: string, value?: string | null) => {
  const digits = normalizePhoneIntl(value)
  const code = cleanPhone(countryCode) || '56'
  if (!digits) return ''

  return `+${code} ${groupDigits(digits)}`
}

export const parsePhoneIntl = (value?: string | null) => {
  const raw = String(value || '').trim()
  const match = raw.match(/^\+(\d{1,3})\s*(.*)$/)
  if (match) {
    return {
      countryCode: match[1],
      digits: cleanPhone(match[2]),
    }
  }
  return {
    countryCode: '56',
    digits: cleanPhone(raw),
  }
}

export const normalizePhoneCL = (value?: string | null) => {
  const digits = cleanPhone(value)
  if (!digits) return null

  const withoutCountry = digits.startsWith('56') ? digits.slice(2) : digits
  return withoutCountry.length === 9 ? withoutCountry : null
}

export const formatPhoneCL = (value?: string | null) => {
  const normalized = normalizePhoneCL(value)
  if (!normalized) return ''

  return `+56 ${normalized[0]} ${normalized.slice(1, 5)} ${normalized.slice(5)}`
}

export const isValidPhoneCL = (value?: string | null) =>
  Boolean(normalizePhoneCL(value))
