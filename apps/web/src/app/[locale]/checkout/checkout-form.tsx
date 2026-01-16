
"use client"

import { useCart } from "@/hooks/use-cart"
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@calmar/ui"
import { ShoppingBag, ChevronLeft, CreditCard, Truck, Building2, Plus, Minus, Tag, User, LogIn, Eye, EyeOff } from "lucide-react"
import { Link } from "@/navigation"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { createOrderAndInitiatePayment, validateDiscountCode, checkoutLogin } from "./actions"
import { toast } from "sonner"
import { PointsRedemption } from "@/components/checkout/points-redemption"
import { ShippingOptions } from "@/components/checkout/shipping-options"
import { useTranslations } from "next-intl"
import { formatClp, formatRut, getPriceBreakdown, isValidRut } from "@calmar/utils"

interface ShippingOption {
  code: string
  name: string
  price: number
  finalWeight: string
  estimatedDays?: string
}

interface CheckoutFormProps {
  user: any
  userProfile?: {
    rut?: string | null
    full_name?: string | null
    shipping_fee_exempt?: boolean | null
    address?: string | null
    address_number?: string | null
    address_extra?: string | null
    comuna?: string | null
    region?: string | null
  } | null
  b2bClient: any
  b2bPriceMap?: Record<string, number>
  initialNewsletterDiscount?: number | null
}

