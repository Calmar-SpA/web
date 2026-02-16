import { createClient } from '@/lib/supabase/server'
import { Button } from '@calmar/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { SuccessToast } from './success-toast'
import { InventoryTabs } from './inventory-tabs'
import { SyncStockButton } from './sync-stock-button'

export default async function InventoryPage() {
  const supabase = await createClient()

  // 1. Fetch Stock Entries (Existing)
  const { data: entriesData, error: entriesError } = await supabase
    .from('stock_entries')
    .select('*, products(name, sku), suppliers(name)')
    .order('created_at', { ascending: false })
  
  const entries = entriesData ?? []
  const errorMessage = entriesError?.message || null
  const isMissingTable = entriesError?.code === '42P01'

  // 2. Fetch Current Stock (New)
  const { data: stockData } = await supabase
    .from('inventory')
    .select(`
      product_id,
      quantity,
      product:products (
        id,
        name,
        sku,
        image_url,
        unit_product_id,
        units_per_pack
      )
    `)
    .order('quantity', { ascending: true })

  // Filter out items where product might be null (if deleted)
  const stock = (stockData || []).filter(item => item.product)

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Inventario</h1>
          <p className="text-slate-700 font-medium">
            Gestión de stock, historial de ingresos y movimientos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncStockButton />
          <Link href="/inventory/add">
            <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
              + Nuevo ingreso
            </Button>
          </Link>
        </div>
      </div>

      <InventoryTabs 
        entries={entries} 
        stock={stock} 
        errorMessage={errorMessage}
        isMissingTable={isMissingTable}
      />
    </div>
  )
}
