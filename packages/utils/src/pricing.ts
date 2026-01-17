const DEFAULT_TAX_RATE = 0.19

const normalizeAmount = (value: number) => (Number.isFinite(value) ? value : 0)

export const getNetFromGross = (gross: number, taxRate = DEFAULT_TAX_RATE) => {
  const normalized = normalizeAmount(gross)
  return Math.round(normalized / (1 + taxRate))
}

export const getIvaFromGross = (gross: number, taxRate = DEFAULT_TAX_RATE) => {
  const normalized = normalizeAmount(gross)
  const net = getNetFromGross(normalized, taxRate)
  return Math.max(0, Math.round(normalized - net))
}

export const getGrossFromNet = (net: number, taxRate = DEFAULT_TAX_RATE) => {
  const normalized = normalizeAmount(net)
  return Math.round(normalized * (1 + taxRate))
}

export const getPriceBreakdown = (gross: number, taxRate = DEFAULT_TAX_RATE) => {
  const normalized = normalizeAmount(gross)
  const net = getNetFromGross(normalized, taxRate)
  const iva = getIvaFromGross(normalized, taxRate)
  return { gross: normalized, net, iva, taxRate }
}

export const formatClp = (value: number) => normalizeAmount(value).toLocaleString('es-CL')
