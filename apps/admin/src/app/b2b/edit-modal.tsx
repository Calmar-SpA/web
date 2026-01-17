'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@calmar/ui'
import { X, Edit3, DollarSign, Calendar, Search } from 'lucide-react'
import { updateB2BClient } from './actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatClp, getGrossFromNet, getPriceBreakdown } from '@calmar/utils'

interface EditModalProps {
  client: {
    id: string
    company_name: string
    credit_limit: number
    payment_terms_days: number
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditModal({
  client,
  isOpen,
  onClose,
  onSuccess
}: EditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [formData, setFormData] = useState({
    credit_limit: client.credit_limit,
    payment_terms_days: client.payment_terms_days
  })
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; base_price: number }[]>([])
  const [priceOverrides, setPriceOverrides] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const loadProducts = async () => {
      setIsLoadingProducts(true)
      const supabase = createClient()
      const [{ data: productsData, error: productsError }, { data: pricesData, error: pricesError }] = await Promise.all([
        supabase.from('products').select('id, name, sku, base_price').order('name', { ascending: true }),
        supabase.from('b2b_product_prices').select('product_id, fixed_price').eq('b2b_client_id', client.id)
      ])

      if (productsError || pricesError) {
        console.error('Error loading products:', productsError || pricesError)
        toast.error('No se pudieron cargar los productos')
      } else {
        setProducts(productsData || [])
        const overrides: Record<string, string> = {}
        ;(pricesData || []).forEach(price => {
          overrides[price.product_id] = String(price.fixed_price)
        })
        setPriceOverrides(overrides)
        setSearchTerm('')
      }

      setIsLoadingProducts(false)
    }

    loadProducts()
  }, [isOpen, client.id])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: Number(value) }))
  }

  const handlePriceChange = (productId: string, value: string) => {
    setPriceOverrides(prev => ({ ...prev, [productId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const fixedPrices = Object.entries(priceOverrides)
        .map(([productId, value]) => ({ productId, fixedPrice: Number(value) }))
        .filter(price => Number.isFinite(price.fixedPrice) && price.fixedPrice > 0)

      const result = await updateB2BClient(client.id, formData, fixedPrices)
      if (result.success) {
        toast.success('Cambios guardados con éxito')
        onSuccess()
        onClose()
      }
    } catch (error) {
      toast.error('Error al guardar los cambios')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[70vh] shadow-2xl border-none flex flex-col">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl flex flex-row items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Edit3 className="h-6 w-6 text-calmar-mint" />
            <CardTitle className="text-xl uppercase tracking-tight">Editar B2B</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 mb-6">
            Actualiza las condiciones comerciales para <strong className="text-slate-900">{client.company_name}</strong>.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Línea de Crédito (CLP)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="credit_limit" 
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className="pl-10" 
                  required 
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Días de Pago</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  name="payment_terms_days" 
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  className="pl-10" 
                  required 
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precios B2B por producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o SKU"
                  className="bg-white pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                {isLoadingProducts ? (
                  <p className="text-xs text-slate-400 text-center py-6">Cargando productos...</p>
                ) : products.filter(product => {
                  const query = searchTerm.toLowerCase()
                  return product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query)
                }).map(product => {
                  const { net, iva } = getPriceBreakdown(Number(product.base_price))
                  const netOverride = Number(priceOverrides[product.id])
                  const hasOverride = Number.isFinite(netOverride) && netOverride > 0
                  const grossOverride = hasOverride ? getGrossFromNet(netOverride) : 0
                  const ivaOverride = hasOverride ? Math.max(0, grossOverride - netOverride) : 0
                  return (
                    <div key={product.id} className="flex flex-col gap-2 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{product.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">SKU {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500">${formatClp(Number(product.base_price))}</p>
                          <p className="text-[10px] text-slate-400">IVA incluido</p>
                          <p className="text-[10px] text-slate-400">
                            {`Neto: $${formatClp(net)} · IVA (19%): $${formatClp(iva)}`}
                          </p>
                        </div>
                      </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Precio B2B Neto (CLP)"
                        value={priceOverrides[product.id] ?? ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 text-[10px] uppercase font-bold tracking-widest"
                        onClick={() => handlePriceChange(product.id, '')}
                      >
                        Base
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {hasOverride
                        ? `Neto: $${formatClp(netOverride)} · IVA (19%): $${formatClp(ivaOverride)} · Total: $${formatClp(grossOverride)}`
                        : 'Ingresa un neto para ver IVA y total.'}
                    </p>
                    </div>
                  )
                })}
                {!isLoadingProducts && products.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No hay productos disponibles.</p>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Si no defines un precio, se usará el precio base del producto.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-calmar-ocean text-white h-12 text-sm font-bold uppercase mt-6 shadow-xl gap-2 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
