
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

  // Apply B2B discount to prices
  const discountedProducts = products.map(p => ({
    ...p,
    b2b_price: Math.floor(p.base_price * (1 - (client.discount_percentage / 100)))
  }))

  return NextResponse.json({
    client: client.company_name,
    discount: client.discount_percentage + '%',
    inventory: discountedProducts
  })
}
