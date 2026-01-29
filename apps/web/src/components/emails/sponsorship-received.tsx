import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface SponsorshipReceivedEmailProps {
  contactName: string;
  name: string;
}

export const SponsorshipReceivedEmail = ({
  contactName,
  name,
}: SponsorshipReceivedEmailProps) => {
  return (
    <EmailShell preview="Tu solicitud de patrocinio fue recibida">
      <Heading style={baseStyles.heading}>Solicitud de patrocinio recibida</Heading>
      <Text style={baseStyles.paragraph}>Hola {contactName},</Text>
      <Text style={baseStyles.paragraph}>
        Recibimos tu solicitud de patrocinio para <strong>{name}</strong>. 
        Nuestro equipo la revisará cuidadosamente y te responderá en un plazo de 5 a 7 días hábiles.
      </Text>
      <Text style={baseStyles.paragraph}>
        En CALMAR valoramos la autenticidad y buscamos colaboraciones que compartan 
        nuestra visión de hidratación mineral natural. Evaluaremos tu propuesta 
        considerando la alineación con nuestros valores y el potencial de la colaboración.
      </Text>
      <Text style={baseStyles.subtle}>
        Si necesitas agregar información o tienes alguna consulta, responde a este correo.
      </Text>
    </EmailShell>
  );
};

export default SponsorshipReceivedEmail;
