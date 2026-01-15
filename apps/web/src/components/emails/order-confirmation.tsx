import { Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles, brand } from "./email-shell";

export interface OrderEmailItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  subtotalLabel: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderStatusLabel: string;
  totalAmount: string;
  orderUrl: string;
  items: OrderEmailItem[];
}

export const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  orderStatusLabel,
  totalAmount,
  orderUrl,
  items,
}: OrderConfirmationEmailProps) => {
  return (
    <EmailShell preview={`Tu compra ${orderNumber} esta confirmada`}>
      <Heading style={baseStyles.heading}>Tu compra esta confirmada</Heading>
      <Text style={baseStyles.paragraph}>Hola {customerName},</Text>
      <Text style={baseStyles.paragraph}>
        Gracias por tu compra en Calmar. Tu pedido ya esta {orderStatusLabel}.
      </Text>
      <Section style={baseStyles.highlightBox}>
        <Text style={baseStyles.listItem}>
          <strong>Numero de pedido:</strong> {orderNumber}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Estado:</strong> {orderStatusLabel}
        </Text>
        <Text style={baseStyles.listItem}>
          <strong>Total:</strong> {totalAmount}
        </Text>
      </Section>
      <Section>
        <Text style={baseStyles.paragraph}>
          <strong>Resumen de tu compra</strong>
        </Text>
        {items.map((item, index) => (
          <Text key={`${item.name}-${index}`} style={baseStyles.listItem}>
            {item.quantity}x {item.name}
            {item.variantName ? ` (${item.variantName})` : ""} • {item.subtotalLabel}
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link style={baseStyles.button} href={orderUrl}>
          Ver mi pedido
        </Link>
      </Section>
      <Text style={baseStyles.subtle}>
        Si tienes alguna duda, responde a este correo.
      </Text>
      <Text style={baseStyles.subtle}>
        Equipo Calmar
      </Text>
      <Text style={{ ...baseStyles.subtle, color: brand.primaryDark }}>
        contacto@calmar.cl
      </Text>
    </EmailShell>
  );
};

export default OrderConfirmationEmail;
