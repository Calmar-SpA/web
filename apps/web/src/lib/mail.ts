import sendgrid from '@sendgrid/mail';
import { render } from '@react-email/render';
import NewsletterConfirmationEmail from '@/components/emails/newsletter-confirmation';

// Configure SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendNewsletterConfirmation(email: string) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key is missing. Email skipped.');
      return { success: false, error: 'Missing API key' };
    }

    // Render React Email template to HTML
    const html = await render(NewsletterConfirmationEmail({ email }));

    const msg = {
      to: email,
      from: 'Notificaciones Calmar <notificaciones@calmar.cl>', // Must be verified in SendGrid
      subject: '¡Bienvenido a Calmar! Confirmación de suscripción',
      html,
    };

    await sendgrid.send(msg);
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
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key is missing. Email skipped.');
      return { success: false, error: 'Missing API key' };
    }

    // Import the contact confirmation email template
    const ContactConfirmationEmail = (await import('@/components/emails/contact-confirmation')).default;
    
    // Render React Email template to HTML
    const html = await render(ContactConfirmationEmail({ name, email, subject, message }));

    const msg = {
      to: email,
      from: 'Notificaciones Calmar <notificaciones@calmar.cl>',
      subject: 'Hemos recibido tu mensaje - Calmar',
      html,
    };

    await sendgrid.send(msg);
    console.log(`Contact confirmation email sent to ${email}`);

    return { success: true };
  } catch (error: any) {
    console.error('Exception sending contact confirmation email:', error);
    return { success: false, error: error?.message || error };
  }
}
