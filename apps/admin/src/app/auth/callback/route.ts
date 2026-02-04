import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Verificar que el usuario ya existía (solo login, no registro con Google)
      // Un usuario nuevo con Google tiene created_at muy cercano a now()
      const createdAt = new Date(data.user.created_at)
      const now = new Date()
      const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000

      // Si el usuario fue creado hace menos de 30 segundos, es un registro nuevo
      // No permitir registro con Google, solo login
      if (diffSeconds < 30) {
        // Eliminar el usuario recién creado y cerrar sesión
        await supabase.auth.signOut()
        
        // Usar service role para eliminar el usuario (opcional, depende de las políticas)
        // Por ahora solo cerramos sesión y mostramos error
        return NextResponse.redirect(`${origin}/login?error=google_register_not_allowed`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
