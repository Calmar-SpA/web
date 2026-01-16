"use client"

import { ProductWithDetails } from "@calmar/types"
import { ProductCard } from "@calmar/ui"
import { useCart } from "@/hooks/use-cart"

interface ProductListProps {
  products: ProductWithDetails[];
}

export function ProductList({ products }: ProductListProps) {
  const { addItem, setIsOpen } = useCart()

  return (
    <div className="flex flex-wrap justify-center gap-8">
      {products.map((product) => (
        <div key={product.id} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[280px] max-w-[350px]">
          <ProductCard 
            product={product}
            onAdd={() => {
              addItem(product)
              setIsOpen(true)
            }}
          />
        </div>
      ))}
    </div>
  )
}
