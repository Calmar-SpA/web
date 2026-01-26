import { Metadata } from "next";
import { locales } from "@/i18n/config";

const baseUrl = "https://calmar.cl";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === "es" 
    ? "Contacto - Escríbenos"
    : "Contact - Get in Touch";
  
  const description = locale === "es"
    ? "¿Tienes preguntas sobre CALMAR? Contáctanos. Estamos aquí para ayudarte con cualquier consulta sobre nuestros productos de hidratación premium."
    : "Have questions about CALMAR? Contact us. We're here to help with any inquiries about our premium hydration products.";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/contact`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}/contact`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/contact`,
      locale: locale === "es" ? "es_CL" : "en_US",
    },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
