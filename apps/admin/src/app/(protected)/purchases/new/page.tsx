import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { createPurchase } from '../actions'
import { PurchaseForm } from '../purchase-form'

export default async function NewPurchasePage() {
  const supabase = await createClient()
  const { data: categories = [] } = await supabase
    .from('purchase_categories')
    .select('id, name, color, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href="/purchases" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a compras
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Nueva compra</h1>
        <p className="text-slate-700 font-medium">
          Registra gastos y compras internas. Si eliges Material Publicitario podrás asociar entregas a clientes.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Detalle de la compra</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm categories={categories ?? []} action={createPurchase} submitLabel="Registrar compra" />
        </CardContent>
      </Card>
    </div>
  )
}
