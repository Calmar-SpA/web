import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { RegisterFormClient } from './RegisterFormClient'

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Login')

  const prefill = {
    type: resolvedSearchParams?.type || '',
    company_name: resolvedSearchParams?.company_name || '',
    contact_name: resolvedSearchParams?.contact_name || '',
    contact_role: resolvedSearchParams?.contact_role || '',
    email: resolvedSearchParams?.email || '',
    phone: resolvedSearchParams?.phone || '',
    tax_id: resolvedSearchParams?.tax_id || '',
    address: resolvedSearchParams?.address || '',
    city: resolvedSearchParams?.city || '',
    comuna: resolvedSearchParams?.comuna || '',
    business_activity: resolvedSearchParams?.business_activity || '',
    shipping_address: resolvedSearchParams?.shipping_address || '',
    notes: resolvedSearchParams?.notes || ''
  }

  const translations = {
    email: t('email'),
    fullName: t('fullName'),
    rut: t('rut'),
    password: t('password'),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-calmar-ocean/20 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-calmar-mint/20 blur-[120px] rounded-full -ml-48 -mb-48" />

      <Card className="w-full max-w-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-calmar-ocean/20 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center flex flex-col items-center">
          <Image
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp"
            alt="CALMAR"
            width={180}
            height={60}
            className="h-16 w-auto object-contain mb-2 dark:invert"
          />
          <CardTitle className="text-xl font-black uppercase tracking-tight">Crear cuenta</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            Tus datos ya estan completos, solo crea una contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RegisterFormClient 
            locale={locale}
            prefill={prefill}
            translations={translations}
          />
        </CardContent>
        <CardFooter>
          <p className="text-[10px] text-center w-full text-slate-400 font-bold uppercase tracking-widest">
            {t('terms')}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
