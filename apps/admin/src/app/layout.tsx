import type { Metadata } from "next";
import { Inter, Zalando_Sans_Expanded } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";

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
      <body className={`${zalando.variable} ${inter.variable} antialiased bg-slate-50 min-h-screen flex font-sans`}>
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 md:ml-0">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 sticky top-0 z-30 shadow-sm">
             <div className="flex-1" />
             <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-calmar-primary/10 flex items-center justify-center text-calmar-primary font-bold text-xs">
                  AD
                </div>
                <span className="text-sm font-bold text-calmar-text hidden sm:inline">Administrador</span>
             </div>
          </header>
          <div className="overflow-auto flex-1">
            {children}
          </div>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
