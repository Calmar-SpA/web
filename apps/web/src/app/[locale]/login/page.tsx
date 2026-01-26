import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@calmar/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { LoginFormClient } from './LoginFormClient'

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ signup_error?: string; signup_success?: string; tab?: string; login_error?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('Login')
  
  const signupSuccess = resolvedSearchParams?.signup_success === 'true'
  const activeTab = resolvedSearchParams?.tab === 'register' ? 'register' : 'login'
  const loginPath = locale ? `/${locale}/login` : '/login'
  const resetSuccess = resolvedSearchParams?.reset_success === 'true'

  const translations = {
    email: t('email'),
    password: t('password'),
    fullName: t('fullName'),
    fullNamePlaceholder: t('fullNamePlaceholder'),
    rut: t('rut'),
    rutPlaceholder: t('rutPlaceholder'),
    signIn: t('signIn'),
    signUp: t('signUp'),
    fullNameRequired: t('fullNameRequired'),
    rutInvalid: t('rutInvalid'),
    signupErrorEmailExists: t('signupErrorEmailExists'),
    signupErrorWeakPassword: t('signupErrorWeakPassword'),
    signupErrorEmailInvalid: t('signupErrorEmailInvalid'),
    signupErrorRutExists: t('signupErrorRutExists'),
    signupErrorGeneric: t('signupErrorGeneric'),
    loginErrorInvalidCredentials: t('loginErrorInvalidCredentials'),
    loginErrorEmailNotConfirmed: t('loginErrorEmailNotConfirmed'),
    loginErrorGeneric: t('loginErrorGeneric'),
    signupSuccessCheckEmail: t('signupSuccessCheckEmail'),
    forgotPassword: t('forgotPassword'),
    orContinueWith: t('orContinueWith'),
    googleLogin: t('googleLogin'),
    resetSuccess: t('resetSuccess'),
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
          {signupSuccess && activeTab === 'register' && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold text-center">
              {t('signupSuccessCheckEmail')}
            </div>
          )}
          
          {resetSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold text-center uppercase tracking-tight">
              {t('resetSuccess')}
            </div>
          )}
          
          <LoginFormClient 
            locale={locale}
            activeTab={activeTab}
            loginPath={loginPath}
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
