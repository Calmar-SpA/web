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
  Menu,
  X,
  UsersRound,
  Mail,
  Tag,
  Boxes,
  Truck,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("adminSidebarCollapsed")
    if (stored) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", String(isCollapsed))
  }, [isCollapsed])

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-calmar-mint" },
    { href: "/orders", label: "Pedidos", icon: ShoppingCart, color: "text-calmar-ocean" },
    { href: "/products", label: "Productos", icon: Package, color: "text-calmar-primary" },
    { href: "/inventory", label: "Inventario", icon: Boxes, color: "text-calmar-primary-light" },
    { href: "/suppliers", label: "Proveedores", icon: Truck, color: "text-calmar-mint" },
    { href: "/discount-codes", label: "Códigos", icon: Tag, color: "text-calmar-mint" },
    { href: "/crm", label: "CRM", icon: UsersRound, color: "text-calmar-accent" },
    { href: "/media", label: "Media", icon: Film, color: "text-calmar-accent" },
    { href: "/users", label: "Usuarios", icon: Users, color: "text-calmar-mint" },
    { href: "/email-tests", label: "Emails", icon: Mail, color: "text-calmar-primary" },
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
        w-64 ${isCollapsed ? "md:w-16" : "md:w-64"} h-screen
        bg-[#1d504b]
        text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`p-8 ${isCollapsed ? "md:px-3 md:py-6" : ""}`}>
          <div className={`flex ${isCollapsed ? "md:justify-center" : ""}`}>
            <Image 
              src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
              alt="CALMAR" 
              width={isCollapsed ? 32 : 140} 
              height={40} 
              className={`h-10 w-auto object-contain invert ${isCollapsed ? "md:h-8" : ""}`}
            />
          </div>
          <p className={`text-xs font-semibold text-emerald-200/70 tracking-wide mt-2 ${isCollapsed ? "md:hidden" : ""}`}>
            Admin Panel
          </p>
        </div>
        
        <nav className="flex-1 px-4 overflow-visible">
          <div className={`space-y-2 ${isCollapsed ? "md:space-y-1" : ""}`}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold tracking-tight
                    ${isCollapsed ? "md:justify-center md:px-2 md:py-2 md:gap-0" : ""}
                    ${active 
                      ? 'bg-emerald-500/20 text-white border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                      : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${isCollapsed ? "md:w-7 md:h-7" : ""} ${active ? 'text-emerald-400' : 'text-emerald-100/40'}`}
                  />
                  <span className={isCollapsed ? "md:hidden" : ""}>{item.label}</span>
                  
                  {isCollapsed && (
                    <div className="
                      absolute left-full top-1/2 -translate-y-1/2 ml-4
                      px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 transform scale-95 group-hover:scale-100
                      pointer-events-none whitespace-nowrap shadow-xl border border-white/10
                      hidden md:block z-[100]
                    ">
                      {item.label}
                      {/* Arrow */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className={`p-4 border-t border-white/5 space-y-2 ${isCollapsed ? "md:pt-3" : ""}`}>
          <button
            className={`
              group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl
              hover:bg-red-500/10 text-red-300 hover:text-red-100 transition-colors text-sm font-semibold tracking-tight
              ${isCollapsed ? "md:justify-center md:px-2 md:py-2 md:gap-0" : ""}
            `}
          >
            <LogOut className={`w-4 h-4 ${isCollapsed ? "md:w-7 md:h-7" : ""}`} />
            <span className={isCollapsed ? "md:hidden" : ""}>Cerrar Sesión</span>

            {isCollapsed && (
              <div className="
                absolute left-full top-1/2 -translate-y-1/2 ml-4
                px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 transform scale-95 group-hover:scale-100
                pointer-events-none whitespace-nowrap shadow-xl border border-white/10
                hidden md:block z-[100]
              ">
                Cerrar Sesión
                {/* Arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
              </div>
            )}
          </button>
        </div>
      </aside>

      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={`
          hidden md:flex items-center justify-center
          fixed top-4 z-50 h-8 w-8 rounded-full
          bg-white text-calmar-primary shadow-md hover:shadow-lg transition
          ${isCollapsed ? "left-16 ml-2" : "left-64 ml-2"}
        `}
        title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

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
