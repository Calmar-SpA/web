import sendgrid from '@sendgrid/mail';
import { render } from '@react-email/render';
import { createAdminClient } from '@/lib/supabase/admin';
import NewsletterConfirmationEmail from '@/components/emails/newsletter-confirmation';
import OrderConfirmationEmail, {
  OrderEmailItem,
} from '@/components/emails/order-confirmation';
import AdminOrderNotificationEmail from '@/components/emails/order-admin-notification';
import B2BApplicationAdminEmail from '@/components/emails/b2b-application-admin';
import B2BApplicationReceivedEmail from '@/components/emails/b2b-application-received';
import ProspectAdminNotificationEmail from '@/components/emails/prospect-admin-notification';
import InventoryLowAdminEmail, {
  LowInventoryItem,
} from '@/components/emails/inventory-low-admin';
import RefundAdminNotificationEmail from '@/components/emails/refund-admin-notification';
import SponsorshipAdminNotificationEmail from '@/components/emails/sponsorship-admin-notification';
import SponsorshipReceivedEmail from '@/components/emails/sponsorship-received';

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notificaciones@calmar.cl';
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Notificaciones Calmar';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contacto@calmar.cl';
const DEFAULT_LOCALE = 'es';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.calmar.cl';

// Configure SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const buildFromAddress = () => `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;

