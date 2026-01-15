import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

interface AdminOrderNotificationEmailProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  paymentMethod: string;
  shippingSummary: string;
}

export const AdminOrderNotificationEmail = ({
  orderNumber,
  customerName,
  customerEmail,
  totalAmount,
  paymentMethod,
  shippingSummary,
}: AdminOrderNotificationEmailProps) => {
  return (
    <EmailShell preview={`Nueva compra ${orderNumber}`}>
      <Heading style={baseStyles.heading}>Nueva compra recibida</Heading>
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Pedido:</strong> {orderNumber}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Total:</strong> {totalAmount}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Pago:</strong> {paymentMethod}
        </Text>
      </Section>
      <Text style={baseStyles.paragraph}>
        <strong>Cliente</strong>
      </Text>
      <Text style={baseStyles.listItem}>{customerName}</Text>
      <Text style={baseStyles.listItem}>{customerEmail}</Text>
      <Text style={baseStyles.paragraph}>
        <strong>Envio</strong>
      </Text>
      <Text style={baseStyles.listItem}>{shippingSummary}</Text>
    </EmailShell>
  );
};

export default AdminOrderNotificationEmail;
