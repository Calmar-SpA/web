'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from './actions'
import { Button, Input } from '@calmar/ui'
import { Link } from '@/navigation'

interface ForgotPasswordFormClientProps {
  locale: string
  translations: {
    email: string
    submit: string
    success: string
    backToLogin: string
    errorGeneric: string
  }
}

export function ForgotPasswordFormClient({
  locale,
  translations: t
}: ForgotPasswordFormClientProps) {
  const [state, action, isPending] = useActionState(requestPasswordReset, null)

  if (state?.success) {
    return (
      <div className="grid gap-6 text-center">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-tight">
            {t.success}
          </p>
        </div>
        <Button asChild variant="outline" className="h-12 border-slate-200 font-bold uppercase text-xs tracking-widest">
          <Link href="/login">
            {t.backToLogin}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.email}</label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="hola@ejemplo.cl" 
          autoComplete="email" 
          required 
        />
      </div>
      {state?.error && (
        <p className="text-xs font-semibold text-red-500">{t.errorGeneric}</p>
      )}
      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12"
      >
        {isPending ? '...' : t.submit}
      </Button>
      <Link 
        href="/login" 
        className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        {t.backToLogin}
      </Link>
    </form>
  )
}
