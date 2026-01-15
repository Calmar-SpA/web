'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Package, 
  ShoppingCart, 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Film,
  Building2,
  Menu,
  X
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-calmar-mint" },
    { href: "/orders", label: "Pedidos", icon: ShoppingCart, color: "text-calmar-ocean" },
    { href: "/products", label: "Productos", icon: Package, color: "text-calmar-primary" },
    { href: "/media", label: "Media", icon: Film, color: "text-calmar-accent" },
    { href: "/b2b", label: "B2B", icon: Building2, color: "text-calmar-primary-light" },
    { href: "/users", label: "Usuarios", icon: Users, color: "text-calmar-mint" },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-calmar-primary-dark text-white"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        w-64 h-screen
        bg-[#1d504b]
        text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8">
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
            alt="CALMAR" 
            width={140} 
            height={40} 
            className="h-10 w-auto object-contain invert"
          />
          <p className="text-[10px] font-black text-emerald-400/60 tracking-[0.2em] uppercase mt-2">Admin Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-black uppercase tracking-widest
                  ${active 
                    ? 'bg-emerald-500/20 text-white border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-emerald-100/40'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-300 hover:text-red-100 transition-colors text-xs font-black uppercase tracking-widest">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
