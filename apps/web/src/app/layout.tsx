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
  title: "CALMAR | Hidratación Premium",
  description: "Cambia tu agua, cambia tu vida. Agua de mar y vertiente para una hidratación óptima.",
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
      </body>
    </html>
  );
}
