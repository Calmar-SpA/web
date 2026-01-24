# 🔧 Calmar Admin (Panel Interno)

Panel de administración para operaciones internas. UI moderna, minimalista y **mobile-first**.

## 🚀 Desarrollo

```bash
# Desde la raíz del monorepo
npm run dev:admin
```

Abrir `http://localhost:3003`.

## 🧩 Stack Principal

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + DB)

## 🔐 Variables de Entorno (resumen)

Se comparten con la app web, definidas en el `README.md` raíz. Algunas claves:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`

## 🗂️ Estructura Relevante

- `src/app` - Rutas y páginas
- `src/components` - UI reutilizable
- `src/lib` - Servicios y helpers

## 📌 Notas

- Tipografías cargadas con `next/font`: **Zalando Sans Expanded** y **Inter**.
- Para configuración global del proyecto, ver `README.md` en la raíz.
