import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@calmar/ui'
import {
  sendB2BApprovedTestAction,
  sendB2BRejectedTestAction,
  sendGenericTestEmailAction,
  sendProspectAdminTestAction,
  sendRefundAdminTestAction,
} from './actions'

export default function EmailTestsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-calmar-text">
          Pruebas de correo SendGrid
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Usa esta pagina para validar el envio de emails. Los correos de admin
          se envian al valor de <span className="font-semibold">ADMIN_EMAIL</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Correo generico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={sendGenericTestEmailAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo destino</label>
              <Input name="targetEmail" type="email" placeholder="cliente@dominio.cl" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Asunto</label>
              <Input name="subject" defaultValue="Prueba de correo SendGrid" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje</label>
              <Input name="message" defaultValue="Este es un correo de prueba para validar SendGrid." />
            </div>
            <Button type="submit" className="bg-calmar-primary text-white w-full">
              Enviar prueba
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente B2B (aprobado / rechazado)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo destino</label>
                <Input name="targetEmail" type="email" placeholder="cliente@empresa.cl" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contacto</label>
                <Input name="contactName" defaultValue="Cliente Calmar" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <Input name="companyName" defaultValue="Empresa Demo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Credito</label>
                <Input name="creditLimit" type="number" defaultValue="150000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dias de pago</label>
                <Input name="paymentTermsDays" type="number" defaultValue="30" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                type="submit"
                formAction={sendB2BApprovedTestAction}
                className="bg-calmar-primary text-white w-full"
              >
                Enviar aprobacion B2B
              </Button>
              <Button
                type="submit"
                formAction={sendB2BRejectedTestAction}
                variant="outline"
                className="w-full"
              >
                Enviar rechazo B2B
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificacion admin (prospecto)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={sendProspectAdminTestAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input name="contactName" defaultValue="Prospecto Demo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo contacto</label>
                <Input name="targetEmail" type="email" defaultValue="prospecto@demo.cl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <Input name="phone" defaultValue="+56 9 1234 5678" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <Input name="companyName" defaultValue="Empresa Demo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RUT</label>
                <Input name="taxId" defaultValue="76.123.456-7" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Input name="prospectType" defaultValue="b2b" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input name="notes" defaultValue="Prueba desde el panel admin." />
            </div>
            <Button type="submit" className="bg-calmar-primary text-white w-full">
              Enviar notificacion de prospecto (admin)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificacion admin (devolucion)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={sendRefundAdminTestAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Referencia</label>
              <Input name="referenceId" defaultValue="REF-TEST-001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input name="reason" defaultValue="Prueba de devolucion desde admin" />
            </div>
            <Button type="submit" className="bg-calmar-primary text-white w-full">
              Enviar notificacion de devolucion (admin)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
