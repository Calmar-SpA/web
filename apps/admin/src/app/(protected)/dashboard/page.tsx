import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderService } from '@calmar/database'
import { ProductService } from '@calmar/database'
import { ShoppingCart, Package, DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch statistics
  const orderService = new OrderService(supabase)
  const productService = new ProductService(supabase)
  
  const orders = await orderService.getAllOrders()
  const products = await productService.getProducts()

  // Calculate today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.created_at)
    return orderDate >= today && order.status === 'paid'
  })
  const todaySales = todayOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)

  // Pending orders
  const pendingOrders = orders.filter((order: any) => order.status === 'pending_payment').length

  // Low stock products (assuming stock field exists)
  const lowStockProducts = products.filter((p: any) => (p.stock || 0) < 10).length

  // Total points
  const { data: pointsData } = await supabase
    .from('users')
    .select('points_balance')
  
  const totalPoints = pointsData?.reduce((sum, u) => sum + (u.points_balance || 0), 0) || 0

  // Total products
  const totalProducts = products.length

  // Pending movement payments
  const { count: pendingPaymentsCount } = await supabase
    .from('movement_payments')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  const stats = [
    {
      title: 'Ventas Hoy',
      value: `$${todaySales.toLocaleString('es-CL')}`,
      icon: DollarSign,
      bgColor: 'bg-white',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      valueColor: 'text-emerald-900',
      borderColor: 'border-emerald-300',
    },
    {
      title: 'Pedidos Pendientes',
      value: pendingOrders.toString(),
      icon: ShoppingCart,
      bgColor: 'bg-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      valueColor: 'text-blue-900',
      borderColor: 'border-blue-300',
    },
    {
      title: 'Pagos por Verificar',
      value: (pendingPaymentsCount || 0).toString(),
      icon: CreditCard,
      bgColor: 'bg-white',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      valueColor: 'text-amber-900',
      borderColor: 'border-amber-300',
    },
    {
      title: 'Total Productos',
      value: totalProducts.toString(),
      icon: Package,
      bgColor: 'bg-white',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
      valueColor: 'text-purple-900',
      borderColor: 'border-purple-300',
    },
    {
      title: 'Stock Bajo',
      value: lowStockProducts.toString(),
      icon: TrendingUp,
      bgColor: 'bg-white',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-700',
      valueColor: 'text-orange-900',
      borderColor: 'border-orange-300',
    },
    {
      title: 'Puntos en Circulación',
      value: totalPoints.toLocaleString('es-CL'),
      icon: Users,
      bgColor: 'bg-white',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-700',
      valueColor: 'text-teal-900',
      borderColor: 'border-teal-300',
      subtitle: 'Reserva de Lealtad',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-calmar-text">
          Resumen General
        </h1>
        <p className="text-slate-500 text-sm mt-2">Vista general de las métricas principales de Calmar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              href={
                stat.title === 'Pedidos Pendientes' ? '/orders' :
                stat.title === 'Total Productos' || stat.title === 'Stock Bajo' ? '/products' :
                stat.title === 'Pagos por Verificar' ? '/crm/payments' :
                '#'
              }
              className="group"
            >
              <div className={`
                ${stat.bgColor} p-6 rounded-2xl border-2 transition-all duration-300
                ${stat.borderColor}
                hover:shadow-xl hover:scale-[1.02]
                group-hover:-translate-y-1
              `}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-xl ${stat.iconBg} border border-black/5`}>
                    <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-slate-950">
                  {stat.title}
                </h3>
                <p className={`text-6xl font-black ${stat.valueColor} mb-1`}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-[11px] uppercase font-black tracking-wider text-slate-700">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
