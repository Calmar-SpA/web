import { Button } from '@calmar/ui'
import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

interface StockItem {
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    image_url?: string | null
    unit_product_id?: string | null
    units_per_pack?: number | null
  }
}

interface StockTableProps {
  items: StockItem[]
}

export function StockTable({ items }: StockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-slate-200 text-xs font-black text-slate-950 uppercase tracking-widest bg-slate-50">
            <th className="py-4 px-4">Imagen</th>
            <th className="py-4 px-4">SKU</th>
            <th className="py-4 px-4">Producto</th>
            <th className="py-4 px-4">Stock Actual</th>
            <th className="py-4 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-100">
          {items.length === 0 ? (
             <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                No hay productos con inventario registrado
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.product_id} className="text-sm hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-xs font-black text-slate-950">
                  {item.product.sku || '---'}
                </td>
                <td className="py-4 px-4">
                  <div className="font-black text-slate-950 uppercase tracking-tight">
                    {item.product.name}
                  </div>
                  {item.product.units_per_pack && item.product.units_per_pack > 1 && (
                     <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                       Pack x{item.product.units_per_pack}
                     </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-md font-black text-sm border-2 ${
                    item.quantity < 10 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {item.quantity} Unidades
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link href={`/inventory/product/${item.product.id}`}>
                    <Button variant="outline" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 hover:border-calmar-primary hover:text-calmar-primary">
                      Ver Historial
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
