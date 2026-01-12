import { NextRequest, NextResponse } from 'next/server'
import { chilexpress } from '@/lib/chilexpress'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comuna, comunaCode, weightKg, declaredValue } = body

    if ((!comuna && !comunaCode) || !weightKg) {
      return NextResponse.json(
        { error: 'Comuna (or comunaCode) and weight are required' },
        { status: 400 }
      )
    }

    // Use comunaCode directly if provided, otherwise look it up
    let coverageCode = comunaCode
    if (!coverageCode && comuna) {
      coverageCode = await chilexpress.findCoverageCode(comuna)
    }
    
    if (!coverageCode) {
      return NextResponse.json(
        { error: `No se encontró cobertura para: ${comuna || comunaCode}` },
        { status: 400 }
      )
    }

    // Get shipping options
    const options = await chilexpress.getShippingOptions(
      coverageCode,
      weightKg,
      declaredValue || 10000, // Default declared value
    )

    // Map to a simpler format for the frontend
    const shippingOptions = options.map((opt) => ({
      code: opt.serviceTypeCode,
      name: opt.serviceDescription,
      price: opt.serviceValue,
      finalWeight: opt.finalWeight,
    }))

    return NextResponse.json({
      coverageCode,
      options: shippingOptions,
    })
  } catch (error: any) {
    console.error('Chilexpress quote error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cotizar envío' },
      { status: 500 }
    )
  }
}

