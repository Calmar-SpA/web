"use client"

import { useState, useEffect } from "react"
import { Truck, Loader2, Clock, Home, Building } from "lucide-react"

interface ShippingOption {
  code: string
  name: string
  price: number
  finalWeight: string
  estimatedDays?: string
  deliveryType?: string
  serviceType?: string
}

interface ShippingOptionsProps {
  region: string
  weightKg: number
  dimensions: { height: number; width: number; length: number }
  refreshKey?: string
  selectedOption: ShippingOption | null
  onSelectOption: (option: ShippingOption) => void
  disabled?: boolean
}

export function ShippingOptions({
  region,
  weightKg,
  dimensions,
  refreshKey,
  selectedOption,
  onSelectOption,
  disabled = false,
}: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!region) {
      setOptions([])
      return
    }

    const fetchQuotes = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/shipping/blue-express/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region,
            weightKg,
            dimensions,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al cotizar')
        }

        const shippingOption = {
          code: `BLUE_EXPRESS_${data.size}_${data.zone}`,
          name: 'Blue Express - Envío a domicilio',
          price: data.price,
          finalWeight: String(weightKg),
          estimatedDays: data.estimatedDays || '3-5 días hábiles',
          deliveryType: 'DOMICILIO',
          serviceType: 'BLUE_EXPRESS',
        }

        const shippingOptions = [shippingOption]
        setOptions(shippingOptions)
        
        // Auto-select cheapest domicilio option if none selected
        if (shippingOptions.length > 0 && !selectedOption) {
          // Prefer DOMICILIO delivery, fall back to any option
          const domicilioOptions = shippingOptions.filter((opt: ShippingOption) => 
            opt.deliveryType === 'DOMICILIO'
          )
          const optionsToConsider = domicilioOptions.length > 0 ? domicilioOptions : shippingOptions
          
          const cheapest = optionsToConsider.reduce((min: ShippingOption, opt: ShippingOption) => 
            opt.price < min.price ? opt : min
          , optionsToConsider[0])
          onSelectOption(cheapest)
        }
      } catch (err: any) {
        setError(err.message)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [region, weightKg, dimensions, refreshKey])

  if (!region) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Calculando opciones de envío...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm">
        {error}
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl text-amber-700 text-sm border border-amber-200">
        No se encontraron opciones de envío para esta ubicación. Por favor, contacta con nosotros si crees que esto es un error.
      </div>
    )
  }

  // Get delivery icon based on type
  const DeliveryIcon = ({ type }: { type?: string }) => {
    if (type === 'AGENCIA') return <Building className="w-4 h-4" />
    return <Home className="w-4 h-4" />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
        <Truck className="w-4 h-4" />
        <span>Método de envío</span>
      </div>
      
      <div className="grid gap-3">
        {options.map((option) => (
          <label
            key={option.code}
            className={`relative flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
              selectedOption?.code === option.code
                ? 'border-calmar-ocean bg-calmar-ocean/5 ring-1 ring-calmar-ocean'
                : 'border-slate-200 hover:border-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="shipping"
              value={option.code}
              checked={selectedOption?.code === option.code}
              onChange={() => !disabled && onSelectOption(option)}
              disabled={disabled}
              className="hidden"
            />
            <div className="flex-1">
              <p className="font-bold text-sm flex items-center gap-2">
                <DeliveryIcon type={option.deliveryType} />
                {option.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {option.estimatedDays || 'Consultar'}
                </span>
                {option.deliveryType && (
                  <>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {option.deliveryType === 'DOMICILIO' ? 'Entrega a domicilio' : 'Retiro en agencia'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-calmar-ocean text-lg">
                ${option.price.toLocaleString('es-CL')}
              </p>
            </div>
            <div className={`ml-3 w-5 h-5 rounded-full border-4 ${
              selectedOption?.code === option.code ? 'border-calmar-ocean' : 'border-slate-300'
            }`} />
          </label>
        ))}
      </div>
    </div>
  )
}
