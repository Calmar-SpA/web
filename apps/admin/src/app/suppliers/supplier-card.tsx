'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { formatClp, getGrossFromNet } from '@calmar/utils'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { toggleSupplierStatus } from './actions'

interface SupplierItem {
  id: string
  item_type: string
  name: string
  cost_price: number
  is_active: boolean
}

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
  items: SupplierItem[]
}

interface SupplierCardProps {
  supplier: Supplier
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CL')
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = supplier.items || []
  const productCount = items.filter(i => i.item_type === 'producto').length
  const serviceCount = items.filter(i => i.item_type === 'servicio').length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="font-bold text-slate-900 hover:text-calmar-ocean transition-colors text-lg"
            >
              {supplier.name}
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              supplier.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {supplier.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
            {supplier.contact_name && <span>{supplier.contact_name}</span>}
            {supplier.contact_email && <span>{supplier.contact_email}</span>}
            {supplier.contact_phone && <span>{supplier.contact_phone}</span>}
            <span>Creado: {formatDate(supplier.created_at)}</span>
          </div>
          <div className="flex gap-3 mt-2">
            <span className="text-xs font-semibold text-slate-600">
              {productCount} producto{productCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {serviceCount} servicio{serviceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-bold uppercase tracking-widest gap-1"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? 'Ocultar' : 'Ver items'}
            </Button>
          )}
          <Link href={`/suppliers/${supplier.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Editar
            </Button>
          </Link>
          <form action={toggleSupplierStatus.bind(null, supplier.id, supplier.is_active)}>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest"
            >
              {supplier.is_active ? 'Desactivar' : 'Activar'}
            </Button>
          </form>
        </div>
      </div>

      {isExpanded && items.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">Tipo</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">Nombre</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">Neto</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">IVA</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">Total</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const net = Number(item.cost_price || 0)
                const gross = getGrossFromNet(net)
                const iva = Math.max(0, gross - net)
                return (
                  <tr key={item.id} className="border-b border-slate-200 last:border-0">
                    <td className="py-2 pr-4 text-xs uppercase font-bold tracking-widest text-slate-500">
                      {item.item_type}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-2 pr-4">${formatClp(net)}</td>
                    <td className="py-2 pr-4 text-slate-500">${formatClp(iva)}</td>
                    <td className="py-2 pr-4 font-semibold">${formatClp(gross)}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
