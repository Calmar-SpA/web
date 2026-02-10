'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { EntriesTable } from './entries-table'
import { StockTable } from './stock-table'
import { Package, History } from 'lucide-react'

interface InventoryTabsProps {
  entries: any[]
  stock: any[]
  errorMessage?: string | null
  isMissingTable?: boolean
}

export function InventoryTabs({ entries, stock, errorMessage, isMissingTable }: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'entries'>('stock')

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'stock'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Package className="w-4 h-4" />
          Stock Actual
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'entries'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <History className="w-4 h-4" />
          Ingresos
        </button>
      </div>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>
            {activeTab === 'stock' ? 'Stock Actual por Producto' : 'Historial de Ingresos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && activeTab === 'entries' && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {isMissingTable
                ? 'Falta aplicar las migraciones de base de datos para inventario.'
                : `No se pudieron cargar las entradas. ${errorMessage}`}
            </div>
          )}
          
          {activeTab === 'stock' ? (
            <StockTable items={stock} />
          ) : (
            <EntriesTable entries={entries} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
