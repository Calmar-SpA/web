import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { formatClp, getGrossFromNet } from '@calmar/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import { createSupplierItem, updateSupplier, duplicateSupplierItem, deleteSupplierItem } from '../actions'
import { SuccessToast } from './success-toast'
import { SupplierForm } from '../supplier-form'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CL')
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: supplier, error }, { data: itemsData }] = await Promise.all([
    supabase.from('suppliers').select('*').eq('id', id).single(),
    supabase.from('supplier_items').select('*').eq('supplier_id', id).order('created_at', { ascending: false })
  ])
  const items = itemsData ?? []

  if (error || !supplier) {
    return <div className="p-6 md:p-8">Proveedor no encontrado.</div>
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>
      <Link href="/suppliers" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a proveedores
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">{supplier.name}</h1>
        <p className="text-slate-700 font-medium">
          Detalle del proveedor y productos/servicios asociados.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Editar proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Mostrar edición
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-open:hidden">
                  Editar
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden group-open:inline">
                  Ocultar
                </span>
              </div>
            </summary>
            <div className="pt-6">
              <SupplierForm
                action={updateSupplier.bind(null, supplier.id)}
                submitLabel="Guardar cambios"
                defaultValues={supplier}
                footerNote={`Creado: ${formatDate(supplier.created_at)}`}
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Agregar producto/servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplierItem.bind(null, supplier.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo *</label>
              <select
                name="item_type"
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio costo neto (CLP) *</label>
              <Input name="cost_price" type="number" step="0.01" min="0" required />
              <p className="text-[11px] text-slate-500">Se guarda como neto. El IVA y total se calculan en la vista.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
                Activo
              </label>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
              <textarea
                name="notes"
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Detalles del producto o servicio..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
                Guardar item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Productos y servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Costo neto</th>
                  <th className="py-3 pr-4">IVA</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Creado</th>
                  <th className="py-3 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Aún no hay productos o servicios registrados.
                    </td>
                  </tr>
                ) : (
                  items.map((item: any) => {
                    const net = Number(item.cost_price || 0)
                    const gross = getGrossFromNet(net)
                    const iva = Math.max(0, gross - net)
                    return (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-xs uppercase font-bold tracking-widest text-slate-500">
                          {item.item_type}
                        </td>
                        <td className="py-3 pr-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 pr-4">${formatClp(net)}</td>
                        <td className="py-3 pr-4 text-slate-500">${formatClp(iva)}</td>
                        <td className="py-3 pr-4 font-semibold">${formatClp(gross)}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">{formatDate(item.created_at)}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/suppliers/${supplier.id}/items/${item.id}/edit`}>
                              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-2">
                                Editar
                              </Button>
                            </Link>
                            <form action={duplicateSupplierItem.bind(null, item.id, supplier.id)}>
                              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-2">
                                Copiar
                              </Button>
                            </form>
                            <form action={deleteSupplierItem.bind(null, item.id, supplier.id)}>
                              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-2 text-red-600 hover:text-red-700 hover:border-red-300">
                                Eliminar
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
