import { signup } from '../login/actions'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, RutInput } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'

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
    requesting_rut: resolvedSearchParams?.requesting_rut || '',
    shipping_address: resolvedSearchParams?.shipping_address || '',
    notes: resolvedSearchParams?.notes || ''
  }

  const readOnlyClass =
    'bg-slate-100 text-slate-700 border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0'

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
          <form className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Tipo
                </label>
                <Input id="type" defaultValue={prefill.type} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('email')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={prefill.email}
                  readOnly
                  required
                  className={readOnlyClass}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('fullName')}
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={prefill.contact_name}
                  readOnly
                  required
                  className={readOnlyClass}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('rut')}
                </label>
                <RutInput
                  id="rut"
                  name="rut"
                  defaultValue={prefill.tax_id}
                  readOnly
                  required
                  className={readOnlyClass}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="company_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Razón Social
                </label>
                <Input id="company_name" defaultValue={prefill.company_name} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="contact_role" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Cargo del Contacto
                </label>
                <Input id="contact_role" defaultValue={prefill.contact_role} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Teléfono
                </label>
                <Input id="phone" defaultValue={prefill.phone} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Dirección empresa
                </label>
                <Input id="address" defaultValue={prefill.address} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Ciudad
                </label>
                <Input id="city" defaultValue={prefill.city} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="comuna" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Comuna
                </label>
                <Input id="comuna" defaultValue={prefill.comuna} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="business_activity" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Giro
                </label>
                <Input id="business_activity" defaultValue={prefill.business_activity} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="requesting_rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  RUT solicita
                </label>
                <Input id="requesting_rut" defaultValue={prefill.requesting_rut} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label htmlFor="shipping_address" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Dirección de despacho
                </label>
                <Input id="shipping_address" defaultValue={prefill.shipping_address} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Notas
                </label>
                <Input id="notes" defaultValue={prefill.notes} readOnly className={readOnlyClass} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('password')}
                </label>
                <Input id="password" name="password" type="password" required />
              </div>
            </div>
            <Button formAction={signup} className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12">
              Crear cuenta
            </Button>
          </form>
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
