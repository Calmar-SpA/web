
import { createClient } from '@/lib/supabase/server'
import { B2BService } from '@calmar/database'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('x-api-key')

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
  }

  const supabase = await createClient()
  const b2bService = new B2BService(supabase)
  
  const client = await b2bService.validateApiKey(authHeader)

  if (!client) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 })
  }

  // Fetch all products with inventory
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, base_price, variants(id, name, stock_quantity)')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: b2bPrices, error: b2bPricesError } = await supabase
    .from('b2b_product_prices')
    .select('product_id, fixed_price')
    .eq('b2b_client_id', client.id)

  if (b2bPricesError) {
    return NextResponse.json({ error: b2bPricesError.message }, { status: 500 })
  }

  const priceMap = new Map((b2bPrices || []).map(p => [p.product_id, Number(p.fixed_price)]))

  // Apply fixed B2B prices per product (fallback to base_price)
  const pricedProducts = products.map(p => {
    const fixedPrice = priceMap.get(p.id)
    const b2bPrice = typeof fixedPrice === 'number' && !Number.isNaN(fixedPrice)
      ? fixedPrice
      : p.base_price

    return {
      ...p,
      b2b_price: b2bPrice,
      price_source: fixedPrice ? 'fixed' : 'base'
    }
  })

  return NextResponse.json({
    client: client.company_name,
    pricing: 'fixed_per_product',
    inventory: pricedProducts
  })
}
