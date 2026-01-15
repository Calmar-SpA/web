import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface RefundAdminNotificationEmailProps {
  referenceId: string;
  reason?: string | null;
  amountLabel?: string | null;
}

export const RefundAdminNotificationEmail = ({
  referenceId,
  reason,
  amountLabel,
}: RefundAdminNotificationEmailProps) => {
  return (
    <EmailShell preview="Notificacion de devolucion">
      <Heading style={baseStyles.heading}>Devolucion registrada</Heading>
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Referencia:</strong> {referenceId}
        </Text>
        {amountLabel ? (
          <Text style={baseStyles.listItem}>
            <strong>Monto:</strong> {amountLabel}
          </Text>
        ) : null}
        {reason ? (
          <Text style={baseStyles.listItem}>
            <strong>Motivo:</strong> {reason}
          </Text>
        ) : null}
      </Section>
    </EmailShell>
  );
};

export default RefundAdminNotificationEmail;