async function logEmail(params: {
  sendgridMessageId?: string;
  toEmail: string;
  toName?: string;
  fromEmail: string;
  subject: string;
  emailType: string;
  emailCategory: string;
  source: 'admin' | 'web';
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  hasAttachment?: boolean;
  status?: 'sent' | 'failed';
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    await supabase.from('email_logs').insert({
      sendgrid_message_id: params.sendgridMessageId,
      to_email: params.toEmail,
      to_name: params.toName,
      from_email: params.fromEmail,
      subject: params.subject,
      email_type: params.emailType,
      email_category: params.emailCategory,
      source: params.source,
      related_entity_type: params.relatedEntityType,
      related_entity_id: params.relatedEntityId,
      metadata: params.metadata || {},
      has_attachment: params.hasAttachment || false,
      status: params.status || 'sent',
      error_message: params.errorMessage,
    });
  } catch (error) {
    console.error('Error logging email:', error);
    // We don't throw here to avoid failing the email sending process if logging fails
  }
}

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
  logParams,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  logParams?: {
    emailType: string;
    emailCategory: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, unknown>;
    toName?: string;
  };
}) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key is missing. Email skipped.');
    return { success: false, error: 'Missing API key' };
  }

  const msg = {
    to,
    from: buildFromAddress(),
    subject,
    html,
    replyTo,
  };

  try {
    const [response] = await sendgrid.send(msg);
    const messageId = response?.headers?.['x-message-id'];

    if (logParams) {
      await logEmail({
        sendgridMessageId: messageId,
        toEmail: to,
        toName: logParams.toName,
        fromEmail: DEFAULT_FROM_EMAIL,
        subject,
        emailType: logParams.emailType,
        emailCategory: logParams.emailCategory,
        source: 'web',
        relatedEntityType: logParams.relatedEntityType,
        relatedEntityId: logParams.relatedEntityId,
        metadata: logParams.metadata,
        hasAttachment: false,
        status: 'sent',
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);

    if (logParams) {
      await logEmail({
        toEmail: to,
        toName: logParams.toName,
        fromEmail: DEFAULT_FROM_EMAIL,
        subject,
        emailType: logParams.emailType,
        emailCategory: logParams.emailCategory,
        source: 'web',
        relatedEntityType: logParams.relatedEntityType,
        relatedEntityId: logParams.relatedEntityId,
        metadata: logParams.metadata,
        hasAttachment: false,
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
      });
    }

    return { success: false, error: error?.message || error };
  }
};

export async function sendNewsletterConfirmation(email: string) {
  try {
    // Render React Email template to HTML
    const html = await render(NewsletterConfirmationEmail({ email }));
    await sendEmail({
      to: email,
      subject: 'Bienvenido a Calmar! Confirmacion de suscripcion',
      html,
      logParams: {
        emailType: 'confirmation',
        emailCategory: 'newsletter',
      },
    });
    console.log(`Newsletter confirmation email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('Exception sending newsletter confirmation email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendContactConfirmation(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  try {
    // Import the contact confirmation email template
    const ContactConfirmationEmail = (await import('@/components/emails/contact-confirmation')).default;
    
    // Render React Email template to HTML
    const html = await render(ContactConfirmationEmail({ name, email, subject, message }));
    await sendEmail({
      to: email,
      subject: 'Hemos recibido tu mensaje - Calmar',
      html,
      logParams: {
        emailType: 'confirmation',
        emailCategory: 'contact',
        toName: name,
        metadata: { subject, message },
      },
    });
    console.log(`Contact confirmation email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('Exception sending contact confirmation email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendOrderPaidCustomerEmail(params: {
  email: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  orderStatusLabel: string;
  totalAmount: number;
  items: Array<{
    name: string;
    variantName?: string | null;
    quantity: number;
    subtotal: number;
  }>;
}) {
  try {
    const items: OrderEmailItem[] = params.items.map(item => ({
      name: item.name,
      variantName: item.variantName,
      quantity: item.quantity,
      subtotalLabel: formatCurrency(item.subtotal),
    }));

    const html = await render(
      OrderConfirmationEmail({
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        orderStatusLabel: params.orderStatusLabel,
        totalAmount: formatCurrency(params.totalAmount),
        orderUrl: `${SITE_URL}/${DEFAULT_LOCALE}/account/orders/${params.orderId}`,
        items,
      })
    );

    await sendEmail({
      to: params.email,
      subject: `Tu compra ${params.orderNumber} esta confirmada`,
      html,
      logParams: {
        emailType: 'confirmation',
        emailCategory: 'order_paid_customer',
        toName: params.customerName,
        relatedEntityType: 'order',
        relatedEntityId: params.orderId,
        metadata: {
          orderNumber: params.orderNumber,
          totalAmount: params.totalAmount,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending order confirmation email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendOrderPaidAdminEmail(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  shippingSummary: string;
}) {
  try {
    const html = await render(
      AdminOrderNotificationEmail({
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        totalAmount: formatCurrency(params.totalAmount),
        paymentMethod: params.paymentMethod,
        shippingSummary: params.shippingSummary,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Nueva compra ${params.orderNumber}`,
      html,
      replyTo: params.customerEmail,
      logParams: {
        emailType: 'notification',
        emailCategory: 'order_paid_admin',
        relatedEntityType: 'order',
        metadata: {
          orderNumber: params.orderNumber,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          totalAmount: params.totalAmount,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending admin order notification email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendB2BApplicationAdminNotification(params: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
}) {
  try {
    const html = await render(
      B2BApplicationAdminEmail({
        companyName: params.companyName,
        contactName: params.contactName,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone,
        taxId: params.taxId,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Nueva postulacion B2B',
      html,
      replyTo: params.contactEmail,
      logParams: {
        emailType: 'notification',
        emailCategory: 'b2b_application_admin',
        relatedEntityType: 'prospect',
        metadata: {
          companyName: params.companyName,
          contactName: params.contactName,
          contactEmail: params.contactEmail,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending B2B admin email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendB2BApplicationReceivedEmail(params: {
  contactName: string;
  companyName: string;
  contactEmail: string;
}) {
  try {
    const html = await render(
      B2BApplicationReceivedEmail({
        contactName: params.contactName,
        companyName: params.companyName,
      })
    );

    await sendEmail({
      to: params.contactEmail,
      subject: 'Tu postulacion B2B fue recibida',
      html,
      logParams: {
        emailType: 'confirmation',
        emailCategory: 'b2b_application_received',
        toName: params.contactName,
        relatedEntityType: 'prospect',
        metadata: {
          companyName: params.companyName,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending B2B received email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendProspectAdminNotification(params: {
  contactName: string;
  email: string;
  phone?: string | null;
  type: string;
  companyName?: string | null;
  taxId?: string | null;
  notes?: string | null;
}) {
  try {
    const html = await render(
      ProspectAdminNotificationEmail({
        contactName: params.contactName,
        email: params.email,
        phone: params.phone,
        type: params.type,
        companyName: params.companyName,
        taxId: params.taxId,
        notes: params.notes,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Nuevo prospecto registrado',
      html,
      replyTo: params.email,
      logParams: {
        emailType: 'notification',
        emailCategory: 'prospect_admin',
        relatedEntityType: 'prospect',
        metadata: {
          type: params.type,
          companyName: params.companyName,
          contactName: params.contactName,
          email: params.email,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending prospect notification email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendLowInventoryAdminAlert(params: {
  threshold: number;
  items: LowInventoryItem[];
}) {
  try {
    if (!params.items.length) {
      return { success: true };
    }

    const html = await render(
      InventoryLowAdminEmail({
        threshold: params.threshold,
        items: params.items,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Alerta de inventario bajo',
      html,
      logParams: {
        emailType: 'alert',
        emailCategory: 'low_inventory',
        metadata: {
          threshold: params.threshold,
          itemCount: params.items.length,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending low inventory email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendRefundAdminNotification(params: {
  referenceId: string;
  amount?: number | null;
  reason?: string | null;
}) {
  try {
    const html = await render(
      RefundAdminNotificationEmail({
        referenceId: params.referenceId,
        amountLabel: typeof params.amount === 'number' ? formatCurrency(params.amount) : null,
        reason: params.reason,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Devolucion registrada',
      html,
      logParams: {
        emailType: 'notification',
        emailCategory: 'refund_admin',
        metadata: {
          referenceId: params.referenceId,
          amount: params.amount,
          reason: params.reason,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending refund notification email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendSponsorshipAdminNotification(params: {
  applicantType: string;
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  socialOther?: string;
  audienceSize?: string;
  proposal: string;
  sponsorshipType: string;
  budgetRequested?: number;
}) {
  try {
    const html = await render(
      SponsorshipAdminNotificationEmail({
        applicantType: params.applicantType,
        name: params.name,
        contactName: params.contactName,
        email: params.email,
        phone: params.phone,
        socialInstagram: params.socialInstagram,
        socialTiktok: params.socialTiktok,
        socialYoutube: params.socialYoutube,
        socialOther: params.socialOther,
        audienceSize: params.audienceSize,
        proposal: params.proposal,
        sponsorshipType: params.sponsorshipType,
        budgetRequested: params.budgetRequested,
      })
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Nueva solicitud de patrocinio',
      html,
      replyTo: params.email,
      logParams: {
        emailType: 'notification',
        emailCategory: 'sponsorship_admin',
        relatedEntityType: 'sponsorship',
        metadata: {
          name: params.name,
          contactName: params.contactName,
          email: params.email,
          sponsorshipType: params.sponsorshipType,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending sponsorship admin notification email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendSponsorshipReceivedEmail(params: {
  contactName: string;
  name: string;
  contactEmail: string;
}) {
  try {
    const html = await render(
      SponsorshipReceivedEmail({
        contactName: params.contactName,
        name: params.name,
      })
    );

    await sendEmail({
      to: params.contactEmail,
      subject: 'Tu solicitud de patrocinio fue recibida',
      html,
      logParams: {
        emailType: 'confirmation',
        emailCategory: 'sponsorship_received',
        toName: params.contactName,
        relatedEntityType: 'sponsorship',
        metadata: {
          name: params.name,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending sponsorship received email:', error);
    return { success: false, error: error?.message || error };
  }
}
