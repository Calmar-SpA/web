import { login, signup } from './actions'
import { Button } from '@calmar/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@calmar/ui'
import { Input, RutInput } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ signup_error?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Login')
  const signupError = resolvedSearchParams?.signup_error
  const signupErrorMessage = (() => {
    if (signupError === 'full_name') return t('fullNameRequired')
    if (signupError === 'rut') return t('rutInvalid')
    if (signupError === 'generic') return t('signupErrorGeneric')
    return null
  })()
  const isFullNameError = signupError === 'full_name'
  const isRutError = signupError === 'rut'

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
          <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('email')}</label>
              <Input id="email" name="email" type="email" placeholder="hola@ejemplo.cl" required />
            </div>
            <div className="grid gap-2">
              <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('fullName')}</label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                autoComplete="name"
                aria-invalid={isFullNameError}
                className={isFullNameError ? "border-red-500 focus-visible:ring-red-500/20" : undefined}
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('fullNameHint')}</p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('rut')}</label>
              <RutInput
                id="rut"
                name="rut"
                placeholder={t('rutPlaceholder')}
                aria-invalid={isRutError}
                className={isRutError ? "border-red-500 focus-visible:ring-red-500/20" : undefined}
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('rutHint')}</p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" throws-error="true" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('password')}</label>
              <Input id="password" name="password" type="password" required />
            </div>
            {signupErrorMessage && (
              <p className="text-xs font-semibold text-red-500">{signupErrorMessage}</p>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button formAction={login} className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest">
                {t('signIn')}
              </Button>
              <Button variant="outline" formAction={signup} className="font-bold uppercase text-xs tracking-widest">
                {t('signUp')}
              </Button>
            </div>
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
