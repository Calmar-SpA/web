import { NextRequest, NextResponse } from 'next/server'
import { calculateBlueExpressPrice, exceedsBlueExpressLimits } from '@/lib/blue-express'

/**
 * POST /api/shipping/blue-express/quote
 * Get shipping quote for Blue Express
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { region, weightKg, dimensions } = body

    if (!region || !weightKg) {
      return NextResponse.json(
        { error: 'Region and weightKg are required' },
        { status: 400 }
      )
    }

    if (!dimensions || !dimensions.height || !dimensions.width || !dimensions.length) {
      return NextResponse.json(
        { error: 'Dimensions (height, width, length) are required' },
        { status: 400 }
      )
    }

    if (exceedsBlueExpressLimits({ weightKg, dimensions })) {
      return NextResponse.json(
        {
          error:
            'El pedido supera 20 kg o 70x70x70 cm. Por favor, divide la compra en pedidos separados.',
        },
        { status: 400 }
      )
    }

    const result = calculateBlueExpressPrice({
      region,
      weightKg,
      dimensions: {
        height: dimensions.height,
        width: dimensions.width,
        length: dimensions.length,
      },
    })

    if (!result) {
      return NextResponse.json(
        { error: 'No se pudo calcular el envío con los datos entregados' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      price: result.price,
      size: result.size,
      zone: result.zone,
      estimatedDays: '3-5 días hábiles',
    })
  } catch (error: any) {
    console.error('Blue Express quote error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cotizar envío' },
      { status: 500 }
    )
  }
}
