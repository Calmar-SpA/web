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
    <form ref={formRef} action={formAction} className="flex flex-col sm:flex-row gap-3 group relative">
      <div className="relative flex-1">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-calmar-mint transition-colors" />
        <input 
          name="email"
          type="email"
          required
          placeholder={t('placeholder')} 
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 h-12 text-sm text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-calmar-mint/30 focus:ring-0 transition-all outline-none"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-calmar-mint hover:bg-calmar-mint/90 text-primary font-black text-xs uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-calmar-mint/10 hover:shadow-calmar-mint/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('button')}
      </Button>
    </form>
  )
}
