
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@calmar/ui'
import { Building2, CheckCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react'
import { approveB2BClient } from './actions'

export default async function AdminB2BPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('b2b_clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight">Gestión B2B</h1>
          <p className="text-slate-500">Administra solicitudes de empresas y límites de crédito.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {clients?.map((client) => (
          <Card key={client.id} className="overflow-hidden border-none shadow-lg">
            <CardHeader className={`${client.is_active ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-600'} py-4 px-6 flex flex-row items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <CardTitle className="text-lg font-bold uppercase">{client.company_name}</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                {client.is_active ? (
                  <><CheckCircle className="h-4 w-4" /> Activo</>
                ) : (
                  <><Clock className="h-4 w-4" /> Pendiente de Aprobación</>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto</p>
                  <p className="font-bold text-slate-900">{client.contact_name}</p>
                  <p className="text-sm text-slate-500">{client.contact_email}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RUT</p>
                  <p className="font-bold text-slate-900">{client.tax_id}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descuento</p>
                  <p className="text-2xl font-black italic text-calmar-ocean">{client.discount_percentage}%</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Línea de Crédito</p>
                  <p className="text-2xl font-black italic text-slate-900">${Number(client.credit_limit).toLocaleString('es-CL')}</p>
                </div>
              </div>

              {!client.is_active && (
                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button variant="outline" className="text-xs font-bold uppercase tracking-widest h-10">Rechazar</Button>
                  <form action={async () => {
                    'use server'
                    await approveB2BClient(client.id, { discount: 10, creditLimit: 1000000 })
                  }}>
                    <Button className="bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest h-10 px-6 gap-2">
                      <ShieldCheck className="h-4 w-4" /> Aprobar con 10% y $1M
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!clients || clients.length === 0) && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold italic uppercase tracking-tighter">No hay solicitudes B2B</p>
          </div>
        )}
      </div>
    </div>
  )
}
