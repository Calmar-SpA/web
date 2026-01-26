import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { ForgotPasswordFormClient } from './ForgotPasswordFormClient'

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ForgotPassword')
  
  const translations = {
    email: t('email'),
    submit: t('submit'),
    success: t('success'),
    backToLogin: t('backToLogin'),
    errorGeneric: t('errorGeneric'),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      {/* Ocean Blur Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-calmar-ocean/20 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-calmar-mint/20 blur-[120px] rounded-full -ml-48 -mb-48" />

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-calmar-ocean/20 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center flex flex-col items-center">
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
            alt="CALMAR" 
            width={180} 
            height={60} 
            className="h-16 w-auto object-contain mb-2 dark:invert"
          />
          <CardTitle className="text-xl font-black uppercase tracking-tight">{t('title')}</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordFormClient 
            locale={locale}
            translations={translations}
          />
        </CardContent>
      </Card>
    </div>
  )
}
