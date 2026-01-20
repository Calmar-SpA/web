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
  Receipt,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { SidebarTooltip } from "./sidebar-tooltip"

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
    { href: "/purchases", label: "Compras", icon: Receipt, color: "text-calmar-primary" },
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
        w-64 ${isCollapsed ? "md:w-20" : "md:w-64"} h-screen
        bg-[#1d504b]
        text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`flex-shrink-0 p-8 ${isCollapsed ? "md:px-3 md:py-6" : ""}`}>
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
        
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll">
          <div className="space-y-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <SidebarTooltip key={item.href} content={item.label} enabled={isCollapsed}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold tracking-tight
                      ${isCollapsed ? "md:justify-center md:px-3 md:py-3 md:gap-0" : ""}
                      ${active 
                        ? 'bg-emerald-500/20 text-white border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${active ? 'text-emerald-400' : 'text-emerald-100/40'}`}
                    />
                    <span className={isCollapsed ? "md:hidden" : ""}>{item.label}</span>
                  </Link>
                </SidebarTooltip>
              )
            })}
          </div>
        </nav>

        <div className={`flex-shrink-0 p-4 border-t border-white/5 ${isCollapsed ? "md:pt-3" : ""}`}>
          <SidebarTooltip content="Cerrar Sesión" enabled={isCollapsed}>
            <button
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl
                hover:bg-red-500/10 text-red-300 hover:text-red-100 transition-colors text-sm font-semibold tracking-tight
                ${isCollapsed ? "md:justify-center md:px-3 md:py-3 md:gap-0" : ""}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={isCollapsed ? "md:hidden" : ""}>Cerrar Sesión</span>
            </button>
          </SidebarTooltip>
        </div>
      </aside>

      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={`
          hidden md:flex items-center justify-center
          fixed top-4 z-50 h-8 w-8 rounded-full
          bg-white text-calmar-primary shadow-md hover:shadow-lg transition
          ${isCollapsed ? "left-20 ml-2" : "left-64 ml-2"}
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
