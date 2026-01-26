'use client'

import { useActionState } from 'react'
import { resetPassword } from './actions'
import { Button, Input } from '@calmar/ui'

interface ResetPasswordFormClientProps {
  locale: string
  translations: {
    password: string
    confirmPassword: string
    submit: string
    errorGeneric: string
    errorMismatch: string
    errorTooShort: string
  }
}

export function ResetPasswordFormClient({
  locale,
  translations: t
}: ResetPasswordFormClientProps) {
  const [state, action, isPending] = useActionState(resetPassword, null)

  const errorMessage = (() => {
    if (state?.error === 'too_short') return t.errorTooShort
    if (state?.error === 'mismatch') return t.errorMismatch
    if (state?.error === 'generic') return t.errorGeneric
    return null
  })()

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.password}</label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          autoComplete="new-password" 
          required 
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="confirm_password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.confirmPassword}</label>
        <Input 
          id="confirm_password" 
          name="confirm_password" 
          type="password" 
          autoComplete="new-password" 
          required 
        />
      </div>
      {errorMessage && (
        <p className="text-xs font-semibold text-red-500">{errorMessage}</p>
      )}
      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12"
      >
        {isPending ? '...' : t.submit}
      </Button>
    </form>
  )
}
