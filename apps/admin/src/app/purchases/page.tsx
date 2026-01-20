import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { formatClp } from '@calmar/utils'
import { CategoryBadge } from './category-badge'

type SearchParams = {
  category?: string
  status?: string
}

export default async function PurchasesPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await createClient()
  const categoryFilter = searchParams?.category ?? ''
  const statusFilter = searchParams?.status ?? ''

  const { data: categories = [] } = await supabase
    .from('purchase_categories')
    .select('id, name, color, is_active')
    .order('name', { ascending: true })

  let purchasesQuery = supabase
    .from('purchases')
    .select('*, purchase_categories(name, color)')
    .order('purchase_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (categoryFilter) {
    purchasesQuery = purchasesQuery.eq('category_id', categoryFilter)
  }
  if (statusFilter) {
    purchasesQuery = purchasesQuery.eq('payment_status', statusFilter)
  }

  const { data: purchasesData, error } = await purchasesQuery
  const purchases = purchasesData ?? []

  const totalAmount = purchases.reduce((sum, purchase: any) => sum + Number(purchase.total_amount || 0), 0)
  const pendingAmount = purchases
    .filter((purchase: any) => purchase.payment_status === 'pending')
    .reduce((sum, purchase: any) => sum + Number(purchase.total_amount || 0), 0)

  const isMissingTable = error?.code === '42P01'
  const errorMessage = error?.message || null

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Compras</h1>
          <p className="text-slate-700 font-medium">
            Registro interno de compras y material publicitario asociado a clientes.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/purchases/categories">
            <Button variant="outline" className="uppercase text-xs tracking-widest font-bold">
              Categorías
            </Button>
          </Link>
          <Link href="/purchases/new">
            <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6">
              + Nueva compra
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Total registrado</p>
          <p className="text-2xl font-black text-slate-900 mt-2">${formatClp(totalAmount)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pendiente de pago</p>
          <p className="text-2xl font-black text-slate-900 mt-2">${formatClp(pendingAmount)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Categorías activas</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{categories.filter((c: any) => c.is_active).length}</p>
        </div>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Listado de compras</CardTitle>
            <form className="flex flex-col gap-2 sm:flex-row" method="get">
              <select
                name="category"
                defaultValue={categoryFilter}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagado</option>
              </select>
              <Button variant="outline" className="uppercase text-[10px] tracking-widest">
                Filtrar
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {isMissingTable
                ? 'Falta aplicar la migración de base de datos de compras.'
                : `No se pudieron cargar las compras. ${errorMessage}`}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 pr-4">Fecha</th>
                  <th className="py-3 pr-4">Descripción</th>
                  <th className="py-3 pr-4">Categoría</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Aún no hay compras registradas.
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase: any) => (
                    <tr key={purchase.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString('es-CL') : '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-900">{purchase.description}</div>
                        {purchase.invoice_number && (
                          <div className="text-[10px] text-slate-500">Factura: {purchase.invoice_number}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {purchase.purchase_categories ? (
                          <CategoryBadge name={purchase.purchase_categories.name} color={purchase.purchase_categories.color} />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold">${formatClp(Number(purchase.total_amount || 0))}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                          {purchase.payment_status === 'paid'
                            ? 'Pagado'
                            : purchase.payment_status === 'partial'
                              ? 'Parcial'
                              : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/purchases/${purchase.id}`}>
                          <Button variant="outline" className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest">
                            Ver detalle
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
