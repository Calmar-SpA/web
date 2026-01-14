'use client'

import { useState } from 'react'
import { Button } from '@calmar/ui'
import { ProductWithDetails } from '@calmar/types'
import Link from 'next/link'
import Image from 'next/image'
import { ImageUploadModal } from './image-upload-modal'
import { ImageIcon } from 'lucide-react'

interface ProductsTableProps {
  products: ProductWithDetails[]
}

export function ProductsTable({ products }: ProductsTableProps) {
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
            <tr className="border-b text-sm font-medium text-slate-500">
              <th className="py-4 px-4">Imagen</th>
              <th className="py-4 px-4">SKU</th>
              <th className="py-4 px-4">Producto</th>
              <th className="py-4 px-4">Precio Base</th>
              <th className="py-4 px-4">Stock</th>
              <th className="py-4 px-4">Estado</th>
              <th className="py-4 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="text-sm hover:bg-slate-50/50">
                <td className="py-4 px-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-xs">{product.sku}</td>
                <td className="py-4 px-4 font-bold">{product.name}</td>
                <td className="py-4 px-4">${product.base_price.toLocaleString('es-CL')}</td>
                <td className="py-4 px-4">
                  <span className={`font-bold ${(product.inventory?.[0]?.quantity ?? 0) < 10 ? 'text-orange-500' : 'text-slate-900'}`}>
                    {product.inventory?.[0]?.quantity ?? 0}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {product.is_active ? (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold uppercase">Activo</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase">Inactivo</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => setSelectedProduct({
                        id: product.id,
                        sku: product.sku,
                        imageUrl: product.image_url
                      })}
                    >
                      Cambiar Imagen
                    </Button>
                    <Link href={`/products/${product.id}/translations`}>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest">
                        Traducciones
                      </Button>
                    </Link>
                    <Link href={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
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
