import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import Link from 'next/link'
import { createStockEntry } from '../actions'
import { CostInput } from './cost-input'

const today = () => new Date().toISOString().slice(0, 10)

export default async function AddInventoryEntryPage() {
  const supabase = await createClient()

  const [{ data: products = [] }, { data: variants = [] }, { data: suppliers = [] }] = await Promise.all([
    supabase.from('products').select('id, name, sku').order('name', { ascending: true }),
    supabase.from('product_variants').select('id, product_id, name, sku').order('name', { ascending: true }),
    supabase.from('suppliers').select('id, name, is_active').eq('is_active', true).order('name', { ascending: true })
  ])

  const productMap = new Map(products.map((product: any) => [product.id, product.name]))

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Link href="/inventory" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors">
        Volver a inventario
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Nuevo ingreso</h1>
        <p className="text-slate-700 font-medium">
          Registra entrada de stock con proveedor, costo y caducidad.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Detalle del ingreso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStockEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Producto *</label>
              <select
                name="product_id"
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Selecciona un producto</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Variante (opcional)</label>
              <select
                name="variant_id"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Sin variante</option>
                {variants.map((variant: any) => (
                  <option key={variant.id} value={variant.id}>
                    {productMap.get(variant.product_id) || 'Producto'} · {variant.name || variant.sku}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cantidad *</label>
              <Input name="quantity" type="number" min="1" required />
            </div>
            <CostInput name="unit_cost" label="Costo unitario Neto (CLP)" required />

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proveedor *</label>
              <select
                name="supplier_id"
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Selecciona un proveedor</option>
                {suppliers.map((supplier: any) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-xs text-slate-500">
                  No hay proveedores activos. Crea uno en la sección Proveedores.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de ingreso *</label>
              <Input name="entry_date" type="date" defaultValue={today()} required />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de caducidad</label>
              <Input name="expiration_date" type="date" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Número de factura</label>
              <Input name="invoice_number" placeholder="Ej: 12345-A" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input name="is_invoiced" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Facturado
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input name="is_paid" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Pagado
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Puedes registrar la factura y el pago más tarde si aún no se han realizado.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de facturación</label>
              <Input name="invoiced_at" type="date" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de pago</label>
              <Input name="paid_at" type="date" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
              <textarea
                name="notes"
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
                Registrar ingreso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
