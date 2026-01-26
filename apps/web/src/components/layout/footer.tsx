'use client'

import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { NewsletterForm } from '@/components/newsletter-form'
import Image from 'next/image'

export function Footer() {
  const t = useTranslations('Footer')
  const navigationT = useTranslations('Navigation')

  return (
    <footer className="bg-primary text-primary-foreground py-12 border-t border-white/10">
      <div className="w-[90%] max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
            alt="CALMAR" 
            width={150} 
            height={50} 
            className="h-12 w-auto object-contain invert"
          />
          <p className="mt-4 text-white text-sm max-w-xs leading-relaxed">
            {t('description')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-white">{t('links')}</h4>
          <nav className="flex flex-col gap-2 text-sm text-white/70">
            <Link href="/shop" className="hover:text-white transition-colors">{navigationT('shop')}</Link>
            <Link href="/about" className="hover:text-white transition-colors">{navigationT('about')}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{navigationT('contact')}</Link>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-white">Legal</h4>
          <nav className="flex flex-col gap-2 text-sm text-white/70">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-white">{t('newsletter.title')}</h4>
          <NewsletterForm />
        </div>
      </div>
      <div className="w-[90%] max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-[10px] text-white/50 font-bold uppercase tracking-widest">
        {t('rights')}
      </div>
    </footer>
  )
}
