"use client"

import { ProductWithDetails } from "@calmar/types"
import { ProductCard } from "@calmar/ui"
import { useCart } from "@/hooks/use-cart"

interface ProductListProps {
  products: ProductWithDetails[];
}

export function ProductList({ products }: ProductListProps) {
  const { addItem } = useCart()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product}
          onAdd={() => addItem(product)}
        />
      ))}
    </div>
  )
}
