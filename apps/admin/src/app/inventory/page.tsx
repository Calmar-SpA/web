import { createClient } from '@/lib/supabase/server'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { formatClp, getGrossFromNet } from '@calmar/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import { SuccessToast } from './success-toast'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CL')
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_entries')
    .select('*, products(name, sku), suppliers(name)')
    .order('created_at', { ascending: false })
  const entries = data ?? []
  const errorMessage = error?.message || null
  const isMissingTable = error?.code === '42P01'

  return (
    <div className="p-6 md:p-8 space-y-8">
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Inventario</h1>
          <p className="text-slate-700 font-medium">
            Historial de ingresos de stock con proveedor y fechas.
          </p>
        </div>
        <Link href="/inventory/add">
          <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
            + Nuevo ingreso
          </Button>
        </Link>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Entradas de stock</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {isMissingTable
                ? 'Falta aplicar las migraciones de base de datos para inventario.'
                : `No se pudieron cargar las entradas. ${errorMessage}`}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 pr-4">Fecha</th>
                  <th className="py-3 pr-4">Producto</th>
                  <th className="py-3 pr-4">Proveedor</th>
                  <th className="py-3 pr-4">Cantidad</th>
                  <th className="py-3 pr-4">Costo neto</th>
                  <th className="py-3 pr-4">IVA</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Factura</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Acciones</th>
                  <th className="py-3 pr-4">Caducidad</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-6 text-center text-slate-500">
                      Aún no hay ingresos registrados.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry: any) => {
                    const net = Number(entry.unit_cost || 0)
                    const gross = getGrossFromNet(net)
                    const iva = Math.max(0, gross - net)
                    return (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-900">
                          {entry.products?.name || 'Producto'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {entry.products?.sku || ''}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{entry.suppliers?.name || '-'}</td>
                      <td className="py-3 pr-4 font-bold">{entry.quantity}</td>
                      <td className="py-3 pr-4">${formatClp(net)}</td>
                      <td className="py-3 pr-4 text-slate-500">${formatClp(iva)}</td>
                      <td className="py-3 pr-4 font-semibold">${formatClp(gross)}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {entry.invoice_number || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${entry.is_invoiced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {entry.is_invoiced ? 'Facturado' : 'Sin facturar'}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${entry.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {entry.is_paid ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/inventory/${entry.id}/edit`}>
                          <Button variant="outline" className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest">
                            Editar
                          </Button>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">
                        {formatDate(entry.expiration_date)}
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
