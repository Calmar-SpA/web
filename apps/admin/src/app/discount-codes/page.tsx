import { createClient } from '@/lib/supabase/server'
import { DiscountCodeService } from '@calmar/database'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import Link from 'next/link'

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-CL')
}

const formatDiscount = (type: string, value: number) => {
  if (type === 'percentage') {
    return `${value}%`
  }
  return `$${Number(value).toLocaleString('es-CL')}`
}

export default async function DiscountCodesPage() {
  const supabase = await createClient()
  const discountService = new DiscountCodeService(supabase)

  let codes = []
  let loadError: string | null = null
  try {
    codes = await discountService.getAllDiscountCodes()
  } catch (error) {
    const message = (error as any)?.message || 'Error al cargar códigos'
    console.error('Error fetching discount codes:', error)
    loadError = message
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">Códigos de Descuento</h1>
          <p className="text-slate-700 font-medium">Gestiona promociones y reglas de uso</p>
        </div>
        <Link href="/discount-codes/new">
          <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
            + Nuevo código
          </Button>
        </Link>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Listado de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              No se pudieron cargar los códigos. {loadError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Usos</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Vigencia</th>
                  <th className="py-3 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      Aún no tienes códigos creados.
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => {
                    const isExpired = code.expires_at ? new Date(code.expires_at) < new Date() : false
                    const isActive = code.is_active && !isExpired
                    const usageLabel = code.usage_limit
                      ? `${code.usage_count || 0}/${code.usage_limit}`
                      : `${code.usage_count || 0}/∞`

                    return (
                      <tr key={code.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-bold text-slate-900">{code.code}</td>
                        <td className="py-3 pr-4 capitalize">{code.discount_type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}</td>
                        <td className="py-3 pr-4">{formatDiscount(code.discount_type, Number(code.discount_value))}</td>
                        <td className="py-3 pr-4">{usageLabel}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">
                          {formatDate(code.starts_at)} - {formatDate(code.expires_at)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Link
                            href={`/discount-codes/${code.id}`}
                            className="text-calmar-ocean hover:text-calmar-ocean-dark font-bold"
                          >
                            Editar
                          </Link>
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
