"use client"

import { Link, usePathname } from "@/navigation"
import { Button, Input, RutInput, Sheet, SheetContent, SheetTitle, SheetTrigger } from "@calmar/ui"
import { useTranslations } from "next-intl"
import dynamic from 'next/dynamic'
import { useActionState, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { completeProfile, type CompleteProfileState } from "@/actions/complete-profile"

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
  const profileT = useTranslations("ProfileCompletion")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRut, setUserRut] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileState, profileAction, isProfilePending] = useActionState<CompleteProfileState, FormData>(
    completeProfile,
    { success: false }
  )
  
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  
  const navLinks = [
    { name: capitalize(t("shop")), href: "/shop" },
    { name: capitalize(t("about")), href: "/about" },
    { name: capitalize(t("contact")), href: "/contact" },
  ]

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return

      if (!user?.email) {
        setUserEmail(null)
        setUserName(null)
        setUserRut(null)
        setIsProfileModalOpen(false)
        return
      }

      setUserEmail(user.email)

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, rut')
        .eq('id', user.id)
        .single()

      if (isMounted) {
        setUserName(profile?.full_name ?? null)
        setUserRut(profile?.rut ?? null)
        const needsProfile = !profile?.full_name || !profile?.rut
        setIsProfileModalOpen(needsProfile)
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!profileState?.success) return
    setUserName(profileState.full_name ?? null)
    setUserRut(profileState.rut ?? null)
    setIsProfileModalOpen(false)
  }, [profileState])

  const displayName = userName || userEmail || ""
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const hasUser = Boolean(userEmail)

  const profileErrorMessage = (() => {
    if (!profileState?.error) return null
    if (profileState.error === 'full_name') return profileT("errorFullName")
    if (profileState.error === 'rut') return profileT("errorRut")
    if (profileState.error === 'rut_exists') return profileT("errorRutExists")
    if (profileState.error === 'session') return profileT("errorSession")
    return profileT("errorGeneric")
  })()

  return (
    <>
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
          
          {hasUser ? (
            <Link href="/account" className="hidden sm:flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-calmar-primary/10 flex items-center justify-center text-calmar-primary text-xs font-bold">
                {initials || "U"}
              </div>
              <div className="leading-tight">
                <span className="block text-xs font-bold text-foreground">
                  {displayName}
                </span>
                <span className="block text-[11px] text-foreground/60">
                  {userEmail}
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/account" className="hidden sm:block">
              <Button variant="ghost" className="text-base font-bold hover:text-primary" style={{ fontFamily: 'var(--font-zalando), ui-sans-serif, system-ui, sans-serif' }}>
                {t("account").charAt(0).toUpperCase() + t("account").slice(1).toLowerCase()}
              </Button>
            </Link>
          )}
          <CartDrawer />
          
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2" aria-label="Abrir menú">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
              <div className="p-6 border-b flex items-center justify-between">
                <SheetTitle className="text-base font-bold">Menú</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-slate-100 h-8 w-8 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <div className="relative w-4 h-4">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-900 rotate-45 transform -translate-y-1/2 rounded-full" />
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-900 -rotate-45 transform -translate-y-1/2 rounded-full" />
                  </div>
                </Button>
              </div>
              <nav className="p-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-bold text-foreground/90 hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--font-zalando), ui-sans-serif, system-ui, sans-serif' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
              <div className="px-6 pb-6">
                <div className="h-px w-full bg-slate-100 mb-4" />
                {hasUser ? (
                  <Link
                    href="/account"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-9 h-9 rounded-full bg-calmar-primary/10 flex items-center justify-center text-calmar-primary text-xs font-bold">
                      {initials || "U"}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-foreground truncate">
                        {displayName}
                      </span>
                      <span className="block text-xs text-foreground/60 truncate">
                        {userEmail}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    className="text-base font-bold text-foreground/80 hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--font-zalando), ui-sans-serif, system-ui, sans-serif' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("account").charAt(0).toUpperCase() + t("account").slice(1).toLowerCase()}
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </header>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">{profileT("title")}</h2>
              <p className="text-sm text-slate-500">{profileT("description")}</p>
            </div>
            <form action={profileAction} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="profile-full-name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {profileT("fullName")}
                </label>
                <Input
                  id="profile-full-name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder={profileT("fullNamePlaceholder")}
                  defaultValue={userName ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="profile-rut" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {profileT("rut")}
                </label>
                <RutInput
                  id="profile-rut"
                  name="rut"
                  placeholder={profileT("rutPlaceholder")}
                  defaultValue={userRut ?? ""}
                  required
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {profileT("rutHelp")}
                </p>
              </div>
              {profileErrorMessage && (
                <p className="text-xs font-semibold text-red-500">{profileErrorMessage}</p>
              )}
              <Button
                type="submit"
                disabled={isProfilePending}
                className="w-full bg-slate-900 text-white font-bold uppercase text-xs tracking-widest"
              >
                {isProfilePending ? profileT("saving") : profileT("save")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
