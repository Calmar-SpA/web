import { login } from './actions'
import { Button } from '@calmar/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@calmar/ui'
import { Input } from '@calmar/ui'
import Image from 'next/image'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-4 text-center flex flex-col items-center">
          <Image 
            src="/logo.png" 
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
        </CardContent>
      </Card>
    </div>
  )
}
