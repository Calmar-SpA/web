import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { VersionChecker } from "@/components/version-checker";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
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
      <VersionChecker />
      <Toaster position="top-right" />
    </div>
  );
}
