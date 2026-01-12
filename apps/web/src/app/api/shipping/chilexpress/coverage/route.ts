import { NextRequest, NextResponse } from 'next/server'
import { chilexpress } from '@/lib/chilexpress'

/**
 * GET /api/shipping/chilexpress/coverage?regionCode=R9
 * Get all coverage areas for a region (comuna codes)
 * Use regionCode=99 to get all coverages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionCode = searchParams.get('regionCode') || '99'
    
    const response = await chilexpress.getCoverageAreas(regionCode, 1)
    
    return NextResponse.json({
      coverageAreas: response.coverageAreas,
    })
  } catch (error: any) {
    console.error('Chilexpress coverage error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener coberturas' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/chilexpress/coverage
 * Find coverage code for a specific comuna name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comuna } = body

    if (!comuna) {
      return NextResponse.json(
        { error: 'Comuna is required' },
        { status: 400 }
      )
    }

    const coverageCode = await chilexpress.findCoverageCode(comuna)
    
    if (!coverageCode) {
      return NextResponse.json(
        { error: `No coverage found for comuna: ${comuna}`, coverageCode: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ coverageCode })
  } catch (error: any) {
    console.error('Chilexpress coverage error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al buscar cobertura' },
      { status: 500 }
    )
  }
}
