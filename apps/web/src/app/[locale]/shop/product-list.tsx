"use client"

import { ProductWithDetails } from "@calmar/types"
import { ProductCard } from "@calmar/ui"
import { useCart } from "@/hooks/use-cart"

interface ProductListProps {
  products: ProductWithDetails[];
  discount: number | null;
}

export function ProductList({ products, discount }: ProductListProps) {
  const { addItem } = useCart()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product}
          onAdd={() => addItem(product)}
          discount_percentage={discount || 0}
        />
      ))}
    </div>
  )
}
