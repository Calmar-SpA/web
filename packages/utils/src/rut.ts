const cleanRut = (rut?: string | null) => {
  return String(rut || '')
    .toUpperCase()
    .replace(/[^0-9K]/g, '')
}

export const normalizeRut = (rut?: string | null) => {
  const cleaned = cleanRut(rut)
  return cleaned.length > 0 ? cleaned : null
}

export const formatRut = (rut?: string | null) => {
  const cleaned = cleanRut(rut)

  if (!cleaned) return ''
  if (cleaned.length === 1) return cleaned

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  const bodyFormatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${bodyFormatted}-${dv}`
}

export const isValidRut = (rut?: string | null) => {
  const cleaned = cleanRut(rut)
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  if (!/^\d+$/.test(body)) return false

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const mod = 11 - (sum % 11)
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod)

  return dv === expected
}
