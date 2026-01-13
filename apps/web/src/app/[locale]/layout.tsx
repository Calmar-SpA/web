import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { Footer } from "@/components/layout/footer";
import { ComingSoonPage } from "@/components/coming-soon";
import { hasAccess } from "@/actions/access-code";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Set the request locale for static rendering
  setRequestLocale(locale);
  
  const messages = await getMessages();
  const accessGranted = await hasAccess();

  // If no access, show coming soon page
  if (!accessGranted) {
    return (
      <NextIntlClientProvider messages={messages}>
        <ComingSoonPage />
        <Toaster />
      </NextIntlClientProvider>
    );
  }

  // Normal site for users with access
  return (
    <NextIntlClientProvider messages={messages}>
      <Header />
      <div className="flex-1">
        {children}
      </div>
      <Toaster />
      <Footer />
    </NextIntlClientProvider>
  );
}
