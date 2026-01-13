import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Package, ShoppingCart, LayoutDashboard, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CALMAR | Admin Panel",
  description: "Panel de administración de Calmar SpA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen flex`}>
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen hidden md:flex">
          <div className="p-8">
            <Image 
              src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
              alt="CALMAR" 
              width={140} 
              height={40} 
              className="h-10 w-auto object-contain invert"
            />
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Admin Panel</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <LayoutDashboard className="w-4 h-4 text-calmar-mint" /> Dashboard
            </Link>
            <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <ShoppingCart className="w-4 h-4 text-calmar-ocean" /> Pedidos
            </Link>
            <Link href="/products" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium">
              <Package className="w-4 h-4 text-amber-500" /> Productos
            </Link>
          </nav>

          <div className="p-4 border-t border-white/5">
            <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-30">
             <div className="flex-1" />
             <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-calmar-ocean/10 flex items-center justify-center text-calmar-ocean font-bold text-xs">
                  AD
                </div>
                <span className="text-sm font-bold text-slate-700">Administrador</span>
             </div>
          </header>
          <div className="overflow-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
