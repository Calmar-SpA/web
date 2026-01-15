import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface B2BApplicationReceivedEmailProps {
  contactName: string;
  companyName: string;
}

export const B2BApplicationReceivedEmail = ({
  contactName,
  companyName,
}: B2BApplicationReceivedEmailProps) => {
  return (
    <EmailShell preview="Tu postulacion B2B fue recibida">
      <Heading style={baseStyles.heading}>Postulacion B2B recibida</Heading>
      <Text style={baseStyles.paragraph}>Hola {contactName},</Text>
      <Text style={baseStyles.paragraph}>
        Recibimos tu postulacion de {companyName}. Nuestro equipo la revisara y
        te respondera lo antes posible.
      </Text>
      <Text style={baseStyles.subtle}>
        Si necesitas agregar informacion, responde a este correo.
      </Text>
    </EmailShell>
  );
};

export default B2BApplicationReceivedEmail;
