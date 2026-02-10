'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { 
  TrendingUp, DollarSign, Package, AlertCircle, Calendar, 
  ArrowLeft, Filter, Download
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@calmar/ui'
import { toast } from 'sonner'

// Colors matching the CRM movement types
const COLORS = {
  sample: '#a855f7', // purple-500
  consignment: '#6366f1', // indigo-500
  sale_invoice: '#22c55e', // green-500
  sale_credit: '#f97316', // orange-500
  pending: '#f59e0b', // amber-500
  paid: '#10b981', // emerald-500
  overdue: '#ef4444', // red-500
}

const MOVEMENT_LABELS: Record<string, string> = {
  sample: 'Muestra',
  consignment: 'Consignación',
  sale_invoice: 'Venta Factura',
  sale_credit: 'Venta Crédito'
}

export default function CRMStatsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month') // month, quarter, year, all
  const [movements, setMovements] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  
  // KPIs
  const [kpis, setKpis] = useState({
    totalMovements: 0,
    totalIncome: 0,
    totalPaid: 0,
    totalPending: 0
  })

  // Chart Data
  const [chartData, setChartData] = useState({
    byType: [] as any[],
    incomeByType: [] as any[],
    stockTop10: [] as any[],
    unitsByType: [] as any[],
    timeline: [] as any[]
  })

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Calculate date filter
      let startDate = new Date()
      if (period === 'month') startDate.setMonth(startDate.getMonth() - 1)
      else if (period === 'quarter') startDate.setMonth(startDate.getMonth() - 3)
      else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1)
      else startDate = new Date(0) // All time

      // 1. Fetch Movements
      let query = supabase
        .from('product_movements')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      const { data: movementsData, error: movementsError } = await query

      if (movementsError) throw movementsError

      // 2. Fetch Inventory & Products
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product:products (
            id,
            name,
            sku
          )
        `)
        .order('quantity', { ascending: false })
        .limit(10)

      if (inventoryError) throw inventoryError

      setMovements(movementsData || [])
      setInventory(inventoryData || [])

      processData(movementsData || [], inventoryData || [])

    } catch (error: any) {
      console.error('Error loading stats:', error)
      toast.error('Error al cargar estadísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const processData = (movementsList: any[], inventoryList: any[]) => {
    // --- KPIs ---
    const salesMovements = movementsList.filter(m => 
      ['sale_invoice', 'sale_credit', 'consignment'].includes(m.movement_type)
    )

    const totalIncome = salesMovements.reduce((sum, m) => sum + Number(m.total_amount || 0), 0)
    const totalPaid = salesMovements.reduce((sum, m) => sum + Number(m.amount_paid || 0), 0)
    
    setKpis({
      totalMovements: movementsList.length,
      totalIncome,
      totalPaid,
      totalPending: totalIncome - totalPaid
    })

    // --- Chart 1: Movements by Type (Donut) ---
    const byTypeCount: Record<string, number> = {}
    movementsList.forEach(m => {
      byTypeCount[m.movement_type] = (byTypeCount[m.movement_type] || 0) + 1
    })
    
    const byTypeData = Object.entries(byTypeCount).map(([key, value]) => ({
      name: MOVEMENT_LABELS[key] || key,
      value,
      key // for color mapping
    }))
    
    // --- Chart 2: Income vs Pending by Type (Bar) ---
    const incomeByTypeMap: Record<string, { generated: number, paid: number, pending: number }> = {}
    
    salesMovements.forEach(m => {
      if (!incomeByTypeMap[m.movement_type]) {
        incomeByTypeMap[m.movement_type] = { generated: 0, paid: 0, pending: 0 }
      }
      const amount = Number(m.total_amount || 0)
      const paid = Number(m.amount_paid || 0)
      
      incomeByTypeMap[m.movement_type].generated += amount
      incomeByTypeMap[m.movement_type].paid += paid
      incomeByTypeMap[m.movement_type].pending += (amount - paid)
    })

    const incomeByTypeData = Object.entries(incomeByTypeMap).map(([key, val]) => ({
      name: MOVEMENT_LABELS[key] || key,
      ...val
    }))

    // --- Chart 3: Top Stock (Horizontal Bar) ---
    const stockData = inventoryList.map((item: any) => ({
      name: item.product?.name || 'Desconocido',
      sku: item.product?.sku,
      quantity: item.quantity
    }))

    // --- Chart 4: Units Moved by Type ---
    const unitsByTypeMap: Record<string, number> = {}
    
    movementsList.forEach(m => {
      const items = Array.isArray(m.items) ? m.items : []
      const totalUnits = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
      
      unitsByTypeMap[m.movement_type] = (unitsByTypeMap[m.movement_type] || 0) + totalUnits
    })

    const unitsByTypeData = Object.entries(unitsByTypeMap).map(([key, value]) => ({
      name: MOVEMENT_LABELS[key] || key,
      value,
      key
    }))

    setChartData({
      byType: byTypeData,
      incomeByType: incomeByTypeData,
      stockTop10: stockData,
      unitsByType: unitsByTypeData,
      timeline: [] // TODO: Implement timeline if needed
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val)
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/crm/movements" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
              Estadísticas <span className="text-calmar-ocean">CRM</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-7">
            Análisis de movimientos, ingresos e inventario
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'month', label: '30 Días' },
            { id: 'quarter', label: '3 Meses' },
            { id: 'year', label: 'Año' },
            { id: 'all', label: 'Todo' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                period === p.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-40 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-calmar-ocean border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calculando métricas...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Movimientos</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{kpis.totalMovements}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">En el periodo seleccionado</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Ingreso Generado</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{formatCurrency(kpis.totalIncome)}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Total ventas y consignaciones</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Cobrado</span>
              </div>
              <p className="text-3xl font-black text-emerald-600">{formatCurrency(kpis.totalPaid)}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Pagos verificados</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Pendiente</span>
              </div>
              <p className="text-3xl font-black text-orange-600">{formatCurrency(kpis.totalPending)}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Por cobrar</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution by Type */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Distribución por Tipo</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Pending */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Ingresos vs Pendientes</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.incomeByType}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend 
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value === 'paid' ? 'Cobrado' : 'Pendiente'}</span>}
                    />
                    <Bar dataKey="paid" stackId="a" fill={COLORS.paid} radius={[0, 0, 4, 4]} barSize={40} />
                    <Bar dataKey="pending" stackId="a" fill={COLORS.pending} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Units Moved */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Unidades Movidas por Canal</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.unitsByType}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      width={100}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.unitsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS] || '#ccc'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Stock */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Top Stock Actual</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.stockTop10}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      width={120}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="quantity" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
