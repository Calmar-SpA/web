"use client"

import { useMemo, useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@calmar/ui"
import { Tag } from "lucide-react"
import { createDiscountCodeAction, deleteDiscountCodeAction, updateDiscountCodeAction } from "./actions"
import { toast } from "sonner"

interface ProductOption {
  id: string
  name: string
  sku: string
  is_active: boolean
}

interface UserOption {
  id: string
  email: string
  full_name?: string | null
  role: string
}

interface DiscountCodeFormProps {
  isNew: boolean
  codeId?: string | null
  initialData?: any
  initialProductIds: string[]
  initialUserIds: string[]
  products: ProductOption[]
  users: UserOption[]
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0]
}

const toNumberOrNull = (value: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function DiscountCodeForm({
  isNew,
  codeId,
  initialData,
  initialProductIds,
  initialUserIds,
  products,
  users,
}: DiscountCodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [code, setCode] = useState(initialData?.code || "")
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [discountType, setDiscountType] = useState(initialData?.discount_type || "percentage")
  const [discountValue, setDiscountValue] = useState(initialData?.discount_value?.toString() || "")
  const [maxDiscount, setMaxDiscount] = useState(initialData?.max_discount_amount?.toString() || "")
  const [minPurchase, setMinPurchase] = useState(initialData?.min_purchase_amount?.toString() || "")
  const [usageLimit, setUsageLimit] = useState(initialData?.usage_limit?.toString() || "")
  const [perUserLimit, setPerUserLimit] = useState(initialData?.per_user_limit?.toString() || "1")
  const [firstPurchaseOnly, setFirstPurchaseOnly] = useState(Boolean(initialData?.first_purchase_only))
  const [startsAt, setStartsAt] = useState(toDateInputValue(initialData?.starts_at))
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(initialData?.expires_at))
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialProductIds)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialUserIds)
  const [productSearch, setProductSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products
    const term = productSearch.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)
    )
  }, [products, productSearch])

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users
    const term = userSearch.toLowerCase()
    return users.filter(user =>
      user.email.toLowerCase().includes(term) || user.full_name?.toLowerCase().includes(term)
    )
  }, [users, userSearch])

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSave = async () => {
    if (!code || !name || !discountValue) {
      toast.error("Completa código, nombre y valor del descuento")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        code,
        name,
        description,
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_discount_amount: toNumberOrNull(maxDiscount),
        min_purchase_amount: toNumberOrNull(minPurchase),
        usage_limit: toNumberOrNull(usageLimit),
        per_user_limit: toNumberOrNull(perUserLimit) ?? 1,
        first_purchase_only: firstPurchaseOnly,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: isActive,
      }

      const result = isNew
        ? await createDiscountCodeAction(payload, selectedProductIds, selectedUserIds)
        : await updateDiscountCodeAction(codeId!, payload, selectedProductIds, selectedUserIds)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Código guardado correctamente")
      if (isNew && 'id' in result && result.id) {
        window.location.href = `/discount-codes/${result.id}`
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar el código")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!codeId) return
    if (!window.confirm("¿Seguro que deseas eliminar este código?")) return
    setIsSubmitting(true)
    try {
      const result = await deleteDiscountCodeAction(codeId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Código eliminado")
      window.location.href = "/discount-codes"
    } catch (error) {
      console.error(error)
      toast.error("Error al eliminar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-calmar-ocean" />
            {isNew ? "Crear código" : "Editar código"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Código</label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Nombre interno</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Tipo</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="percentage">Porcentaje</option>
                <option value="fixed_amount">Monto fijo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Valor</label>
              <Input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Tope máximo</label>
              <Input
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Solo porcentaje"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Compra mínima</label>
              <Input value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Límite de usos</label>
              <Input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Límite por usuario</label>
              <Input value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Inicio</label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Expiración</label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={firstPurchaseOnly}
                onChange={(e) => setFirstPurchaseOnly(e.target.checked)}
              />
              Solo primera compra
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Código activo
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Restricción por Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar producto por nombre o SKU"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-3">
            {filteredProducts.map(product => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                />
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-slate-400">({product.sku})</span>
              </label>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-xs text-slate-500">No hay productos con ese filtro</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Si no seleccionas productos, el código aplicará a todo el carrito.
          </p>
        </CardContent>
      </Card>

      <Card className="border-calmar-ocean/10 shadow-sm">
        <CardHeader>
          <CardTitle>Restricción por Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar usuario por nombre o email"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-3">
            {filteredUsers.map(user => (
              <label key={user.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                />
                <span className="font-medium">{user.full_name || "Sin nombre"}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </label>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-xs text-slate-500">No hay usuarios con ese filtro</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Si no seleccionas usuarios, el código será válido para todos.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-calmar-ocean text-white font-black uppercase text-xs tracking-widest px-6 h-12"
        >
          {isSubmitting ? "Guardando..." : "Guardar código"}
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold uppercase text-xs tracking-widest h-12"
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  )
}
