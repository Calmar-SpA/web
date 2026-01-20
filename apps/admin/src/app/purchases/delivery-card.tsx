import { Button, Input } from '@calmar/ui'
import { addDeliveryPhoto, deleteDelivery, updateDelivery } from './actions'

type Prospect = {
  id: string
  company_name?: string | null
  contact_name?: string | null
  tax_id?: string | null
}

type Delivery = {
  id: string
  purchase_id: string
  prospect_id: string | null
  item_type: string
  quantity: number
  delivery_address: string | null
  delivery_status: string
  scheduled_date: string | null
  delivered_date: string | null
  photo_urls: string[] | null
  notes: string | null
}

type DeliveryCardProps = {
  delivery: Delivery
  prospects: Prospect[]
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CL')
}

export function DeliveryCard({ delivery, prospects }: DeliveryCardProps) {
  const deliveryLabel = {
    pending: 'Pendiente',
    scheduled: 'Programada',
    delivered: 'Entregada',
    partial: 'Parcial',
  }[delivery.delivery_status] ?? delivery.delivery_status

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
            {delivery.item_type}
          </h3>
          <p className="text-xs text-slate-500">
            Cantidad: <span className="font-semibold text-slate-700">{delivery.quantity}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {deliveryLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Programada: {formatDate(delivery.scheduled_date)}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Entregada: {formatDate(delivery.delivered_date)}
          </span>
        </div>
      </div>

      <div className="text-sm text-slate-600">
        {delivery.delivery_address || 'Sin dirección registrada'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form action={updateDelivery.bind(null, delivery.id, delivery.purchase_id)} className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Actualizar entrega</h4>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente *</label>
            <select
              name="prospect_id"
              required
              defaultValue={delivery.prospect_id ?? ''}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="">Selecciona un cliente</option>
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.company_name || prospect.contact_name || 'Sin nombre'} {prospect.tax_id ? `(${prospect.tax_id})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Material *</label>
            <Input name="item_type" defaultValue={delivery.item_type} required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cantidad *</label>
            <Input name="quantity" type="number" min="1" defaultValue={delivery.quantity} required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dirección de entrega</label>
            <Input name="delivery_address" defaultValue={delivery.delivery_address ?? ''} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</label>
            <select
              name="delivery_status"
              defaultValue={delivery.delivery_status}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="pending">Pendiente</option>
              <option value="scheduled">Programada</option>
              <option value="delivered">Entregada</option>
              <option value="partial">Parcial</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Programación</label>
              <Input name="scheduled_date" type="date" defaultValue={delivery.scheduled_date ?? ''} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entrega</label>
              <Input name="delivered_date" type="date" defaultValue={delivery.delivered_date ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notas</label>
            <textarea
              name="notes"
              defaultValue={delivery.notes ?? ''}
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="uppercase text-[10px] tracking-widest">
              Guardar cambios
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <form action={addDeliveryPhoto.bind(null, delivery.id, delivery.purchase_id)} className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Agregar foto</h4>
            <Input name="photo_url" placeholder="https://..." />
            <Button variant="outline" className="uppercase text-[10px] tracking-widest">
              Agregar URL
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Fotos registradas</h4>
            {delivery.photo_urls && delivery.photo_urls.length > 0 ? (
              <div className="space-y-1 text-xs text-slate-600">
                {delivery.photo_urls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block truncate hover:text-calmar-ocean">
                    {url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin fotos registradas.</p>
            )}
          </div>

          <form action={deleteDelivery.bind(null, delivery.id, delivery.purchase_id)}>
            <Button className="bg-red-600 hover:bg-red-700 text-white uppercase text-[10px] tracking-widest w-full">
              Eliminar entrega
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
