import { login, signup } from './actions'
import { Button } from '@calmar/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@calmar/ui'
import { Input, RutInput } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/navigation'

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ signup_error?: string; signup_success?: string; tab?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Login')
  const signupError = resolvedSearchParams?.signup_error
  const signupSuccess = resolvedSearchParams?.signup_success === 'true'
  const activeTab = resolvedSearchParams?.tab === 'register' ? 'register' : 'login'
  const loginPath = locale ? `/${locale}/login` : '/login'
  const signupErrorMessage = (() => {
    if (signupError === 'full_name') return t('fullNameRequired')
    if (signupError === 'rut') return t('rutInvalid')
    if (signupError === 'email_exists') return t('signupErrorEmailExists')
    if (signupError === 'weak_password') return t('signupErrorWeakPassword')
    if (signupError === 'email_invalid') return t('signupErrorEmailInvalid')
    if (signupError === 'generic') return t('signupErrorGeneric')
    return null
  })()
  const isFullNameError = signupError === 'full_name'
  const isRutError = signupError === 'rut'
  const showSignupError = activeTab === 'register' && signupErrorMessage
  const showSignupSuccess = activeTab === 'register' && signupSuccess
  const tabButtonBase =
    'w-full h-10 rounded-full text-xs font-black uppercase tracking-widest transition-colors'

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
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <Button
              asChild
              variant="ghost"
              className={`${tabButtonBase} ${activeTab === 'login' ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Link href={loginPath} aria-current={activeTab === 'login' ? 'page' : undefined}>
                {t('signIn')}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={`${tabButtonBase} ${activeTab === 'register' ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Link href={`${loginPath}?tab=register`} aria-current={activeTab === 'register' ? 'page' : undefined}>
                {t('signUp')}
              </Link>
            </Button>
          </div>

          {activeTab === 'login' ? (
            <form className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('email')}</label>
                <Input id="email" name="email" type="email" placeholder="hola@ejemplo.cl" autoComplete="email" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('password')}</label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button formAction={login} className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12">
                {t('signIn')}
              </Button>
            </form>
          ) : (
            <form className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('email')}</label>
                <Input id="email" name="email" type="email" placeholder="hola@ejemplo.cl" autoComplete="email" required />
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
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('rut')}</label>
                <RutInput
                  id="rut"
                  name="rut"
                  placeholder={t('rutPlaceholder')}
                  aria-invalid={isRutError}
                  className={isRutError ? "border-red-500 focus-visible:ring-red-500/20" : undefined}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('password')}</label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required />
              </div>
              {showSignupError && (
                <p className="text-xs font-semibold text-red-500">{signupErrorMessage}</p>
              )}
              {showSignupSuccess && (
                <p className="text-xs font-semibold text-emerald-600">
                  {t('signupSuccessCheckEmail')}
                </p>
              )}
              <Button formAction={signup} className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12">
                {t('signUp')}
              </Button>
            </form>
          )}
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
