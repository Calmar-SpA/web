import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { formatClp, getGrossFromNet } from '@calmar/utils'
import Link from 'next/link'
import { updateSupplierItem } from '../../../../actions'

export default async function EditSupplierItemPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id: supplierId, itemId } = await params
  const supabase = await createClient()

  const [{ data: supplier }, { data: item }] = await Promise.all([
    supabase.from('suppliers').select('id, name').eq('id', supplierId).single(),
    supabase.from('supplier_items').select('*').eq('id', itemId).single()
  ])

  if (!supplier || !item) {
    return <div className="p-6 md:p-8">Item no encontrado.</div>
  }

  const net = Number(item.cost_price || 0)
  const gross = getGrossFromNet(net)
  const iva = Math.max(0, gross - net)

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href={`/suppliers/${supplierId}`} className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a {supplier.name}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Editar item</h1>
        <p className="text-slate-700 font-medium">
          Modifica los datos del producto o servicio.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Detalle del item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSupplierItem.bind(null, itemId, supplierId)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo *</label>
              <select
                name="item_type"
                defaultValue={item.item_type}
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
              <Input name="name" defaultValue={item.name} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio costo neto (CLP) *</label>
              <Input name="cost_price" type="number" step="0.01" min="0" defaultValue={item.cost_price} required />
              <p className="text-[11px] text-slate-500">
                Actual: Neto ${formatClp(net)} · IVA ${formatClp(iva)} · Total ${formatClp(gross)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input name="is_active" type="checkbox" defaultChecked={item.is_active} className="h-4 w-4 rounded border-slate-300" />
                Activo
              </label>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
              <textarea
                name="notes"
                defaultValue={item.notes || ''}
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Detalles del producto o servicio..."
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href={`/suppliers/${supplierId}`}>
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
    </div>
  )
}
