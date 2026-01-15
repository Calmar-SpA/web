"use client"

import { Link, usePathname } from "@/navigation"
import { Button } from "@calmar/ui"
import { useTranslations } from "next-intl"
import dynamic from 'next/dynamic'

const LanguageSwitcher = dynamic(() => import("./language-switcher").then(mod => ({ default: mod.LanguageSwitcher })), {
  ssr: false,
  loading: () => <div className="w-9 h-9 rounded-full animate-pulse bg-slate-100" />
})

const CartDrawer = dynamic(() => import("../checkout/cart-drawer").then(mod => mod.CartDrawer), {
  ssr: false,
  loading: () => <div className="w-10 h-10 border border-slate-100 rounded-lg animate-pulse" />
})

import Image from "next/image"

export function Header() {
  const pathname = usePathname()
  const t = useTranslations("Navigation")
  
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  
  const navLinks = [
    { name: capitalize(t("shop")), href: "/shop" },
    { name: capitalize(t("about")), href: "/about" },
    { name: capitalize(t("contact")), href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md">
      <div className="w-[90%] max-w-7xl mx-auto h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image 
            src="https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/logo-calmar-header.webp" 
            alt="CALMAR" 
            width={120} 
            height={40} 
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-base font-bold transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-foreground/80"
              }`}
              style={{ fontFamily: 'var(--font-zalando), ui-sans-serif, system-ui, sans-serif' }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <Link href="/account" className="hidden sm:block">
            <Button variant="ghost" className="text-base font-bold hover:text-primary" style={{ fontFamily: 'var(--font-zalando), ui-sans-serif, system-ui, sans-serif' }}>
              {t("account").charAt(0).toUpperCase() + t("account").slice(1).toLowerCase()}
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
