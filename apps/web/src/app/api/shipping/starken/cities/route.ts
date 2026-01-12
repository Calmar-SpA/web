import { NextRequest, NextResponse } from 'next/server'
import { starken } from '@/lib/starken'

/**
 * GET /api/shipping/starken/cities?type=origin|destination
 * Get all cities for origin or destination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'destination'
    
    if (type !== 'origin' && type !== 'destination') {
      return NextResponse.json(
        { error: 'Type must be "origin" or "destination"' },
        { status: 400 }
      )
    }
    
    const cities = type === 'origin' 
      ? await starken.getCitiesOrigin()
      : await starken.getCitiesDestination()
    
    return NextResponse.json({ cities })
  } catch (error: any) {
    console.error('Starken cities error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ciudades' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/starken/cities
 * Find city code by comuna name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comuna, type = 'destination' } = body

    if (!comuna) {
      return NextResponse.json(
        { error: 'Comuna is required' },
        { status: 400 }
      )
    }

    const cityCode = await starken.findCityCodeByComuna(comuna, type)
    
    if (!cityCode) {
      return NextResponse.json(
        { error: `No se encontró ciudad para comuna: ${comuna}`, cityCode: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ cityCode })
  } catch (error: any) {
    console.error('Starken city lookup error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al buscar ciudad' },
      { status: 500 }
    )
  }
}
