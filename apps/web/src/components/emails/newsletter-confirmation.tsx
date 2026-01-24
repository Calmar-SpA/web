import {
  Heading,
  Link,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface NewsletterConfirmationEmailProps {
  email: string;
}

export const NewsletterConfirmationEmail = ({
  email,
}: NewsletterConfirmationEmailProps) => {
  return (
    <EmailShell preview="Bienvenido a la comunidad Calmar">
      <Heading style={baseStyles.heading}>¡Gracias por unirte!</Heading>
      <Text style={baseStyles.paragraph}>Hola,</Text>
      <Text style={baseStyles.paragraph}>
        Gracias por suscribirte a nuestro boletín. Estamos felices de tenerte
        con nosotros. A partir de ahora, serás el primero en enterarte de
        nuestras novedades, lanzamientos de productos premium y consejos
        exclusivos sobre hidratación avanzada y suplementación de alto nivel.
      </Text>
      <Text style={baseStyles.paragraph}>
        Has registrado el correo: <strong>{email}</strong>
      </Text>
      <Section style={discountHighlight}>
        <Text style={discountText}>🎁 ¡Tu regalo de bienvenida!</Text>
        <Heading style={discountPercentage}>10% OFF</Heading>
        <Text style={discountDescription}>
          Tu descuento se aplicará <strong>automáticamente</strong> en todas tus
          compras durante el próximo año al usar tu correo <strong>{email}</strong>{" "}
          en el checkout.
        </Text>
      </Section>
      <Section style={btnContainer}>
        <Link style={baseStyles.button} href="https://www.calmar.cl/shop">
          Explorar la Tienda
        </Link>
      </Section>
      <Text style={baseStyles.paragraph}>
        Si tienes alguna duda, simplemente responde a este correo.
      </Text>
      <Text style={baseStyles.paragraph}>
        Atentamente,
        <br />
        El equipo de Calmar
      </Text>
    </EmailShell>
  );
};

export default NewsletterConfirmationEmail;

const discountHighlight = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "12px",
  border: "2px dashed #62A49E",
  textAlign: "center" as const,
  margin: "24px 0",
};

const discountText = {
  color: "#62A49E",
  fontSize: "14px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 8px 0",
};

const discountPercentage = {
  color: "#1D504B",
  fontSize: "48px",
  fontWeight: "900",
  margin: "0 0 8px 0",
  lineHeight: "1",
  fontFamily: '"Zalando Sans Expanded", sans-serif',
};

const discountDescription = {
  color: "#343431",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};
