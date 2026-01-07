"use client"

import { useState } from "react"
import { Button } from "@calmar/ui"
import { useCart } from "@/hooks/use-cart"
import { Product } from "@calmar/types"
import { Plus, Minus } from "lucide-react"

interface AddToCartProps {
  product: Product;
}

export function AddToCart({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem, setIsOpen } = useCart()

  const increment = () => setQuantity(prev => prev + 1)
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = () => {
    addItem(product, quantity)
    setIsOpen(true)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex border border-slate-200 rounded-lg items-center bg-white shadow-sm overflow-hidden h-14">
        <button 
          onClick={decrement}
          className="px-6 h-full hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900"
          aria-label="Disminuir cantidad"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="px-6 font-black italic text-lg border-x border-slate-100 min-w-[60px] text-center">
          {quantity}
        </div>
        <button 
          onClick={increment}
          className="px-6 h-full hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900"
          aria-label="Aumentar cantidad"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <Button 
        onClick={handleAddToCart}
        className="flex-1 h-14 bg-slate-900 hover:bg-calmar-ocean text-white text-lg font-black italic transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
      >
        AÑADIR AL CARRO
      </Button>
    </div>
  )
}
