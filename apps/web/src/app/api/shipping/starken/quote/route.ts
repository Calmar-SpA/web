import { NextRequest, NextResponse } from 'next/server'
import { starken } from '@/lib/starken'

/**
 * POST /api/shipping/starken/quote
 * Get shipping quotes from Starken
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comuna, cityCode, weightKg, declaredValue } = body

    if ((!comuna && !cityCode) || !weightKg) {
      return NextResponse.json(
        { error: 'Comuna (or cityCode) and weightKg are required' },
        { status: 400 }
      )
    }

    // Use cityCode directly if provided, otherwise look it up
    let destinationCityCode = cityCode
    if (!destinationCityCode && comuna) {
      destinationCityCode = await starken.findCityCodeByComuna(comuna)
    }
    
    if (!destinationCityCode) {
      return NextResponse.json(
        { error: `No se encontró ciudad para: ${comuna || cityCode}` },
        { status: 400 }
      )
    }

    // Get shipping options
    const options = await starken.getShippingOptions(
      destinationCityCode,
      weightKg,
    )

    // Map to frontend format (compatible with existing ShippingOptions component)
    const shippingOptions = options.map((opt) => ({
      code: opt.code,
      name: opt.name,
      price: opt.price,
      finalWeight: String(weightKg),
      estimatedDays: `${opt.estimatedDays} día${opt.estimatedDays > 1 ? 's' : ''} hábil${opt.estimatedDays > 1 ? 'es' : ''}`,
      deliveryType: opt.deliveryType,
      serviceType: opt.serviceType,
    }))

    return NextResponse.json({
      cityCode: destinationCityCode,
      options: shippingOptions,
    })
  } catch (error: any) {
    console.error('Starken quote error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cotizar envío' },
      { status: 500 }
    )
  }
}
