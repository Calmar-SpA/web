import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface SponsorshipAdminNotificationEmailProps {
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
}

export const SponsorshipAdminNotificationEmail = ({
  applicantType,
  name,
  contactName,
  email,
  phone,
  socialInstagram,
  socialTiktok,
  socialYoutube,
  socialOther,
  audienceSize,
  proposal,
  sponsorshipType,
  budgetRequested,
}: SponsorshipAdminNotificationEmailProps) => {
  const applicantTypeLabels: Record<string, string> = {
    evento: "Evento",
    deportista: "Deportista",
    organizacion: "Organización",
    influencer: "Influencer",
    otro: "Otro",
  };

  const sponsorshipTypeLabels: Record<string, string> = {
    canje: "Canje",
    monetario: "Monetario",
    mixto: "Mixto",
    otro: "Otro",
  };

  return (
    <EmailShell preview="Nueva solicitud de patrocinio">
      <Heading style={baseStyles.heading}>Nueva solicitud de patrocinio</Heading>
      
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Tipo:</strong> {applicantTypeLabels[applicantType] || applicantType}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Nombre:</strong> {name}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Contacto:</strong> {contactName}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Email:</strong> {email}
        </Text>
        {phone && (
          <Text style={baseStyles.listItem}>
            <strong>Teléfono:</strong> {phone}
          </Text>
        )}
      </Section>

      {(socialInstagram || socialTiktok || socialYoutube || socialOther) && (
        <Section style={baseStyles.section}>
          <Text style={{ ...baseStyles.paragraph, fontWeight: "bold" }}>
            Redes Sociales:
          </Text>
          {socialInstagram && (
            <Text style={baseStyles.listItem}>
              <strong>Instagram:</strong> {socialInstagram}
            </Text>
          )}
          {socialTiktok && (
            <Text style={baseStyles.listItem}>
              <strong>TikTok:</strong> {socialTiktok}
            </Text>
          )}
          {socialYoutube && (
            <Text style={baseStyles.listItem}>
              <strong>YouTube:</strong> {socialYoutube}
            </Text>
          )}
          {socialOther && (
            <Text style={baseStyles.listItem}>
              <strong>Otras:</strong> {socialOther}
            </Text>
          )}
        </Section>
      )}

      {audienceSize && (
        <Text style={baseStyles.paragraph}>
          <strong>Alcance estimado:</strong> {audienceSize}
        </Text>
      )}

      <Section style={baseStyles.section}>
        <Text style={{ ...baseStyles.paragraph, fontWeight: "bold" }}>
          Propuesta:
        </Text>
        <Text style={baseStyles.paragraph}>{proposal}</Text>
      </Section>

      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Modalidad de auspicio:</strong>{" "}
          {sponsorshipTypeLabels[sponsorshipType] || sponsorshipType}
        </Text>
        {budgetRequested && (
          <Text style={baseStyles.listItem}>
            <strong>Monto solicitado:</strong> ${budgetRequested.toLocaleString("es-CL")} CLP
          </Text>
        )}
      </Section>

      <Text style={baseStyles.paragraph}>
        Puedes revisar y gestionar esta solicitud en el panel de administración.
      </Text>
    </EmailShell>
  );
};

export default SponsorshipAdminNotificationEmail;
