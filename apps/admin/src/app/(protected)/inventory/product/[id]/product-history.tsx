'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownLeft, ShoppingCart } from 'lucide-react'

export interface HistoryItem {
  id: string
  date: string
  type: 'entry' | 'sample' | 'consignment' | 'sale_invoice' | 'sale_credit' | 'web_order'
  quantity: number
  recipient: string
  status: string
  reference: string
  url?: string
}

interface ProductHistoryProps {
  history: HistoryItem[]
}

const TYPE_CONFIG = {
  entry: { label: 'Ingreso Stock', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  sample: { label: 'Muestra', icon: ArrowUpRight, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  consignment: { label: 'Consignación', icon: ArrowUpRight, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  sale_invoice: { label: 'Venta Factura', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  sale_credit: { label: 'Venta Crédito', icon: ArrowUpRight, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  web_order: { label: 'Pedido Web', icon: ShoppingCart, color: 'text-pink-600 bg-pink-50 border-pink-200' }
}

export function ProductHistory({ history }: ProductHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No hay historial de movimientos para este producto.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
            <th className="py-3 px-4">Fecha</th>
            <th className="py-3 px-4">Tipo</th>
            <th className="py-3 px-4">Referencia</th>
            <th className="py-3 px-4">Destinatario / Origen</th>
            <th className="py-3 px-4">Cantidad</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4 text-right">Ver</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.entry
            const Icon = config.icon
            
            return (
              <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                  {new Date(item.date).toLocaleDateString('es-CL')}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">
                  {item.reference}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{item.recipient}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-black ${item.type === 'entry' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {item.type === 'entry' ? '+' : '-'}{item.quantity}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {item.url && (
                    <Link href={item.url} className="text-calmar-primary hover:underline text-xs font-bold uppercase tracking-wider">
                      Detalle
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
