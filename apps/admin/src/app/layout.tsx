import type { Metadata } from "next";
import { Inter, Zalando_Sans_Expanded } from "next/font/google";
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

export const metadata: Metadata = {
  title: "CALMAR | Admin Panel",
  description: "Panel de administración de Calmar SpA",
  icons: {
    icon: "https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/Isotipo%20circular%20admin.png",
    shortcut: "https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/Isotipo%20circular%20admin.png",
    apple: "https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/Isotipo%20circular%20admin.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${zalando.variable} ${inter.variable} antialiased bg-slate-50 min-h-screen font-sans`}>
        {children}
      </body>
    </html>
  );
}
