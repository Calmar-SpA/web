import sendgrid from '@sendgrid/mail';

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notificaciones@calmar.cl';
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Notificaciones Calmar';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contacto@calmar.cl';

const brand = {
  primaryDark: '#1D504B',
  primary: '#62A49E',
  text: '#343431',
  muted: '#F5F5F0',
};

if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

const buildFromAddress = () => `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: 'attachment';
  }>;
}) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key is missing. Email skipped.');
    return { success: false, error: 'Missing API key' };
  }

  await sendgrid.send({
    to,
    from: buildFromAddress(),
    subject,
    html,
    replyTo,
    attachments,
  });

  return { success: true };
};

const LOGO_URL =
  'https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/CALMAR%20Sin%20Fondo.png';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Zalando+Sans+Expanded:wght@300;400;500;600;700;800;900&display=swap';

const buildEmailShell = (title: string, contentHtml: string) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${FONT_LINK}" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Zalando+Sans+Expanded:wght@300;400;500;600;700;800;900&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${brand.text};">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <div style="text-align:center;padding:12px 0 20px;">
        <img src="${LOGO_URL}" alt="Calmar" width="200" style="display:block;margin:0 auto;" />
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:10px;box-shadow:0 4px 8px rgba(0,0,0,0.05);">
        <h1 style="margin:0 0 16px;text-align:center;font-family:'Zalando Sans Expanded',sans-serif;font-size:26px;color:${brand.text};">${title}</h1>
        ${contentHtml}
      </div>
      <div style="text-align:center;padding:24px 0 0;font-size:12px;opacity:0.7;">
        <div>© 2026 Calmar SpA • Agua de Mar Premium e hidratacion avanzada</div>
        <div>Chile</div>
      </div>
    </div>
  </body>
</html>
`;

export async function sendTestEmail(params: {
  to: string;
  subject?: string;
  message?: string;
}) {
  const subject = params.subject || 'Prueba de correo SendGrid';
  const message =
    params.message ||
    'Este es un correo de prueba para validar la configuracion de SendGrid.';

  const content = `
    <p style="margin:12px 0;line-height:1.6;">${message}</p>
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Destino:</strong> ${params.to}</div>
    </div>
  `;

  const html = buildEmailShell('Prueba de correo', content);

  return sendEmail({
    to: params.to,
    subject,
    html,
  });
}

export async function sendB2BApprovedEmail(params: {
  contactName: string;
  contactEmail: string;
  companyName: string;
  creditLimit: number;
  paymentTermsDays: number;
}) {
  const content = `
    <p style="margin:12px 0;line-height:1.6;">Hola ${params.contactName},</p>
    <p style="margin:12px 0;line-height:1.6;">
      Tu empresa ${params.companyName} fue aprobada en el programa B2B de Calmar.
    </p>
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Credito disponible:</strong> $${params.creditLimit.toLocaleString('es-CL')}</div>
      <div><strong>Terminos de pago:</strong> ${params.paymentTermsDays} dias</div>
    </div>
    <p style="margin:12px 0;line-height:1.6;">
      Si tienes dudas, responde a este correo.
    </p>
  `;

  const html = buildEmailShell('Postulacion B2B aprobada', content);

  return sendEmail({
    to: params.contactEmail,
    subject: 'Tu postulacion B2B fue aprobada',
    html,
    replyTo: ADMIN_EMAIL,
  });
}

export async function sendB2BRejectedEmail(params: {
  contactName: string;
  contactEmail: string;
  companyName: string;
}) {
  const content = `
    <p style="margin:12px 0;line-height:1.6;">Hola ${params.contactName},</p>
    <p style="margin:12px 0;line-height:1.6;">
      Lamentablemente tu postulacion de ${params.companyName} no fue aprobada en esta ocasion.
      Si necesitas mas informacion, responde a este correo.
    </p>
  `;

  const html = buildEmailShell('Postulacion B2B rechazada', content);

  return sendEmail({
    to: params.contactEmail,
    subject: 'Tu postulacion B2B fue rechazada',
    html,
    replyTo: ADMIN_EMAIL,
  });
}

