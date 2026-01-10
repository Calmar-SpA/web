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
          <h1 className="text-3xl font-black tracking-tighter uppercase">Gestión de Pedidos</h1>
          <p className="text-slate-500 text-sm">Administra y procesa las ventas de Calmar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold border-2">
            <Filter className="w-4 h-4 mr-2" /> Filtrar
          </Button>
          <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold">
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
                    <td className="px-6 py-4 font-mono text-xs font-bold text-calmar-ocean">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 font-black">
                      ${order.total_amount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                        order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                        order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
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
