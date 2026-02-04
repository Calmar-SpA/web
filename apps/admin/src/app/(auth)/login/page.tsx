import { login } from './actions'
import { GoogleLoginButton } from './GoogleLoginButton'
import { Button } from '@calmar/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@calmar/ui'
import { Input } from '@calmar/ui'
import Image from 'next/image'

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params?.error

  const getErrorMessage = (errorCode: string | undefined) => {
    switch (errorCode) {
      case 'google_failed':
        return 'Error al iniciar sesión con Google. Intenta de nuevo.'
      case 'google_register_not_allowed':
        return 'Esta cuenta de Google no está registrada. Solicita acceso al administrador.'
      case 'auth_callback_failed':
        return 'Error de autenticación. Intenta de nuevo.'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-4 text-center flex flex-col items-center">
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
            alt="CALMAR" 
            width={200} 
            height={60} 
            className="h-14 w-auto object-contain dark:invert"
          />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Panel de Administración
            </CardTitle>
            <CardDescription className="text-calmar-ocean font-medium">
              Calmar SpA
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {errorMessage}
            </div>
          )}
          <form className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email de Administrador</label>
              <Input id="email" name="email" type="email" placeholder="admin@calmar.cl" required />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full mt-2" formAction={login}>Acceder al Panel</Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-medium tracking-wider">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">O continuar con</span>
            </div>
          </div>

          <GoogleLoginButton />
        </CardContent>
      </Card>
    </div>
  )
}
