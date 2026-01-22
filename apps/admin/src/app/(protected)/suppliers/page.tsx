import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { createSupplier } from './actions'
import { SupplierCard } from './supplier-card'
import { SupplierForm } from './supplier-form'

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
          <SupplierForm action={createSupplier} submitLabel="Guardar proveedor" />
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
