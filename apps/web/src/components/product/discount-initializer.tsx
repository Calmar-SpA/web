"use client"

import { useEffect } from "react"
import { useCart } from "@/hooks/use-cart"

interface DiscountInitializerProps {
  discount: number | null
}

export function DiscountInitializer({ discount }: DiscountInitializerProps) {
  const { setNewsletterDiscount } = useCart()

  useEffect(() => {
    setNewsletterDiscount(discount)
  }, [discount, setNewsletterDiscount])

  return null
}
