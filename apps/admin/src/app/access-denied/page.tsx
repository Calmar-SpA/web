import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@calmar/ui'
import { ShieldX } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AccessDeniedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-xl border-red-200 dark:border-red-800">
        <CardHeader className="space-y-4 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              No tienes permisos para acceder al panel de administración
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2">
              <strong>Usuario actual:</strong> {user?.email || 'No identificado'}
            </p>
            <p>
              Solo los usuarios con rol de <strong>Administrador</strong> pueden acceder a este panel.
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-slate-500 text-center">
              Si crees que deberías tener acceso, contacta al administrador del sistema.
            </p>
            
            <form action={signOut} className="w-full">
              <Button 
                type="submit"
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Cerrar Sesión
              </Button>
            </form>
            
            <Link href="https://calmar.cl" className="block">
              <Button variant="ghost" className="w-full text-slate-500">
                Volver al sitio principal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
