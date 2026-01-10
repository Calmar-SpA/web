import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ContactConfirmationEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactConfirmationEmail = ({
  name,
  email,
  subject,
  message,
}: ContactConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Hemos recibido tu mensaje - Calmar</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.png"
              alt="Calmar"
              width="200"
              height="auto"
              style={logo}
            />
          </Section>
          <Section style={content}>
            <Heading style={h2}>¡Gracias por contactarnos!</Heading>
            <Text style={paragraph}>
              Hola <strong>{name}</strong>,
            </Text>
            <Text style={paragraph}>
              Hemos recibido tu mensaje y nuestro equipo lo revisará a la brevedad.
              Normalmente respondemos en un plazo de 24 a 48 horas hábiles.
            </Text>
            <Section style={summaryBox}>
              <Text style={summaryTitle}>Resumen de tu mensaje:</Text>
              <Text style={summaryItem}>
                <strong>Asunto:</strong> {subject}
              </Text>
              <Text style={summaryItem}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={summaryItem}>
                <strong>Mensaje:</strong>
              </Text>
              <Text style={messageText}>{message}</Text>
            </Section>
            <Text style={paragraph}>
              Si necesitas ayuda urgente, también puedes contactarnos en:{" "}
              <Link href="mailto:contacto@calmar.cl" style={link}>
                contacto@calmar.cl
              </Link>
            </Text>
            <Section style={btnContainer}>
              <Link
                style={button}
                href="https://www.calmar.cl"
              >
                Volver al sitio
              </Link>
            </Section>
            <Text style={paragraph}>
              Atentamente,<br />
              El equipo de Calmar
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Calmar SpA • Agua de Mar Premium & Hidratación Avanzada
            </Text>
            <Text style={footerText}>
              Chile
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactConfirmationEmail;

const main = {
  backgroundColor: "#DBDBCE",
  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  backgroundColor: "#DBDBCE",
};

const header = {
  textAlign: "center" as const,
  padding: "20px 0",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const h2 = {
  color: "#343431",
  fontSize: "24px",
  fontWeight: "700",
  margin: "30px 0 20px",
  textAlign: "center" as const,
};

const content = {
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const paragraph = {
  color: "#343431",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const summaryBox = {
  backgroundColor: "#F5F5F0",
  padding: "20px",
  borderRadius: "6px",
  margin: "24px 0",
  borderLeft: "4px solid #62A49E",
};

const summaryTitle = {
  color: "#1D504B",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const summaryItem = {
  color: "#343431",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "8px 0",
};

const messageText = {
  color: "#343431",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "8px 0",
  padding: "12px",
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  whiteSpace: "pre-wrap" as const,
};

const link = {
  color: "#62A49E",
  textDecoration: "underline",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#62A49E",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  textAlign: "center" as const,
  padding: "30px 0",
};

const footerText = {
  color: "#343431",
  fontSize: "12px",
  margin: "4px 0",
  opacity: 0.7,
};
