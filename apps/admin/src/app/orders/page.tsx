import { createClient } from '@/lib/supabase/server'
import { OrderService } from '@calmar/database'
import { Button, Card, CardHeader, CardTitle, CardContent } from "@calmar/ui"
import { Package, Search, Filter, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { redirect } from 'next/navigation'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orderService = new OrderService(supabase)
  const orders = await orderService.getAllOrders()

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-950">Gestión de Pedidos</h1>
          <p className="text-slate-700 font-medium">Administra y procesa las ventas de Calmar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-black border-2 border-slate-200 text-slate-950 hover:bg-slate-50 uppercase text-xs tracking-widest">
            <Filter className="w-4 h-4 mr-2" /> Filtrar
          </Button>
          <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-6 shadow-lg">
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">ID Pedido</th>
                  <th className="px-6 py-4 font-bold">Fecha</th>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Total</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {new Date(order.created_at).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ${order.total_amount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        order.status === 'paid' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 
                        order.status === 'pending_payment' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                        'bg-slate-200 text-slate-900 border-slate-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/orders/${order.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-calmar-ocean">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
