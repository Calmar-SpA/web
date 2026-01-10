import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
        className={`${montserrat.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
