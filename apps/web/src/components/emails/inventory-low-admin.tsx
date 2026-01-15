import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, baseStyles } from "./email-shell";

export interface LowInventoryItem {
  productName: string;
  variantName?: string | null;
  stockQuantity: number;
}

interface InventoryLowAdminEmailProps {
  threshold: number;
  items: LowInventoryItem[];
}

export const InventoryLowAdminEmail = ({
  threshold,
  items,
}: InventoryLowAdminEmailProps) => {
  return (
    <EmailShell preview="Alerta de inventario bajo">
      <Heading style={baseStyles.heading}>Inventario bajo</Heading>
      <Text style={baseStyles.paragraph}>
        Productos con stock igual o menor a {threshold}.
      </Text>
      <Section style={baseStyles.highlightBox}>
        {items.map((item, index) => (
          <Text key={`${item.productName}-${index}`} style={baseStyles.listItem}>
            {item.productName}
            {item.variantName ? ` (${item.variantName})` : ""} • Stock:{" "}
            {item.stockQuantity}
          </Text>
        ))}
      </Section>
    </EmailShell>
  );
};

export default InventoryLowAdminEmail;
