import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface ProspectAdminNotificationEmailProps {
  contactName: string;
  email: string;
  phone?: string | null;
  type: string;
  companyName?: string | null;
  taxId?: string | null;
  notes?: string | null;
}

export const ProspectAdminNotificationEmail = ({
  contactName,
  email,
  phone,
  type,
  companyName,
  taxId,
  notes,
}: ProspectAdminNotificationEmailProps) => {
  return (
    <EmailShell preview="Nuevo prospecto registrado">
      <Heading style={baseStyles.heading}>Nuevo prospecto</Heading>
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Tipo:</strong> {type}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Contacto:</strong> {contactName}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Email:</strong> {email}
        </Text>
        {phone ? (
          <Text style={baseStyles.listItem}>
            <strong>Telefono:</strong> {phone}
          </Text>
        ) : null}
        {companyName ? (
          <Text style={baseStyles.listItem}>
            <strong>Empresa:</strong> {companyName}
          </Text>
        ) : null}
        {taxId ? (
          <Text style={baseStyles.listItem}>
            <strong>RUT:</strong> {taxId}
          </Text>
        ) : null}
      </Section>
      {notes ? <Text style={baseStyles.subtle}>Notas: {notes}</Text> : null}
    </EmailShell>
  );
};

export default ProspectAdminNotificationEmail;
