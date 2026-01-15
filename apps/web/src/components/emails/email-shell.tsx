import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailShellProps {
  preview: string;
  children: React.ReactNode;
}

export const brand = {
  primaryDark: "#1D504B",
  primary: "#62A49E",
  primaryLight: "#A5C1B1",
  accent: "#86651D",
  text: "#343431",
  background: "#FFFFFF",
  muted: "#F5F5F0",
};

export const baseStyles = {
  main: {
    backgroundColor: brand.background,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "24px 16px",
    backgroundColor: brand.background,
    maxWidth: "600px",
    width: "100%",
  },
  header: {
    textAlign: "center" as const,
    padding: "12px 0 20px",
  },
  logo: {
    margin: "0 auto",
    display: "block",
  },
  content: {
    backgroundColor: brand.background,
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
  },
  footer: {
    textAlign: "center" as const,
    padding: "24px 0 0",
  },
  footerText: {
    color: brand.text,
    fontSize: "12px",
    margin: "4px 0",
    opacity: 0.7,
  },
  heading: {
    color: brand.text,
    fontSize: "26px",
    fontWeight: "700",
    margin: "12px 0 16px",
    textAlign: "center" as const,
    fontFamily: '"Zalando Sans Expanded", sans-serif',
  },
  paragraph: {
    color: brand.text,
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "12px 0",
  },
  subtle: {
    color: brand.text,
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "8px 0",
    opacity: 0.8,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: "4px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
  },
  buttonOutline: {
    backgroundColor: brand.background,
    borderRadius: "4px",
    color: brand.primaryDark,
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
    border: `1px solid ${brand.primaryLight}`,
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: brand.primaryLight,
    color: brand.primaryDark,
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  highlightBox: {
    backgroundColor: brand.muted,
    padding: "16px",
    borderRadius: "8px",
    margin: "16px 0",
    borderLeft: `4px solid ${brand.primary}`,
  },
  listItem: {
    color: brand.text,
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "6px 0",
  },
};

const LOGO_URL =
  "https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/CALMAR%20Sin%20Fondo.png";

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Zalando+Sans+Expanded:wght@300;400;500;600;700;800;900&display=swap');
`;

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Zalando+Sans+Expanded:wght@300;400;500;600;700;800;900&display=swap";

export const EmailShell = ({ preview, children }: EmailShellProps) => {
  return (
    <Html>
      <Head>
        <link rel="stylesheet" href={FONT_LINK} />
        <style>{FONT_IMPORT}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.header}>
            <Img
              src={LOGO_URL}
              alt="Calmar"
              width="200"
              height="auto"
              style={baseStyles.logo}
            />
          </Section>
          <Section style={baseStyles.content}>{children}</Section>
          <Section style={baseStyles.footer}>
            <Text style={baseStyles.footerText}>
              © 2026 Calmar SpA • Agua de Mar Premium e hidratacion avanzada
            </Text>
            <Text style={baseStyles.footerText}>Chile</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailShell;
