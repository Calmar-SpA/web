'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UsersRound, Building2, User, Package, DollarSign, AlertCircle, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CRMPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'b2b' | 'b2c'>('overview')

  const menuItems = [
    {
      title: 'Prospectos',
      description: 'Pipeline de prospectos y leads',
      icon: UsersRound,
      href: '/crm/prospects',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Movimientos',
      description: 'Muestras, consignaciones y ventas',
      icon: Package,
      href: '/crm/movements',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Deudas',
      description: 'Control de pagos pendientes',
      icon: DollarSign,
      href: '/crm/debts',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Estadísticas',
      description: 'Gráficos de movimientos e inventario',
      icon: BarChart3,
      href: '/crm/stats',
      color: 'bg-calmar-ocean',
      textColor: 'text-calmar-ocean'
    }
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            CRM <span className="text-calmar-ocean">Gestión</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Seguimiento de prospectos, clientes y movimientos de productos
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <UsersRound className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Prospectos Activos
          </h3>
          <p className="text-3xl font-black text-slate-900">-</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Movimientos Pendientes
          </h3>
          <p className="text-3xl font-black text-slate-900">-</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-100">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Deudas Pendientes
          </h3>
          <p className="text-3xl font-black text-slate-900">-</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
            Vencidos
          </h3>
          <p className="text-3xl font-black text-red-600">-</p>
        </div>
      </div>

      {/* Main Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-calmar-ocean transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {item.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/crm/prospects?action=new&type=b2b"
            className="px-4 py-2 bg-calmar-ocean text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-calmar-ocean/90 transition-colors"
          >
            + Nuevo Prospecto B2B
          </Link>
          <Link
            href="/crm/prospects?action=new&type=b2c"
            className="px-4 py-2 bg-calmar-primary text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-calmar-primary/90 transition-colors"
          >
            + Nuevo Prospecto B2C
          </Link>
          <Link
            href="/crm/movements/new?type=sample"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors"
          >
            + Registrar Muestra
          </Link>
          <Link
            href="/crm/movements/new?type=consignment"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
          >
            + Nueva Consignación
          </Link>
        </div>
      </div>
    </div>
  )
}