export function CheckoutForm({ user, userProfile, b2bClient, b2bPriceMap, initialNewsletterDiscount }: CheckoutFormProps) {
  const t = useTranslations("Checkout")
  const { items, updateQuantity, removeItem } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'flow' | 'credit'>('flow')
  const [rutTouched, setRutTouched] = useState(false)
  
  const [formData, setFormData] = useState({
    name: userProfile?.full_name || user?.user_metadata?.full_name || "",
    email: user?.email || "",
    rut: userProfile?.rut || "",
    address: userProfile?.address || "",
    addressNumber: userProfile?.address_number || "",
    addressExtra: userProfile?.address_extra || "",
    comuna: userProfile?.comuna || "",
    region: userProfile?.region || "",
  })

  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [newsletterDiscountPercent, setNewsletterDiscountPercent] = useState<number | null>(initialNewsletterDiscount || null)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [discountCodeInput, setDiscountCodeInput] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; amount: number } | null>(null)
  const [discountError, setDiscountError] = useState("")
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  
  // Login states
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState("")

  const isB2BActive = Boolean(b2bClient?.is_active)
  const isShippingExempt = Boolean(userProfile?.shipping_fee_exempt)
  const getUnitPrice = (item: any) => {
    if (isB2BActive) {
      const b2bPrice = b2bPriceMap?.[item.product.id]
      if (typeof b2bPrice === 'number' && !Number.isNaN(b2bPrice)) {
        return b2bPrice
      }
    }
    return item.product.base_price
  }

  const baseSubtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.product.base_price)
  }, 0)

  const resolvedSubtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * getUnitPrice(item))
  }, 0)

  const b2bSavings = Math.max(0, baseSubtotal - resolvedSubtotal)

  // Calculate total cart weight in kg (from weight_grams)
  const cartWeightKg = items.reduce((sum, item) => {
    const weightGrams = item.product.weight_grams
    return sum + (weightGrams * item.quantity) / 1000
  }, 0)

  const cartDimensions = useMemo(() => {
    const totalVolumeCm3 = items.reduce((sum, item) => {
      const height = Number(item.product.height_cm)
      const width = Number(item.product.width_cm)
      const length = Number(item.product.length_cm)
      const volume = height * width * length
      return sum + (volume * item.quantity)
    }, 0)

    const cubeSideCm = Math.max(1, Math.ceil(Math.cbrt(totalVolumeCm3)))
    return { height: cubeSideCm, width: cubeSideCm, length: cubeSideCm }
  }, [items])

  useEffect(() => {
    if (!isShippingExempt) return
    setSelectedShipping({
      code: "EXENTO_ENVIO",
      name: "Envío exento",
      price: 0,
      finalWeight: String(cartWeightKg),
      estimatedDays: "Exento",
    })
  }, [isShippingExempt, cartWeightKg])

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

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value)
    setFormData(prev => ({ ...prev, rut: formatted }))
    if (formatted.length >= 3) {
      setRutTouched(true)
    }
  }

  const isRutRequired = !userProfile?.rut
  const hasRutValue = Boolean(formData.rut)
  const isRutValid = hasRutValue ? isValidRut(formData.rut) : !isRutRequired
  const showRutError = rutTouched && !isRutValid

  const handleRedeem = (points: number) => {
    setPointsToRedeem(points)
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value
    setFormData((prev) => ({ ...prev, region }))
  }

  const handleComunaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const comuna = e.target.value
    setFormData((prev) => ({ ...prev, comuna }))
  }

  const handleIncrement = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1)
  }

  const handleDecrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1)
    } else {
      removeItem(productId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const rutRequired = !userProfile?.rut
      if (rutRequired && !formData.rut) {
        toast.error(t("messages.rutRequired"))
        setIsSubmitting(false)
        return
      }

      if (formData.rut && !isValidRut(formData.rut)) {
        toast.error("El RUT no es válido")
        setIsSubmitting(false)
        return
      }

      const result = await createOrderAndInitiatePayment({
        items,
        total: resolvedSubtotal,
        customerInfo: formData,
        pointsToRedeem,
        paymentMethod,
        shippingCost: selectedShipping?.price || 0,
        shippingServiceCode: selectedShipping?.code?.toString(),
        shippingServiceName: selectedShipping?.name,
        discountCodeId: appliedDiscount?.id || null,
        discountAmount: appliedDiscount?.amount || 0,
        discountCode: appliedDiscount?.code || null,
      })

      if (result.success && result.redirectUrl) {
        // Use window.location for external URLs (Flow) and internal navigation
        // This is more reliable than Next.js redirect() for external domains
        console.log('[Checkout] Redirecting to:', result.redirectUrl)
        window.location.href = result.redirectUrl
        return // Don't set isSubmitting to false, page is redirecting
      } else if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("messages.error"))
      setIsSubmitting(false)
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) {
      setDiscountError(t("discount.invalid"))
      return
    }

    setIsApplyingDiscount(true)
    setDiscountError("")
    try {
      const itemsForDiscount = items.map(item => ({
        productId: item.product.id,
        subtotal: getUnitPrice(item) * item.quantity,
      }))

      const result = await validateDiscountCode({
        code: discountCodeInput,
        cartTotal: resolvedSubtotal - appliedNewsletterDiscount,
        items: itemsForDiscount,
        email: formData.email,
      })

      if (!result.success || !result.discountCodeId || !result.code || typeof result.discountAmount !== 'number') {
        setAppliedDiscount(null)
        setDiscountError(result.error || t("discount.invalid"))
        return
      }

      setAppliedDiscount({
        id: result.discountCodeId,
        code: result.code,
        amount: result.discountAmount,
      })
      setDiscountCodeInput(result.code)
      setDiscountError("")
    } catch (error) {
      console.error(error)
      setDiscountError(t("discount.invalid"))
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCodeInput("")
    setDiscountError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError("")
    
    try {
      const result = await checkoutLogin(loginEmail, loginPassword)
      
      if (result.success) {
        // Reload page to get user data
        window.location.reload()
      } else {
        setLoginError(result.error || t("login.errorGeneric"))
      }
    } catch (error) {
      setLoginError(t("login.errorGeneric"))
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Newsletter Discount (not applied to B2B fixed pricing)
  const appliedNewsletterDiscount = (!isB2BActive && newsletterDiscountPercent && newsletterDiscountPercent > 0)
    ? Math.floor(resolvedSubtotal * (newsletterDiscountPercent / 100))
    : 0

  const appliedDiscountAmount = appliedDiscount?.amount || 0
  const shippingCost = selectedShipping?.price || 0
  const subtotalAfterDiscounts = Math.max(0, resolvedSubtotal - appliedNewsletterDiscount - appliedDiscountAmount)
  const finalTotal = Math.max(0, subtotalAfterDiscounts - pointsToRedeem + shippingCost)
  const { net: subtotalNet, iva: subtotalIva } = getPriceBreakdown(resolvedSubtotal)
  const { net: finalNet, iva: finalIva } = getPriceBreakdown(finalTotal)

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
    <div className="w-[90%] max-w-7xl mx-auto py-12">
      <div className="mb-8">
        <Link href="/shop" className="text-slate-500 hover:text-calmar-ocean flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors group">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {t("backToShop")}
        </Link>
        <h1 className="text-4xl font-black tracking-tighter mt-4 uppercase">{t("title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          {/* Login Section - Only show when user is not authenticated */}
          {!user && (
            <section className="space-y-4">
              <div 
                onClick={() => setShowLoginForm(!showLoginForm)}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-calmar-ocean/5 to-calmar-mint/5 border border-calmar-ocean/20 rounded-xl cursor-pointer hover:border-calmar-ocean/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean group-hover:bg-calmar-ocean group-hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t("login.title")}</p>
                    <p className="text-xs text-slate-500">{t("login.description")}</p>
                  </div>
                </div>
                <LogIn className={`w-5 h-5 text-calmar-ocean transition-transform ${showLoginForm ? 'rotate-90' : ''}`} />
              </div>
              
              {showLoginForm && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t("login.email")}
                      </label>
                      <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu@email.com"
                        disabled={isLoggingIn}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {t("login.password")}
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={isLoggingIn}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {loginError && (
                      <p className="text-xs text-red-600 font-bold">{loginError}</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoggingIn || !loginEmail || !loginPassword}
                      className="w-full bg-calmar-ocean hover:bg-calmar-ocean-dark text-white font-bold h-11"
                    >
                      {isLoggingIn ? t("login.loading") : t("login.button")}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    {t("login.continueAsGuest")}
                  </p>
                </div>
              )}
            </section>
          )}

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
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("shipping.rut")}</label>
                <Input
                  name="rut"
                  value={formData.rut}
                  onChange={handleRutChange}
                  onBlur={() => setRutTouched(true)}
                  placeholder={t("shipping.rutPlaceholder")}
                  required={isRutRequired}
                  disabled={isSubmitting}
                  inputMode="text"
                  autoComplete="off"
                  aria-invalid={showRutError}
                />
                {showRutError && (
                  <p className="text-xs text-red-600">
                    El RUT no es válido.
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Usa formato chileno (ej: 12.345.678-9).
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Dirección
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ej: Av. Providencia"
                      required
                    />
                  </div>
                  <Input
                    name="addressNumber"
                    value={formData.addressNumber}
                    onChange={handleInputChange}
                    placeholder="Número"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Depto/Oficina
                </label>
                <Input
                  name="addressExtra"
                  value={formData.addressExtra}
                  onChange={handleInputChange}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Región
                </label>
                <select
                  value={formData.region}
                  onChange={handleRegionChange}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-calmar-ocean focus:border-transparent disabled:opacity-50"
                  required
                >
                  <option value="">Selecciona una región</option>
                  {[
                    "Arica y Parinacota",
                    "Tarapacá",
                    "Antofagasta",
                    "Atacama",
                    "Coquimbo",
                    "Valparaíso",
                    "Libertador Bernardo O'Higgins",
                    "Maule",
                    "Ñuble",
                    "Biobío",
                    "La Araucanía",
                    "Los Ríos",
                    "Los Lagos",
                    "Aysén",
                    "Magallanes",
                    "Metropolitana",
                  ].map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Comuna
                </label>
                <Input
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleComunaChange}
                  placeholder="Ej: Providencia"
                  required
                />
              </div>
            </div>

            {/* Shipping Options - shows when region is available */}
            <div className="mt-6">
              {isShippingExempt ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                  Este usuario tiene envío exento. No se cobrará despacho.
                </div>
              ) : (
                <ShippingOptions
                  region={formData.region}
                  weightKg={cartWeightKg}
                  dimensions={cartDimensions}
                  refreshKey={`${formData.address}|${formData.addressNumber}|${formData.addressExtra}|${formData.comuna}|${formData.region}`}
                  selectedOption={selectedShipping}
                  onSelectOption={setSelectedShipping}
                  disabled={isSubmitting}
                />
              )}
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

                  const unitPrice = getUnitPrice(item)
                  const lineTotal = unitPrice * item.quantity
                  const { net: lineNet, iva: lineIva } = getPriceBreakdown(lineTotal)

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
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecrement(item.product.id, item.quantity)}
                            disabled={isSubmitting}
                            className="w-8 h-8 rounded-full border border-slate-300 hover:bg-slate-100 hover:border-calmar-ocean flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <span className="font-bold text-sm min-w-[24px] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(item.product.id, item.quantity)}
                            disabled={isSubmitting}
                            className="w-8 h-8 rounded-full border border-slate-300 hover:bg-slate-100 hover:border-calmar-ocean flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-calmar-ocean text-sm">
                            ${formatClp(lineTotal)}
                          </p>
                          <p className="text-[10px] text-slate-400">IVA incluido</p>
                          <p className="text-[10px] text-slate-400">
                            {`Neto: $${formatClp(lineNet)} · IVA (19%): $${formatClp(lineIva)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <PointsRedemption cartTotal={subtotalAfterDiscounts} onRedeem={handleRedeem} disabled={isSubmitting} />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-600">
                    <Tag className="w-4 h-4 text-calmar-ocean" />
                    {t("discount.title")}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t("discount.placeholder")}
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                      disabled={isApplyingDiscount}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={isApplyingDiscount}
                      className="bg-slate-900 hover:bg-calmar-ocean text-white font-black uppercase text-xs tracking-widest h-11"
                    >
                      {isApplyingDiscount ? t("buttons.processing") : t("discount.apply")}
                    </Button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-600 font-bold">{discountError}</p>
                  )}
                  {appliedDiscount && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800">
                      <span>{t("discount.applied")} {appliedDiscount.code}</span>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-emerald-700 hover:text-emerald-900 underline"
                      >
                        {t("discount.remove")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">{t("summary.subtotal")}</span>
                    <span className="font-bold">${formatClp(resolvedSubtotal)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">IVA incluido</p>
                  <p className="text-[10px] text-slate-400 text-right">
                    {`Neto: $${formatClp(subtotalNet)} · IVA (19%): $${formatClp(subtotalIva)}`}
                  </p>
                </div>
                
                {isB2BActive && b2bSavings > 0 && (
                  <div className="flex justify-between text-sm text-calmar-ocean-dark font-black uppercase tracking-tighter">
                    <span>{t("summary.b2bPricing")}</span>
                    <span>-${b2bSavings.toLocaleString('es-CL')}</span>
                  </div>
                )}
                
                {appliedNewsletterDiscount > 0 && (
                  <div className="flex justify-between text-sm text-calmar-mint-dark font-black uppercase tracking-tighter">
                    <span>{t("summary.newsletterDiscount", { percent: newsletterDiscountPercent ?? 0 })}</span>
                    <span>-${appliedNewsletterDiscount.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {appliedDiscountAmount > 0 && appliedDiscount && (
                  <div className="flex justify-between text-sm text-emerald-700 font-black uppercase tracking-tighter">
                    <span>{t("discount.title")}</span>
                    <span>-{appliedDiscountAmount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                
                {!isB2BActive && appliedNewsletterDiscount === 0 && !newsletterDiscountPercent && (
                  <div className="bg-calmar-mint/10 px-3 py-2 rounded-lg border border-calmar-mint/30">
                    <p className="text-xs text-calmar-ocean-dark font-bold text-center">
                      {t("summary.newsletterCta")}
                    </p>
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
                    {isShippingExempt
                      ? 'Gratis'
                      : shippingCost > 0 
                        ? `$${shippingCost.toLocaleString('es-CL')}` 
                        : formData.region ? 'Calculando...' : 'Ingresa tu región'
                    }
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-900 uppercase">
                  <div className="flex justify-between text-2xl">
                    <span className="font-black tracking-tighter">{t("summary.total")}</span>
                    <span className="font-black text-slate-900">${formatClp(finalTotal)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">IVA incluido</p>
                  <p className="text-[10px] text-slate-400 text-right">
                    {`Neto: $${formatClp(finalNet)} · IVA (19%): $${formatClp(finalIva)}`}
                  </p>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting || (isRutRequired && !isRutValid)}
                className="w-full h-16 bg-slate-900 hover:bg-calmar-ocean text-white text-xl font-black shadow-xl shadow-slate-900/20 transition-all hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting
                  ? t("buttons.processing")
                  : finalTotal === 0
                    ? t("buttons.completeOrder")
                    : paymentMethod === 'credit'
                      ? t("buttons.payWithCredit")
                      : t("buttons.payWithFlow")}
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
