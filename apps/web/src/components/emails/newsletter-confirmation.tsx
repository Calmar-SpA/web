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

interface NewsletterConfirmationEmailProps {
  email: string;
}

export const NewsletterConfirmationEmail = ({
  email,
}: NewsletterConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a la comunidad Calmar</Preview>
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
            <Heading style={h2}>¡Gracias por unirte!</Heading>
            <Text style={paragraph}>
              Hola,
            </Text>
            <Text style={paragraph}>
              Gracias por suscribirte a nuestro boletín. Estamos felices de tenerte con nosotros.
              A partir de ahora, serás el primero en enterarte de nuestras novedades,
              lanzamientos de productos premium y consejos exclusivos sobre 
              hidratación avanzada y suplementación de alto nivel.
            </Text>
            <Text style={paragraph}>
              Has registrado el correo: <strong>{email}</strong>
            </Text>
            <Section style={btnContainer}>
              <Link
                style={button}
                href="https://www.calmar.cl/shop"
              >
                Explorar la Tienda
              </Link>
            </Section>
            <Text style={paragraph}>
              Si tienes alguna duda, simplemente responde a este correo.
            </Text>
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

export default NewsletterConfirmationEmail;

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

const h1 = {
  color: "#1D504B",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0",
  textAlign: "center" as const,
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
