import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import { createSupplier } from './actions'
import { SupplierCard } from './supplier-card'

export default async function SuppliersPage() {
  const supabase = await createClient()

  const [{ data: suppliersData, error }, { data: itemsData }] = await Promise.all([
    supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
    supabase.from('supplier_items').select('id, supplier_id, item_type, name, cost_price, is_active').order('name', { ascending: true })
  ])
  
  const suppliers = (suppliersData ?? []).map((supplier: any) => ({
    ...supplier,
    items: (itemsData ?? []).filter((item: any) => item.supplier_id === supplier.id)
  }))
  const errorMessage = error?.message || null
  const isMissingTable = error?.code === '42P01'

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Proveedores</h1>
        <p className="text-slate-700 font-medium">
          Gestiona proveedores para ingresos de stock con trazabilidad.
        </p>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Nuevo proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre *</label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contacto</label>
              <Input name="contact_name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
              <Input name="contact_email" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teléfono</label>
              <Input name="contact_phone" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
              <textarea
                name="notes"
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
                placeholder="Observaciones del proveedor..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
                Guardar proveedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">Listado de proveedores</h2>
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {isMissingTable
              ? 'Falta aplicar las migraciones de base de datos para proveedores.'
              : `No se pudieron cargar los proveedores. ${errorMessage}`}
          </div>
        )}
        {suppliers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            Aún no hay proveedores registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier: any) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
