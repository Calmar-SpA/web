'use client'

import { useMemo, useState, useActionState, useEffect } from 'react'
import { Button, Input, RutInput } from '@calmar/ui'
import { useTranslations } from 'next-intl'
import { isValidRut } from '@calmar/utils'
import { ActionState } from '@/app/[locale]/account/settings/actions'
import { toast } from 'sonner'

interface ProfileFormProps {
  locale: string
  fullName: string
  email: string
  rut: string
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>
}

export function ProfileForm({ locale, fullName, email, rut, action }: ProfileFormProps) {
  const t = useTranslations('Account.settings')
  const [state, formAction, isPending] = useActionState(action, null)
  
  const [rutValue, setRutValue] = useState(state?.values?.rut || rut)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Perfil actualizado')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const isRutValid = useMemo(() => {
    if (!rutValue) return false
    return isValidRut(rutValue)
  }, [rutValue])

  const showRutError = touched && !isRutValid

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirect_to" value="account/settings" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('fullName')}</label>
          <Input 
            name="full_name" 
            defaultValue={state?.values?.full_name || fullName} 
            className="bg-slate-50" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('email')}</label>
          <Input 
            name="email" 
            type="email" 
            defaultValue={state?.values?.email || email} 
            className="bg-slate-50" 
          />
          <p className="text-xs text-slate-500">
            Si cambias tu correo, necesitarás confirmarlo para finalizar.
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('rut')}</label>
          <RutInput
            name="rut"
            required
            value={rutValue}
            onChange={(e) => {
              setRutValue(e.target.value)
              if (e.target.value.length >= 3) {
                setTouched(true)
              }
            }}
            onBlur={() => setTouched(true)}
            className="bg-slate-50"
          />
          {showRutError && (
            <p className="text-xs text-red-700">
              El RUT no es válido.
            </p>
          )}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Si cambias tu RUT, podrías perder historial o beneficios asociados a tu cuenta.
          </p>
          <p className="text-xs text-slate-500">{t('rutHelp')}</p>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={!isRutValid || isPending}
          className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {isPending ? '...' : t('update')}
        </Button>
      </div>
    </form>
  )
}