export async function sendProspectAdminNotification(params: {
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  type: string;
  companyName?: string | null;
  fantasyName?: string | null;
  taxId?: string | null;
  contactRole?: string | null;
  notes?: string | null;
}) {
  const content = `
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Tipo:</strong> ${params.type}</div>
      ${params.contactName ? `<div><strong>Contacto:</strong> ${params.contactName}</div>` : ''}
      ${params.contactRole ? `<div><strong>Cargo:</strong> ${params.contactRole}</div>` : ''}
      ${params.email ? `<div><strong>Email:</strong> ${params.email}</div>` : ''}
      ${params.phone ? `<div><strong>Telefono:</strong> ${params.phone}</div>` : ''}
      ${params.companyName ? `<div><strong>Empresa:</strong> ${params.companyName}</div>` : ''}
      ${params.fantasyName ? `<div><strong>Nombre Fantasía:</strong> ${params.fantasyName}</div>` : ''}
      ${params.taxId ? `<div><strong>RUT:</strong> ${params.taxId}</div>` : ''}
    </div>
    ${params.notes ? `<p style="margin:12px 0;line-height:1.6;">Notas: ${params.notes}</p>` : ''}
  `;

  const html = buildEmailShell('Nuevo prospecto registrado', content);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: 'Nuevo prospecto registrado',
    html,
    replyTo: params.email || ADMIN_EMAIL,
  });
}

export async function sendProspectActivationEmail(params: {
  contactName: string;
  contactEmail: string;
  hasAccount: boolean;
  registerUrl: string;
  accountUrl?: string;
}) {
  const greeting = params.contactName ? `Hola ${params.contactName},` : 'Hola,';
  const accountButton = params.accountUrl
    ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${params.accountUrl}" style="background:${brand.primaryDark};color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">
          Ir a mi cuenta
        </a>
      </div>
    `
    : ''
  const accountMessage = params.hasAccount
    ? `
      <p style="margin:12px 0;line-height:1.6;">
        Tu cuenta ya esta activa. Puedes ingresar y revisar el detalle de tus pedidos y toda tu informacion.
      </p>
      ${accountButton}
      <p style="margin:12px 0;line-height:1.6;">
        Si necesitas ayuda, responde a este correo.
      </p>
    `
    : `
      <p style="margin:12px 0;line-height:1.6;">
        Ya estas activo en nuestro sistema. Si creas una cuenta en nuestra web con este mismo correo (<strong>${params.contactEmail}</strong>), podras acceder a toda tu informacion: pedidos, facturas, guias de despacho y mas.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${params.registerUrl}" style="background:${brand.primaryDark};color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">
          Crear mi cuenta
        </a>
      </div>
      <p style="margin:12px 0;line-height:1.6;">
        Si necesitas ayuda, responde a este correo.
      </p>
    `;

  const content = `
    <p style="margin:12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:12px 0;line-height:1.6;">
      Tu estado en Calmar ahora es <strong>Activo</strong>.
    </p>
    ${accountMessage}
  `;

  const html = buildEmailShell('Tu cuenta esta activa', content);

  return sendEmail({
    to: params.contactEmail,
    subject: 'Tu cuenta en Calmar esta activa',
    html,
    replyTo: ADMIN_EMAIL,
  });
}

export async function sendRefundAdminNotification(params: {
  referenceId: string;
  reason?: string | null;
  amountLabel?: string | null;
}) {
  const content = `
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Referencia:</strong> ${params.referenceId}</div>
      ${params.amountLabel ? `<div><strong>Monto:</strong> ${params.amountLabel}</div>` : ''}
      ${params.reason ? `<div><strong>Motivo:</strong> ${params.reason}</div>` : ''}
    </div>
  `;

  const html = buildEmailShell('Devolucion registrada', content);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: 'Devolucion registrada',
    html,
  });
}

export async function sendPaymentVerificationAdminNotification(params: {
  movementNumber: string;
  customerName: string;
  amount: number;
  adminUrl: string;
}) {
  const content = `
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Movimiento:</strong> ${params.movementNumber}</div>
      <div><strong>Cliente:</strong> ${params.customerName}</div>
      <div><strong>Monto:</strong> $${params.amount.toLocaleString('es-CL')}</div>
      <div style="margin-top:16px;">
        <a href="${params.adminUrl}" style="background:${brand.primaryDark};color:white;padding:10px 20px;text-decoration:none;border-radius:4px;font-weight:bold;">
          Verificar Pago
        </a>
      </div>
    </div>
  `;

  const html = buildEmailShell('Nuevo pago por verificar', content);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nuevo pago por verificar - ${params.movementNumber}`,
    html,
  });
}

