import type { Metadata } from "next";
import { Zalando_Sans_Expanded, Inter } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Footer } from "@/components/layout/footer";

const zalando = Zalando_Sans_Expanded({
  variable: "--font-zalando",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checkout | CALMAR",
  description: "Completa tu compra en Calmar",
};

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set the default locale for this fallback route
  setRequestLocale('es');
  
  const messages = await getMessages();

  return (
    <html lang="es">
      <body
        className={`${zalando.variable} ${inter.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Toaster />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
