'use client'

import { useActionState } from 'react'
import { Button, Input, RutInput } from '@calmar/ui'
import { signup, type ActionState } from '../login/actions'
import { Loader2, AlertCircle } from 'lucide-react'

interface RegisterFormClientProps {
  locale: string
  prefill: {
    type: string
    company_name: string
    contact_name: string
    contact_role: string
    email: string
    phone: string
    tax_id: string
    address: string
    city: string
    comuna: string
    business_activity: string
    requesting_rut: string
    shipping_address: string
    notes: string
  }
  translations: {
    email: string
    fullName: string
    rut: string
    password: string
  }
}

export function RegisterFormClient({ locale, prefill, translations }: RegisterFormClientProps) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(signup, null)

  const readOnlyClass =
    'bg-slate-100 text-slate-700 border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0'

  const getErrorMessage = (error: string | null | undefined) => {
    if (!error) return null
    switch (error) {
      case 'full_name':
        return 'Debes ingresar nombre y apellido'
      case 'rut':
        return 'El RUT ingresado no es válido'
      case 'email_exists':
        return 'Este correo ya está registrado'
      case 'weak_password':
        return 'La contraseña debe tener al menos 8 caracteres'
      case 'email_invalid':
        return 'El correo electrónico no es válido'
      case 'rut_exists':
        return 'Este RUT ya está asociado a otra cuenta'
      default:
        return 'Ocurrió un error al crear la cuenta'
    }
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Tipo
          </label>
          <Input id="type" defaultValue={prefill.type} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {translations.email}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={prefill.email}
            readOnly
            required
            className={readOnlyClass}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {translations.fullName}
          </label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={prefill.contact_name}
            readOnly
            required
            className={readOnlyClass}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {translations.rut}
          </label>
          <RutInput
            id="rut"
            name="rut"
            defaultValue={prefill.tax_id}
            readOnly
            required
            className={readOnlyClass}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="company_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Razón Social
          </label>
          <Input id="company_name" defaultValue={prefill.company_name} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="contact_role" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Cargo del Contacto
          </label>
          <Input id="contact_role" defaultValue={prefill.contact_role} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Teléfono
          </label>
          <Input id="phone" defaultValue={prefill.phone} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Dirección empresa
          </label>
          <Input id="address" defaultValue={prefill.address} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Ciudad
          </label>
          <Input id="city" defaultValue={prefill.city} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="comuna" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Comuna
          </label>
          <Input id="comuna" defaultValue={prefill.comuna} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="business_activity" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Giro
          </label>
          <Input id="business_activity" defaultValue={prefill.business_activity} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="requesting_rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            RUT solicita
          </label>
          <Input id="requesting_rut" defaultValue={prefill.requesting_rut} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="shipping_address" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Dirección de despacho
          </label>
          <Input id="shipping_address" defaultValue={prefill.shipping_address} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Notas
          </label>
          <Input id="notes" defaultValue={prefill.notes} readOnly className={readOnlyClass} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {translations.password}
          </label>
          <Input id="password" name="password" type="password" required />
        </div>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-medium">{getErrorMessage(state.error)}</p>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12 flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Crear cuenta
      </Button>
    </form>
  )
}
