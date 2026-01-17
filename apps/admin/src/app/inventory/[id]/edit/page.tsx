import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { formatClp } from '@calmar/utils'
import Link from 'next/link'
import { updateStockEntry } from '../../actions'
import { CostInput } from '../../add/cost-input'

const formatDateInput = (value?: string | null) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-CL')
}

export default async function EditInventoryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry, error } = await supabase
    .from('stock_entries')
    .select('*, products(name, sku), suppliers(name), product_variants(name, sku)')
    .eq('id', id)
    .single()

  const { data: history = [] } = await supabase
    .from('stock_entry_history')
    .select('*')
    .eq('stock_entry_id', id)
    .order('changed_at', { ascending: false })

  if (error || !entry) {
    return <div className="p-6 md:p-8">Ingreso de inventario no encontrado.</div>
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href="/inventory" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a inventario
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Editar ingreso</h1>
        <p className="text-slate-700 font-medium">
          Actualiza el costo neto y el estado de factura/pago.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Detalle del ingreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Producto</p>
              <p className="text-sm font-semibold text-slate-900">{entry.products?.name || 'Producto'}</p>
              <p className="text-[10px] text-slate-500 font-mono">{entry.products?.sku || ''}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Variante</p>
              <p className="text-sm font-semibold text-slate-900">{entry.product_variants?.name || 'Sin variante'}</p>
              <p className="text-[10px] text-slate-500 font-mono">{entry.product_variants?.sku || ''}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proveedor</p>
              <p className="text-sm font-semibold text-slate-900">{entry.suppliers?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cantidad</p>
              <p className="text-sm font-semibold text-slate-900">{entry.quantity}</p>
            </div>
          </div>

          <form action={updateStockEntry.bind(null, entry.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cantidad *</label>
              <Input name="quantity" type="number" min="1" defaultValue={entry.quantity} required />
            </div>
            <CostInput name="unit_cost" label="Costo unitario Neto (CLP)" required defaultValue={entry.unit_cost} />

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de caducidad</label>
              <Input name="expiration_date" type="date" defaultValue={formatDateInput(entry.expiration_date)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Número de factura</label>
              <Input name="invoice_number" defaultValue={entry.invoice_number || ''} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input name="is_invoiced" type="checkbox" defaultChecked={Boolean(entry.is_invoiced)} className="h-4 w-4 rounded border-slate-300" />
                  Facturado
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input name="is_paid" type="checkbox" defaultChecked={Boolean(entry.is_paid)} className="h-4 w-4 rounded border-slate-300" />
                  Pagado
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Puedes actualizar las fechas si la factura o el pago se realizó después.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de facturación</label>
              <Input name="invoiced_at" type="date" defaultValue={formatDateInput(entry.invoiced_at)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de pago</label>
              <Input name="paid_at" type="date" defaultValue={formatDateInput(entry.paid_at)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
              <textarea
                name="notes"
                defaultValue={entry.notes || ''}
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Observaciones del ingreso..."
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/inventory">
                <Button variant="outline" className="font-bold uppercase text-xs tracking-widest px-8 h-11 w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-8 h-11 w-full sm:w-auto">
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Historial de cambios</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay cambios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-3 pr-4">Fecha</th>
                    <th className="py-3 pr-4">Acción</th>
                    <th className="py-3 pr-4">Cantidad</th>
                    <th className="py-3 pr-4">Delta</th>
                    <th className="py-3 pr-4">Costo neto</th>
                    <th className="py-3 pr-4">Factura</th>
                    <th className="py-3 pr-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {formatDateTime(item.changed_at)}
                      </td>
                      <td className="py-3 pr-4 text-xs uppercase font-bold tracking-widest text-slate-600">
                        {item.action}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-xs text-slate-500">
                          {item.old_quantity ?? '-'} → {item.new_quantity ?? '-'}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {item.delta_quantity ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {item.old_unit_cost !== null
                          ? `$${formatClp(item.old_unit_cost)} → $${formatClp(item.new_unit_cost)}`
                          : `$${formatClp(item.new_unit_cost)}`}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {item.old_invoice_number
                          ? `${item.old_invoice_number} → ${item.new_invoice_number || '-'}`
                          : item.new_invoice_number || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${item.new_is_invoiced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {item.new_is_invoiced ? 'Facturado' : 'Sin facturar'}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${item.new_is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.new_is_paid ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
