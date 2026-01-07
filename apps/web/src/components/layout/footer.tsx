'use client'

import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { NewsletterForm } from '@/components/newsletter-form'

export function Footer() {
  const t = useTranslations('Footer')
  const navigationT = useTranslations('Navigation')

  return (
    <footer className="bg-slate-900 text-white py-12 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <span className="text-2xl font-black italic tracking-tighter text-calmar-ocean">CALMAR</span>
          <p className="mt-4 text-slate-400 text-sm max-w-xs leading-relaxed">
            {t('description')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-calmar-mint">{t('links')}</h4>
          <nav className="flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/shop" className="hover:text-white transition-colors">{navigationT('shop')}</Link>
            <Link href="/about" className="hover:text-white transition-colors">{navigationT('about')}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{navigationT('contact')}</Link>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-calmar-mint">{t('newsletter.title')}</h4>
          <NewsletterForm />
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        {t('rights')}
      </div>
    </footer>
  )
}
