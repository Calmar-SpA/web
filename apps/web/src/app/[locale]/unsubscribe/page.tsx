import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { Button } from "@calmar/ui";
import { CheckCircle2 } from "lucide-react";

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Unsubscribe");

  return (
    <main className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-600">{t("message")}</p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="outline" className="w-full">
              {t("button")}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
