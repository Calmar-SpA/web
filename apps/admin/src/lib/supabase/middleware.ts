import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rutas públicas que no requieren verificación de rol
  const publicPaths = ['/login', '/access-denied', '/auth/callback']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return supabaseResponse
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar rol de admin en la tabla users
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Si no es admin, redirigir a página de acceso denegado
  if (!profile || profile.role !== 'admin') {
    const accessDeniedUrl = new URL('/access-denied', request.url)
    return NextResponse.redirect(accessDeniedUrl)
  }

  // Usuario es admin, permitir acceso
  return supabaseResponse
}
