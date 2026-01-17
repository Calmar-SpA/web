'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { ProductWithDetails } from '@calmar/types'
import { formatClp, getPriceBreakdown } from '@calmar/utils'
import Link from 'next/link'
import Image from 'next/image'
import { ImageUploadModal } from './image-upload-modal'
import { ImageIcon } from 'lucide-react'

interface ProductsTableProps {
  products: ProductWithDetails[]
  stockTotals: Record<string, number>
}

export function ProductsTable({ products, stockTotals }: ProductsTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    sku: string
    imageUrl?: string
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImageSuccess = () => {
    setRefreshKey(prev => prev + 1)
    window.location.reload() // Recargar para mostrar nueva imagen
  }

  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        No hay productos registrados
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto" key={refreshKey}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-200 text-xs font-black text-slate-950 uppercase tracking-widest bg-slate-50">
              <th className="py-4 px-4">Imagen</th>
              <th className="py-4 px-4">SKU</th>
              <th className="py-4 px-4">Producto</th>
              <th className="py-4 px-4">Precio Base</th>
              <th className="py-4 px-4">Stock</th>
              <th className="py-4 px-4">Estado</th>
              <th className="py-4 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {products.map((product) => {
              const { net, iva } = getPriceBreakdown(product.base_price || 0)
              return (
                <tr key={product.id} className="text-sm hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm group-hover:border-calmar-primary/30 transition-all">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name || 'Producto'}
                        fill
                        className="object-contain p-2"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-xs font-black text-slate-950">
                  {product.sku || '---'}
                </td>
                <td className="py-4 px-4">
                  <div className="font-black text-slate-950 uppercase tracking-tight text-base">
                    {product.name || 'SIN NOMBRE'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    ID: {product.id.slice(0, 8)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-black text-slate-950 text-base">
                    ${formatClp(product.base_price || 0)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    IVA incluido
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {`Neto: $${formatClp(net)} · IVA (19%): $${formatClp(iva)}`}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-black text-sm border-2 ${
                    (stockTotals[product.id] ?? 0) < 10 
                      ? 'bg-orange-50 text-orange-700 border-orange-200' 
                      : 'bg-slate-50 text-slate-900 border-slate-200'
                  }`}>
                    {stockTotals[product.id] ?? 0}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {product.is_active ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-widest border-2 border-emerald-200 shadow-sm">
                      Activo
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest border-2 border-slate-300">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 hover:border-calmar-primary hover:text-calmar-primary shadow-sm"
                      onClick={() => setSelectedProduct({
                        id: product.id,
                        sku: product.sku,
                        imageUrl: product.image_url
                      })}
                    >
                      Imagen
                    </Button>
                    <Link href={`/products/${product.id}/edit`}>
                      <Button className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white hover:bg-slate-800 shadow-md">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <ImageUploadModal
          productId={selectedProduct.id}
          productSku={selectedProduct.sku}
          currentImageUrl={selectedProduct.imageUrl}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={handleImageSuccess}
        />
      )}
    </>
  )
}
