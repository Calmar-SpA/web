import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@calmar/ui'
import { logout } from '../login/actions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch points summary
  const { data: pointsData } = await supabase
    .from('users')
    .select('points_balance.sum()')
    .single()

  const totalPoints = (pointsData as any)?.sum || 0

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 border-r bg-white dark:bg-slate-900 p-6">
        <h2 className="text-xl font-bold mb-8 text-calmar-ocean">Calmar Admin</h2>
        <nav className="space-y-2">
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md font-medium">Dashboard</div>
          <div className="px-3 py-2 text-slate-500">Pedidos</div>
          <div className="px-3 py-2 text-slate-500">Productos</div>
          <div className="px-3 py-2 text-slate-500">Clientes</div>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Resumen General</h1>
          <form action={logout}>
            <Button variant="ghost">Salir</Button>
          </form>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <h3 className="text-slate-500 text-sm">Ventas Hoy</h3>
            <p className="text-2xl font-bold italic">$0</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <h3 className="text-slate-500 text-sm">Pedidos Pendientes</h3>
            <p className="text-2xl font-bold italic">0</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <h3 className="text-slate-500 text-sm">Stock Bajo</h3>
            <p className="text-2xl font-bold italic">0</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-slate-500 text-sm">Puntos en Circulación</h3>
            <p className="text-2xl font-bold italic text-indigo-600">
              {totalPoints.toLocaleString('es-CL')}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Reserva de Lealtad</p>
          </div>
        </div>
      </main>
    </div>
  )
}
