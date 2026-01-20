import Link from 'next/link'
import { Button, Input } from '@calmar/ui'

type Category = {
  id: string
  name: string
  color?: string | null
  is_active?: boolean | null
}

type PurchaseFormValues = {
  category_id?: string | null
  description?: string | null
  net_amount?: number | null
  tax_amount?: number | null
  invoice_number?: string | null
  purchase_date?: string | null
  payment_status?: string | null
  payment_method?: string | null
  notes?: string | null
}

type PurchaseFormProps = {
  categories: Category[]
  action: (formData: FormData) => Promise<void>
  submitLabel: string
  defaultValues?: PurchaseFormValues
  showCancel?: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

export function PurchaseForm({
  categories,
  action,
  submitLabel,
  defaultValues,
  showCancel = true,
}: PurchaseFormProps) {
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoría *</label>
        <select
          name="category_id"
          required
          defaultValue={defaultValues?.category_id ?? ''}
          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción *</label>
        <Input name="description" defaultValue={defaultValues?.description ?? ''} required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monto neto (CLP) *</label>
        <Input name="net_amount" type="number" min="0" step="0.01" defaultValue={defaultValues?.net_amount ?? 0} required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IVA (CLP)</label>
        <Input name="tax_amount" type="number" min="0" step="0.01" defaultValue={defaultValues?.tax_amount ?? 0} />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de compra *</label>
        <Input name="purchase_date" type="date" defaultValue={defaultValues?.purchase_date ?? today()} required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Número de factura</label>
        <Input name="invoice_number" defaultValue={defaultValues?.invoice_number ?? ''} />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado de pago</label>
        <select
          name="payment_status"
          defaultValue={defaultValues?.payment_status ?? 'pending'}
          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="pending">Pendiente</option>
          <option value="partial">Parcial</option>
          <option value="paid">Pagado</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Método de pago</label>
        <select
          name="payment_method"
          defaultValue={defaultValues?.payment_method ?? ''}
          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="">Selecciona</option>
          <option value="transfer">Transferencia</option>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
        <textarea
          name="notes"
          defaultValue={defaultValues?.notes ?? ''}
          className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-calmar-ocean/20 transition-all text-sm"
          placeholder="Observaciones de la compra..."
        />
      </div>

      <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {showCancel && (
          <Link href="/purchases" className="w-full sm:w-auto">
            <Button variant="outline" className="font-bold uppercase text-xs tracking-widest px-8 h-11 w-full">
              Cancelar
            </Button>
          </Link>
        )}
        <Button className="bg-[#1d504b] hover:bg-[#153f3b] text-white font-black uppercase text-xs tracking-widest px-8 h-11 w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