export async function sendPaymentStatusCustomerNotification(params: {
  to: string;
  customerName: string;
  movementNumber: string;
  amount: number;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  movementUrl?: string;
}) {
  const isApproved = params.status === 'approved';
  const title = isApproved ? 'Pago Aprobado' : 'Pago Rechazado';
  
  const content = `
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${isApproved ? '#10b981' : '#ef4444'};">
      <p>Hola ${params.customerName},</p>
      <p>Tu pago por el movimiento <strong>${params.movementNumber}</strong> por un monto de <strong>$${params.amount.toLocaleString('es-CL')}</strong> ha sido <strong>${isApproved ? 'aprobado' : 'rechazado'}</strong>.</p>
      
      ${!isApproved && params.rejectionReason ? `
        <div style="margin-top:12px;padding:12px;background:white;border-radius:4px;border:1px solid #fee2e2;">
          <strong>Motivo del rechazo:</strong> ${params.rejectionReason}
        </div>
        <p style="margin-top:12px;">Por favor, revisa el motivo e intenta informar el pago nuevamente con el comprobante correcto.</p>
      ` : ''}
      
      ${isApproved ? '<p>Tu saldo ha sido actualizado correctamente.</p>' : ''}
    </div>

    ${params.movementUrl ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${params.movementUrl}" style="background:${brand.primaryDark};color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">
          Ver Movimiento
        </a>
      </div>
    ` : ''}
  `;

  const html = buildEmailShell(title, content);

  return sendEmail({
    to: params.to,
    subject: `${title} - Movimiento ${params.movementNumber}`,
    html,
  });
}

export async function sendDocumentUploadedEmail(params: {
  contactName: string;
  contactEmail: string;
  companyName: string;
  movementNumber: string;
  documentType: 'invoice' | 'dispatch_order' | 'credit_note' | 'debit_note' | 'boleta';
  attachment: {
    content: string;
    filename: string;
    type: string;
  };
  movementUrl?: string;
}) {
  const docLabels: Record<string, string> = {
    invoice: 'Factura',
    dispatch_order: 'Guía de Despacho',
    credit_note: 'Nota de Crédito',
    debit_note: 'Nota de Débito',
    boleta: 'Boleta'
  };

  const docLabel = docLabels[params.documentType] || 'Documento';
  const title = `${docLabel} Disponible - ${params.movementNumber}`;
  
  const content = `
    <p style="margin:12px 0;line-height:1.6;">Hola ${params.contactName},</p>
    <p style="margin:12px 0;line-height:1.6;">
      Se ha emitido un nuevo documento para tu empresa <strong>${params.companyName}</strong>.
    </p>
    <div style="background:${brand.muted};padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid ${brand.primary};">
      <div><strong>Documento:</strong> ${docLabel}</div>
      <div><strong>Movimiento:</strong> ${params.movementNumber}</div>
    </div>
    <p style="margin:12px 0;line-height:1.6;">
      Adjunto encontrarás el documento en formato PDF/Imagen.
    </p>

    ${params.movementUrl ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${params.movementUrl}" style="background:${brand.primaryDark};color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">
          Ver Movimiento
        </a>
        <p style="margin-top:12px;font-size:12px;color:#666;">
          No necesitas iniciar sesión para ver el detalle.
          <br>
          Si creas una cuenta con este correo, podrás ver todos tus movimientos.
        </p>
      </div>
    ` : ''}

    <p style="margin:12px 0;line-height:1.6;">
      Si tienes dudas, responde a este correo.
    </p>
  `;

  const html = buildEmailShell(title, content);

  return sendEmail({
    to: params.contactEmail,
    subject: title,
    html,
    replyTo: ADMIN_EMAIL,
    attachments: [{
      content: params.attachment.content,
      filename: params.attachment.filename,
      type: params.attachment.type,
      disposition: 'attachment'
    }]
  });
}
