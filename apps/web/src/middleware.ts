import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

export async function middleware(request: NextRequest) {
  // 1. Update Supabase session
  // This updates request.cookies AND returns a response with set-cookie headers if needed
  const sessionResponse = await updateSession(request)
  
  // 2. Handle I18n routing
  const intlResponse = intlMiddleware(request)

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
