import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface B2BApplicationAdminEmailProps {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
}

export const B2BApplicationAdminEmail = ({
  companyName,
  contactName,
  contactEmail,
  contactPhone,
  taxId,
}: B2BApplicationAdminEmailProps) => {
  return (
    <EmailShell preview="Nueva postulacion B2B">
      <Heading style={baseStyles.heading}>Nueva postulacion B2B</Heading>
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Empresa:</strong> {companyName}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Contacto:</strong> {contactName}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Email:</strong> {contactEmail}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Telefono:</strong> {contactPhone}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>RUT:</strong> {taxId}
        </Text>
      </Section>
      <Text style={baseStyles.paragraph}>
        Puedes revisar la postulacion en el panel B2B.
      </Text>
    </EmailShell>
  );
};

export default B2BApplicationAdminEmail;
