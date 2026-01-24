import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, type Locale } from './i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

export async function middleware(request: NextRequest) {
  // 1. Update Supabase session
  // This updates request.cookies AND returns a response with set-cookie headers if needed
  const { response: sessionResponse, user } = await updateSession(request)
  
  // 2. Handle I18n routing
  const intlResponse = intlMiddleware(request)

  const pathname = request.nextUrl.pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const pathLocale = (locales as readonly string[]).includes(pathSegments[0]) ? pathSegments[0] as Locale : null
  const accountPath = pathLocale ? `/${pathLocale}/account` : '/account'
  const needsAuth = pathname === accountPath || pathname.startsWith(`${accountPath}/`)

  if (needsAuth && !user) {
    const loginPath = pathLocale ? `/${pathLocale}/login` : '/login'
    const redirectResponse = NextResponse.redirect(new URL(loginPath, request.url))

    sessionResponse.cookies.getAll().forEach((cookie) => {
      const { name, value, ...options } = cookie
      redirectResponse.cookies.set(name, value, options)
    })

    return redirectResponse
  }

  // Redirigir usuarios autenticados fuera de /login
  const loginPath = pathLocale ? `/${pathLocale}/login` : '/login'
  const isLoginPage = pathname === loginPath

  if (isLoginPage && user) {
    const redirectResponse = NextResponse.redirect(new URL(accountPath, request.url))

    sessionResponse.cookies.getAll().forEach((cookie) => {
      const { name, value, ...options } = cookie
      redirectResponse.cookies.set(name, value, options)
    })

    return redirectResponse
  }

  // 3. Merge cookies from sessionResponse into intlResponse
  // This ensures that if updateSession refreshed a token, those cookies are kept.
  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
