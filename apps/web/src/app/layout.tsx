import type { Metadata } from "next";
import { Inter, Zalando_Sans_Expanded } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const zalando = Zalando_Sans_Expanded({
  variable: "--font-zalando",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = "https://calmar.cl";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "CALMAR | Hidratación Premium",
    template: "%s | CALMAR",
  },
  description: "Cambia tu agua, cambia tu vida. Agua de mar y vertiente para una hidratación óptima. Minerales esenciales para tu bienestar.",
  keywords: ["agua de mar", "hidratación", "agua premium", "minerales", "salud", "bienestar", "Chile", "agua natural"],
  authors: [{ name: "CALMAR" }],
  creator: "CALMAR",
  publisher: "CALMAR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    alternateLocale: "en_US",
    url: baseUrl,
    siteName: "CALMAR",
    title: "CALMAR | Hidratación Premium",
    description: "Cambia tu agua, cambia tu vida. Agua de mar y vertiente para una hidratación óptima.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CALMAR - Hidratación Premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CALMAR | Hidratación Premium",
    description: "Cambia tu agua, cambia tu vida. Agua de mar y vertiente para una hidratación óptima.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    // Agregar cuando se configuren:
    // google: "tu-codigo-de-verificacion-google",
    // yandex: "tu-codigo-yandex",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${zalando.variable} ${inter.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        {children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
