'use client'

import { useState, useMemo, useActionState, useEffect } from 'react'
import { Button, Input, RutInput } from '@calmar/ui'
import { useTranslations } from 'next-intl'
import { isValidRut, formatRut } from '@calmar/utils'
import { Pencil, X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export type ActionState = {
  success: boolean
  error?: string | null
  message?: string | null
  values?: Record<string, string>
}

interface PersonalDataCardProps {
  locale: string
  fullName: string
  email: string
  rut: string
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>
}

export function PersonalDataCard({ locale, fullName, email, rut, action }: PersonalDataCardProps) {
  const t = useTranslations('Account.settings')
  const [state, formAction, isPending] = useActionState(action, null)
  const [isEditing, setIsEditing] = useState(false)
  const [rutValue, setRutValue] = useState(rut)
  const [touched, setTouched] = useState(false)
  
  // Cerrar edición cuando la acción es exitosa
  useEffect(() => {
    if (state?.success) {
      setIsEditing(false)
      setTouched(false)
    }
  }, [state])

  const isRutValid = useMemo(() => {
    if (!rutValue) return false
    return isValidRut(rutValue)
  }, [rutValue])

  const showRutError = touched && !isRutValid

  const handleCancel = () => {
    setIsEditing(false)
    setRutValue(rut)
    setTouched(false)
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Datos Personales</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="rounded-full font-bold uppercase text-[10px] tracking-widest text-calmar-ocean hover:bg-calmar-ocean/10 flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("fullName")}</label>
            <p className="font-bold text-slate-900">{fullName || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("email")}</label>
            <p className="font-bold text-slate-900">{email}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("rut")}</label>
            <p className="font-bold text-slate-900">{rut ? formatRut(rut) : '—'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-calmar-ocean shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Datos Personales</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 flex items-center gap-1.5"
        >
          <X className="w-3 h-3" />
          Cancelar
        </Button>
      </div>

      <form
        action={formAction}
        onSubmit={(event) => {
          if (!isValidRut(rutValue)) {
            event.preventDefault()
            setTouched(true)
            return
          }
          setTouched(true)
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="redirect_to" value="account" />
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("fullName")}</label>
            <Input 
              name="full_name" 
              defaultValue={fullName} 
              placeholder="Tu nombre completo"
              className="bg-slate-50 border-slate-200 focus:border-calmar-ocean focus:ring-calmar-ocean/20" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("email")}</label>
            <Input 
              name="email" 
              type="email" 
              defaultValue={email} 
              placeholder="tu@email.com"
              className="bg-slate-50 border-slate-200 focus:border-calmar-ocean focus:ring-calmar-ocean/20" 
            />
            <p className="text-[10px] text-slate-500">
              Si cambias tu correo, necesitarás confirmarlo.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t("rut")}</label>
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
              className="bg-slate-50 border-slate-200 focus:border-calmar-ocean focus:ring-calmar-ocean/20"
            />
            {showRutError && (
              <p className="text-[10px] text-red-700">
                El RUT no es válido.
              </p>
            )}
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              Si cambias tu RUT, podrías perder beneficios asociados.
            </p>
          </div>
        </div>
        
        {/* Mensaje de error */}
        {state?.error && (
          <div className="mt-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">{state.error}</p>
          </div>
        )}
        
        {/* Mensaje de éxito */}
        {state?.success && (
          <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">{state.message}</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="rounded-full font-bold uppercase text-[10px] tracking-widest bg-calmar-ocean hover:bg-calmar-primary text-white flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {t('update')}
          </Button>
        </div>
      </form>
    </div>
  )
}
