# 🌐 Calmar Web (Tienda Online)

Aplicación principal para clientes finales. UI moderna, minimalista y **mobile-first**.

## 🚀 Desarrollo

```bash
# Desde la raíz del monorepo
npm run dev:web
```

Abrir `http://localhost:3002`.

## 🧩 Stack Principal

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- next-intl (i18n)
- Supabase (Auth + DB)
- Flow (pagos)
- Blue Express (tarifario)
- Chilexpress (cotización/envíos)

## 🔐 Variables de Entorno (resumen)

Se requieren las mismas variables declaradas en el `README.md` raíz. Algunas claves:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`
- `CHILEXPRESS_RATING_API_KEY`, `CHILEXPRESS_TRANSPORT_API_KEY`, `CHILEXPRESS_GEOREFERENCE_API_KEY`
- `CHILEXPRESS_BASE_URL`, `CHILEXPRESS_TCC`, `CHILEXPRESS_ORIGIN_CODE`

## 🗂️ Estructura Relevante

- `src/app` - Rutas y páginas
- `src/components` - UI reutilizable
- `src/lib` - Integraciones (Flow, Blue Express, Chilexpress)
- `messages` - Traducciones (i18n)

## 📌 Notas

- Tipografías cargadas con `next/font`: **Zalando Sans Expanded** y **Inter**.
- Para configuración global del proyecto, ver `README.md` en la raíz.
