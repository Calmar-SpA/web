export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Layout limpio para páginas de autenticación (sin sidebar)
  return <>{children}</>;
}
