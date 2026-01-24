export type BlueExpressZone = 'santiago' | 'centro' | 'extremo'
export type BlueExpressSize = 'XS' | 'S' | 'M' | 'L'

const ZONE_SANTIAGO: BlueExpressZone = 'santiago'
const ZONE_CENTRO: BlueExpressZone = 'centro'
const ZONE_EXTREMO: BlueExpressZone = 'extremo'

const REGION_ZONES: Record<BlueExpressZone, string[]> = {
  santiago: [
    'metropolitana',
    'region metropolitana',
    'region metropolitana de santiago',
    'metropolitana de santiago',
  ],
  centro: [
    'atacama',
    'coquimbo',
    'valparaiso',
    'libertador bernardo ohiggins',
    "libertador bernardo o'higgins",
    'ohiggins',
    "o'higgins",
    'maule',
    'nuble',
    'biobio',
    'la araucania',
    'araucania',
    'los rios',
    'los lagos',
  ],
  extremo: [
    'arica y parinacota',
    'tarapaca',
    'antofagasta',
    'aysen',
    'aysen del general carlos ibanez del campo',
    'magallanes',
    'magallanes y de la antartica chilena',
  ],
}

const SIZE_LIMITS: Array<{
  size: BlueExpressSize
  maxWeightKg: number
  maxDimsCm: [number, number, number]
}> = [
  { size: 'XS', maxWeightKg: 0.5, maxDimsCm: [20, 20, 10] },
  { size: 'S', maxWeightKg: 3, maxDimsCm: [30, 20, 20] },
  { size: 'M', maxWeightKg: 6, maxDimsCm: [30, 30, 25] },
  { size: 'L', maxWeightKg: 20, maxDimsCm: [70, 70, 70] },
]

const PRICE_TABLE_ORIGIN_CENTRO: Record<
  BlueExpressSize,
  { centroOrSantiago: number; extremo: number }
> = {
  XS: { centroOrSantiago: 4300, extremo: 5200 },
  S: { centroOrSantiago: 5600, extremo: 9500 },
  M: { centroOrSantiago: 7300, extremo: 14500 },
  L: { centroOrSantiago: 9200, extremo: 17000 },
}

const normalizeRegionName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^region (de )?/, '')

const fitsDimensions = (
  dimensions: { height: number; width: number; length: number },
  maxDims: [number, number, number]
) => {
  const dims = [dimensions.height, dimensions.width, dimensions.length]
    .map((v) => Number(v))
    .sort((a, b) => b - a)
  const limits = [...maxDims].sort((a, b) => b - a)

  return dims.every((value, index) => value <= limits[index])
}

export const exceedsBlueExpressLimits = (params: {
  weightKg: number
  dimensions: { height: number; width: number; length: number }
}) => {
  const weight = Number(params.weightKg)
  const { height, width, length } = params.dimensions
  const maxWeight = SIZE_LIMITS[SIZE_LIMITS.length - 1].maxWeightKg
  const maxDims = SIZE_LIMITS[SIZE_LIMITS.length - 1].maxDimsCm

  const exceedsWeight = weight > maxWeight
  const exceedsDimensions =
    Number(height) > maxDims[0] || Number(width) > maxDims[1] || Number(length) > maxDims[2]

  return exceedsWeight || exceedsDimensions
}

export const getBlueExpressZone = (regionName: string): BlueExpressZone | null => {
  const normalized = normalizeRegionName(regionName)
  const foundZone = (Object.keys(REGION_ZONES) as BlueExpressZone[]).find((zone) =>
    REGION_ZONES[zone].some((region) => normalized.includes(region))
  )

  return foundZone || null
}

export const getBlueExpressSize = (params: {
  weightKg: number
  dimensions: { height: number; width: number; length: number }
}): BlueExpressSize | null => {
  const weight = Number(params.weightKg)
  const dimensions = params.dimensions

  for (const limit of SIZE_LIMITS) {
    const fitsWeight = weight <= limit.maxWeightKg
    const fitsDims = fitsDimensions(dimensions, limit.maxDimsCm)
    if (fitsWeight && fitsDims) {
      return limit.size
    }
  }

  return null
}

export const calculateBlueExpressPrice = (params: {
  region: string
  weightKg: number
  dimensions: { height: number; width: number; length: number }
}) => {
  const zone = getBlueExpressZone(params.region)
  if (!zone) {
    return null
  }

  const size = getBlueExpressSize({
    weightKg: params.weightKg,
    dimensions: params.dimensions,
  })

  if (!size) {
    return null
  }

  const priceRow = PRICE_TABLE_ORIGIN_CENTRO[size]
  const price = zone === ZONE_EXTREMO ? priceRow.extremo : priceRow.centroOrSantiago

  return {
    zone,
    size,
    price,
  }
}
