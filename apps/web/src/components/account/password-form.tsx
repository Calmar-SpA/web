'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button, Input } from '@calmar/ui'
import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionState } from '@/app/[locale]/account/settings/actions'
import { toast } from 'sonner'

interface PasswordFormProps {
  locale: string
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>
}

export function PasswordForm({ locale, action }: PasswordFormProps) {
  const t = useTranslations('Account.settings')
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Contraseña actualizada')
      formRef.current?.reset()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("changePassword")}</label>
        <Input name="new_password" type="password" placeholder="••••••••" className="bg-slate-50" required />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirmar contraseña</label>
        <Input name="confirm_password" type="password" placeholder="••••••••" className="bg-slate-50" required />
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-slate-900 hover:bg-calmar-ocean text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          {isPending ? '...' : t("changePassword")}
        </Button>
      </div>
    </form>
  )
}
