
"use client"

import { useCart } from "@/hooks/use-cart"
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@calmar/ui"
import { ShoppingBag, ChevronLeft, CreditCard, Truck, Building2 } from "lucide-react"
import { Link } from "@/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { createOrderAndInitiatePayment } from "./actions"
import { toast } from "sonner"
import { PointsRedemption } from "@/components/checkout/points-redemption"
import { ShippingOptions } from "@/components/checkout/shipping-options"
import { AddressSelector } from "@/components/checkout/address-selector"
import { useTranslations } from "next-intl"

interface ShippingOption {
  code: string
  name: string
  price: number
  finalWeight: string
  estimatedDays?: string
}

interface CheckoutFormProps {
  user: any
  b2bClient: any
  initialNewsletterDiscount?: number | null
}

export function CheckoutForm({ user, b2bClient, initialNewsletterDiscount }: CheckoutFormProps) {
  const t = useTranslations("Checkout")
  const { items, total, itemCount } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'flow' | 'credit'>('flow')
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    address: "",
    comuna: "",
    region: "",
  })

  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [newsletterDiscountPercent, setNewsletterDiscountPercent] = useState<number | null>(initialNewsletterDiscount || null)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [comunaCode, setComunaCode] = useState("") // Starken comuna code
  const [cityCode, setCityCode] = useState("") // Starken city code for quotes

  // Calculate total cart weight in kg (from weight_grams)
  const cartWeightKg = items.reduce((sum, item) => {
    const weightGrams = item.product.weight_grams || 500 // Default 500g if not set
    return sum + (weightGrams * item.quantity) / 1000
  }, 0)

  const checkDiscountForEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterDiscountPercent(null)
      return
    }
    
    try {
      const { checkNewsletterDiscount } = await import("./actions")
      const discount = await checkNewsletterDiscount(email)
      setNewsletterDiscountPercent(discount)
    } catch (error) {
      console.error("Error checking discount:", error)
      setNewsletterDiscountPercent(null)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    if (user?.email) {
      checkDiscountForEmail(user.email)
    }
  }, [user?.email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'email') {
      checkDiscountForEmail(value)
    }
  }

  const handleRedeem = (points: number) => {
    setPointsToRedeem(points)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createOrderAndInitiatePayment({
        items,
        total,
        customerInfo: formData,
        pointsToRedeem,
        paymentMethod,
        shippingCost: selectedShipping?.price || 0,
        shippingServiceCode: selectedShipping?.code?.toString(),
        shippingServiceName: selectedShipping?.name,
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("messages.error"))
      setIsSubmitting(false)
    }
  }

  const b2bDiscount = (b2bClient?.is_active && b2bClient.discount_percentage > 0) 
    ? Math.floor(total * (b2bClient.discount_percentage / 100))
    : 0
  
  // Newsletter Discount (Only if NO B2B discount was applied)
  const appliedNewsletterDiscount = (b2bDiscount === 0 && newsletterDiscountPercent && newsletterDiscountPercent > 0)
    ? Math.floor((total - b2bDiscount) * (newsletterDiscountPercent / 100))
    : 0

  const shippingCost = selectedShipping?.price || 0
  const subtotalAfterDiscounts = total - b2bDiscount - appliedNewsletterDiscount
  const finalTotal = subtotalAfterDiscounts - pointsToRedeem + shippingCost

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-slate-200" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("emptyCart.title")}</h1>
          <p className="text-slate-500 mt-2">{t("emptyCart.description")}</p>
        </div>
        <Link href="/shop">
          <Button className="bg-slate-900 hover:bg-calmar-ocean text-white font-black px-8">
            {t("emptyCart.button")}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/shop" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors group">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {t("backToShop")}
        </Link>
        <h1 className="text-4xl font-black tracking-tighter mt-4 uppercase">{t("title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-4 border-slate-100">
              <div className="w-8 h-8 rounded-full bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">{t("shipping.title")}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("shipping.fullName")}</label>
                <Input name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("shipping.email")}</label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("shipping.address")}</label>
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder={t("shipping.addressPlaceholder")} required />
              </div>
              
              {/* Region and Comuna Selectors */}
              <AddressSelector
                selectedRegion={formData.region}
                selectedComuna={formData.comuna}
                selectedComunaCode={comunaCode}
                onRegionChange={(regionId, regionName) => {
                  setFormData(prev => ({ ...prev, region: regionName }))
                  setComunaCode("") // Reset comuna when region changes
                  setCityCode("") // Reset city code
                  setSelectedShipping(null) // Reset shipping
                }}
                onComunaChange={(comunaName, code, starkenCityCode) => {
                  setFormData(prev => ({ ...prev, comuna: comunaName }))
                  setComunaCode(code)
                  setCityCode(starkenCityCode) // Store city code for Starken quote API
                  setSelectedShipping(null) // Reset shipping when comuna changes
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Shipping Options - shows when comuna is selected */}
            <div className="mt-6">
              <ShippingOptions
                cityCode={cityCode}
                weightKg={cartWeightKg}
                declaredValue={total}
                selectedOption={selectedShipping}
                onSelectOption={setSelectedShipping}
                disabled={isSubmitting}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-4 border-slate-100">
              <div className="w-8 h-8 rounded-full bg-calmar-mint/10 flex items-center justify-center text-calmar-ocean-dark">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">{t("payment.title")}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'flow' ? 'border-calmar-ocean bg-calmar-ocean/5 ring-1 ring-calmar-ocean' : 'border-slate-200'}`}>
                <input type="radio" name="payment" value="flow" checked={paymentMethod === 'flow'} onChange={() => setPaymentMethod('flow')} className="hidden" />
                <div className="flex-1">
                  <p className="font-bold">{t("payment.flow")}</p>
                  <p className="text-xs text-slate-500">{t("payment.flowDesc")}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-4 ${paymentMethod === 'flow' ? 'border-calmar-ocean' : 'border-slate-300'}`} />
              </label>

              {b2bClient?.is_active && (
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit' ? 'border-calmar-ocean bg-calmar-ocean/5 ring-1 ring-calmar-ocean' : 'border-slate-200'}`}>
                  <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="hidden" />
                  <div className="flex-1">
                    <p className="font-bold flex items-center gap-2">
                      {t("payment.credit")} <Building2 className="h-3 w-3" />
                    </p>
                    <p className="text-xs text-slate-500">{t("payment.creditAvailable", { amount: Number(b2bClient.credit_limit).toLocaleString('es-CL') })}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-4 ${paymentMethod === 'credit' ? 'border-calmar-ocean' : 'border-slate-300'}`} />
                </label>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-32 border-calmar-ocean/10 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-900 border-b border-white/10 text-white">
              <CardTitle className="text-lg uppercase tracking-tight">{t("summary.title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                {items.map((item) => {
                  // Simplified image URL handling - matches product page logic
                  let productImage = item.product.image_url || (item.product as any).image;
                  
                  // Only add cache busting for Supabase URLs, use all other URLs as-is
                  if (productImage?.includes('supabase.co')) {
                    const timestamp = item.product.updated_at ? new Date(item.product.updated_at).getTime() : Date.now();
                    if (!isNaN(timestamp)) {
                      productImage = `${productImage}${productImage.includes('?') ? '&' : '?'}v=${timestamp}`;
                    }
                  }

                  return (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                      {productImage ? (
                        <img 
                          src={productImage} 
                          alt={item.product.name}
                          className="object-contain w-full h-full p-2"
                        />
                      ) : (
                        <div className="text-slate-300 italic text-[10px]">
                          Sin img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{t("summary.quantity", { qty: item.quantity })}</p>
                      <p className="font-black text-calmar-ocean text-sm mt-1">
                        ${(item.product.base_price * item.quantity).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <PointsRedemption cartTotal={subtotalAfterDiscounts} onRedeem={handleRedeem} disabled={isSubmitting} />

                <div className="flex justify-between text-sm mt-4">
                  <span className="text-slate-500 font-medium">{t("summary.subtotal")}</span>
                  <span className="font-bold">${total.toLocaleString('es-CL')}</span>
                </div>
                
                {b2bDiscount > 0 && (
                  <div className="flex justify-between text-sm text-calmar-ocean-dark font-black uppercase tracking-tighter">
                    <span>{t("summary.b2bDiscount", { percent: b2bClient.discount_percentage })}</span>
                    <span>-${b2bDiscount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                
                {appliedNewsletterDiscount > 0 && (
                  <div className="flex justify-between text-sm text-calmar-mint-dark font-black uppercase tracking-tighter">
                    <span>{t("summary.newsletterDiscount", { percent: newsletterDiscountPercent ?? 0 })}</span>
                    <span>-${appliedNewsletterDiscount.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {pointsToRedeem > 0 && (
                  <div className="flex justify-between text-sm text-indigo-600 font-bold">
                    <span>{t("summary.calmarPoints")}</span>
                    <span>-${pointsToRedeem.toLocaleString('es-CL')}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t("summary.shipping")}</span>
                  <span className="font-bold text-slate-900">
                    {shippingCost > 0 
                      ? `$${shippingCost.toLocaleString('es-CL')}` 
                      : formData.comuna ? 'Calculando...' : 'Ingresa tu comuna'
                    }
                  </span>
                </div>

                <div className="flex justify-between text-2xl pt-4 border-t border-slate-900 uppercase">
                  <span className="font-black tracking-tighter">{t("summary.total")}</span>
                  <span className="font-black text-slate-900">${finalTotal.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-slate-900 hover:bg-calmar-ocean text-white text-xl font-black shadow-xl shadow-slate-900/20 transition-all hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? t("buttons.processing") : paymentMethod === 'credit' ? t("buttons.payWithCredit") : t("buttons.payWithFlow")}
              </Button>
              
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                {paymentMethod === 'credit' ? t("messages.creditApproval") : t("messages.secureTransaction")}
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
