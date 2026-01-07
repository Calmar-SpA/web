"use client"

import { Link, usePathname } from "@/navigation"
import { Button } from "@calmar/ui"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "./language-switcher"
import dynamic from 'next/dynamic'

const CartDrawer = dynamic(() => import("../checkout/cart-drawer").then(mod => mod.CartDrawer), {
  ssr: false,
  loading: () => <div className="w-10 h-10 border border-slate-100 rounded-lg animate-pulse" />
})

export function Header() {
  const pathname = usePathname()
  const t = useTranslations("Navigation")
  
  const navLinks = [
    { name: t("shop").toUpperCase(), href: "/shop" },
    { name: t("about").toUpperCase(), href: "/about" },
    { name: t("contact").toUpperCase(), href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-calmar-ocean/10 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black italic tracking-tighter bg-calmar-gradient bg-clip-text text-transparent">
            CALMAR
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-xs font-bold tracking-widest transition-colors hover:text-calmar-ocean ${
                pathname === link.href ? "text-calmar-ocean" : "text-slate-600"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <Link href="/account" className="hidden sm:block">
            <Button variant="ghost" className="text-xs font-bold tracking-widest hover:text-calmar-ocean">
              {t("account").toUpperCase()}
            </Button>
          </Link>
          <CartDrawer />
          
          {/* Mobile Menu Button - Placeholder */}
          <Button variant="ghost" className="md:hidden p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </Button>
        </div>
      </div>
    </header>
  )
}
