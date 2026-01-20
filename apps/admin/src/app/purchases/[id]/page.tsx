import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { createDelivery, deletePurchase, updatePurchase } from '../actions'
import { PurchaseForm } from '../purchase-form'
import { CategoryBadge } from '../category-badge'
import { DeliveryCard } from '../delivery-card'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CL')
}

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: purchase, error }, { data: categories = [] }, { data: prospects = [] }, { data: deliveries = [] }] = await Promise.all([
    supabase
      .from('purchases')
      .select('*, purchase_categories(id, name, color)')
      .eq('id', id)
      .single(),
    supabase.from('purchase_categories').select('id, name, color, is_active').order('name', { ascending: true }),
    supabase.from('prospects').select('id, company_name, contact_name, tax_id').order('company_name', { ascending: true }),
    supabase.from('marketing_deliveries').select('*').eq('purchase_id', id).order('created_at', { ascending: false }),
  ])

  if (error || !purchase) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar la compra. {error?.message}
        </div>
      </div>
    )
  }

  const isMarketing = purchase.purchase_categories?.name === 'Material Publicitario'

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href="/purchases" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a compras
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Detalle de compra</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{formatDate(purchase.purchase_date)}</span>
            {purchase.purchase_categories && (
              <CategoryBadge name={purchase.purchase_categories.name} color={purchase.purchase_categories.color} />
            )}
          </div>
        </div>
        <form action={deletePurchase.bind(null, purchase.id)}>
          <Button className="bg-red-600 hover:bg-red-700 text-white uppercase text-xs tracking-widest font-bold">
            Eliminar compra
          </Button>
        </form>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Editar compra</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            categories={categories ?? []}
            action={updatePurchase.bind(null, purchase.id)}
            submitLabel="Guardar cambios"
            defaultValues={{
              category_id: purchase.category_id,
              description: purchase.description,
              net_amount: Number(purchase.net_amount ?? 0),
              tax_amount: Number(purchase.tax_amount ?? 0),
              invoice_number: purchase.invoice_number,
              purchase_date: purchase.purchase_date,
              payment_status: purchase.payment_status,
              payment_method: purchase.payment_method,
              notes: purchase.notes,
            }}
            showCancel={false}
          />
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Material publicitario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isMarketing && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Esta compra no es de material publicitario. Cambia la categoría si necesitas registrar entregas a clientes.
            </div>
          )}

          {isMarketing && (
            <form action={createDelivery} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="purchase_id" value={purchase.id} />
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente *</label>
                <select
                  name="prospect_id"
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  <option value="">Selecciona un cliente</option>
                  {(prospects ?? []).map((prospect: any) => (
                    <option key={prospect.id} value={prospect.id}>
                      {prospect.company_name || prospect.contact_name || 'Sin nombre'} {prospect.tax_id ? `(${prospect.tax_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Material *</label>
                <input
                  name="item_type"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  placeholder="Ej: Pendón, acrílico, afiche"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cantidad *</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dirección de entrega</label>
                <input
                  name="delivery_address"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  placeholder="Dirección donde se entregará el material"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
                <select
                  name="delivery_status"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="scheduled">Programada</option>
                  <option value="delivered">Entregada</option>
                  <option value="partial">Parcial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha programada</label>
                <input
                  name="scheduled_date"
                  type="date"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de entrega</label>
                <input
                  name="delivered_date"
                  type="date"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
                <textarea
                  name="notes"
                  className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  placeholder="Observaciones de la entrega..."
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-8 h-11 w-full sm:w-auto">
                  Registrar entrega
                </Button>
              </div>
            </form>
          )}

          {isMarketing && deliveries.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Aún no hay entregas registradas para esta compra.
            </div>
          )}

          {isMarketing && deliveries.length > 0 && (
            <div className="space-y-4">
              {deliveries.map((delivery: any) => (
                <DeliveryCard key={delivery.id} delivery={delivery} prospects={prospects ?? []} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
