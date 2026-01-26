'use client'

import { useActionState } from 'react'
import { login, signup, loginWithGoogle } from './actions'
import { Button } from '@calmar/ui'
import { Input, RutInput } from '@calmar/ui'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'

interface LoginFormClientProps {
  locale: string
  activeTab: 'login' | 'register'
  loginPath: string
  translations: {
    email: string
    password: string
    fullName: string
    fullNamePlaceholder: string
    rut: string
    rutPlaceholder: string
    signIn: string
    signUp: string
    fullNameRequired: string
    rutInvalid: string
    signupErrorEmailExists: string
    signupErrorWeakPassword: string
    signupErrorEmailInvalid: string
    signupErrorRutExists: string
    signupErrorGeneric: string
    loginErrorInvalidCredentials: string
    loginErrorEmailNotConfirmed: string
    loginErrorGeneric: string
    signupSuccessCheckEmail: string
    forgotPassword: string
    orContinueWith: string
    googleLogin: string
  }
}

export function LoginFormClient({
  locale,
  activeTab,
  loginPath,
  translations: t
}: LoginFormClientProps) {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null)
  const [signupState, signupAction, isSignupPending] = useActionState(signup, null)

  const signupError = signupState?.error
  const loginError = loginState?.error
  
  const signupErrorMessage = (() => {
    if (signupError === 'full_name') return t.fullNameRequired
    if (signupError === 'rut') return t.rutInvalid
    if (signupError === 'email_exists') return t.signupErrorEmailExists
    if (signupError === 'weak_password') return t.signupErrorWeakPassword
    if (signupError === 'email_invalid') return t.signupErrorEmailInvalid
    if (signupError === 'rut_exists') return t.signupErrorRutExists
    if (signupError === 'generic') return t.signupErrorGeneric
    return null
  })()

  const loginErrorMessage = (() => {
    if (loginError === 'invalid_credentials') return t.loginErrorInvalidCredentials
    if (loginError === 'email_not_confirmed') return t.loginErrorEmailNotConfirmed
    if (loginError === 'generic') return t.loginErrorGeneric
    return null
  })()

  const isFullNameError = signupError === 'full_name'
  const isRutError = signupError === 'rut' || signupError === 'rut_exists'

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
        <Button
          asChild
          variant="ghost"
          className={`w-full h-10 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'login' ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Link href={loginPath} aria-current={activeTab === 'login' ? 'page' : undefined}>
            {t.signIn}
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className={`w-full h-10 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'register' ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Link href={`${loginPath}?tab=register`} aria-current={activeTab === 'register' ? 'page' : undefined}>
            {t.signUp}
          </Link>
        </Button>
      </div>

      {activeTab === 'login' ? (
        <form action={loginAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.email}</label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="hola@ejemplo.cl" 
              autoComplete="email" 
              required 
              defaultValue={loginState?.values?.email}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.password}</label>
              <Link 
                href={`/${locale}/forgot-password`} 
                className="text-[10px] font-bold uppercase tracking-widest text-calmar-ocean hover:underline"
              >
                {t.forgotPassword}
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {loginErrorMessage && (
            <p className="text-xs font-semibold text-red-500">{loginErrorMessage}</p>
          )}
          <Button 
            type="submit" 
            disabled={isLoginPending}
            className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12"
          >
            {isLoginPending ? '...' : t.signIn}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-2 text-slate-400">{t.orContinueWith}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => loginWithGoogle(locale)}
            className="w-full h-12 border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.googleLogin}
          </Button>
        </form>
      ) : (
        <form action={signupAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.email}</label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="hola@ejemplo.cl" 
              autoComplete="email" 
              required 
              defaultValue={signupState?.values?.email}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.fullName}</label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder={t.fullNamePlaceholder}
              autoComplete="name"
              aria-invalid={isFullNameError}
              className={isFullNameError ? "border-red-500 focus-visible:ring-red-500/20" : undefined}
              required
              defaultValue={signupState?.values?.full_name}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.rut}</label>
            <RutInput
              id="rut"
              name="rut"
              placeholder={t.rutPlaceholder}
              aria-invalid={isRutError}
              className={isRutError ? "border-red-500 focus-visible:ring-red-500/20" : undefined}
              required
              defaultValue={signupState?.values?.rut}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.password}</label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          {signupErrorMessage && (
            <p className="text-xs font-semibold text-red-500">{signupErrorMessage}</p>
          )}
          <Button 
            type="submit" 
            disabled={isSignupPending}
            className="bg-slate-900 text-white font-bold uppercase text-xs tracking-widest h-12"
          >
            {isSignupPending ? '...' : t.signUp}
          </Button>
        </form>
      )}
    </div>
  )
}
