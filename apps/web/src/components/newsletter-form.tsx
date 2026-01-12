'use client'

import { useActionState } from 'react'
import { subscribeToNewsletter } from '@/actions/newsletter'
import { Button, Input } from '@calmar/ui'
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/use-cart'

export function NewsletterForm() {
  const t = useTranslations('Footer.newsletter')
  const { setNewsletterDiscount } = useCart()
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, { success: false, message: '' })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.message === 'subscribed') {
      toast.success(t('success'))
      setNewsletterDiscount(10) // Set 10% discount immediately on success
      formRef.current?.reset()
    } else if (state.message === 'already_subscribed') {
      toast.info(t('alreadySubscribed'))
      formRef.current?.reset()
    } else if (state.message === 'server_error') {
      toast.error(t('error'))
    } else if (state.message === 'invalid_email') {
      toast.error(t('invalidEmail'))
    }
  }, [state, t])

  return (
    <form ref={formRef} action={formAction} className="flex gap-2 group relative">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-calmar-mint transition-colors" />
        <input 
          name="email"
          type="email"
          required
          placeholder={t('placeholder')} 
          className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-calmar-mint transition-all"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-calmar-ocean hover:bg-calmar-ocean-dark text-white font-bold text-xs uppercase tracking-wider min-w-[80px]"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('button')}
      </Button>
    </form>
  )
}
