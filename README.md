# 🌊 Calmar E-commerce Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Private-red)
![Status](https://img.shields.io/badge/status-Active-green)

> **Plataforma de e-commerce premium para hidratación avanzada y suplementación
> de alto nivel para atletas modernos.**

Calmar es una plataforma de comercio electrónico desarrollada específicamente
para Calmar SpA, una empresa chilena dedicada a la venta de agua de mar premium
y productos de hidratación avanzada.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Sistema de Diseño](#-sistema-de-diseño)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Aplicaciones](#-aplicaciones)
- [Paquetes Compartidos](#-paquetes-compartidos)
- [Configuración e Instalación](#-configuración-e-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Base de Datos](#-base-de-datos)
- [Alcances del Proyecto](#-alcances-del-proyecto)

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnología        | Versión | Propósito                                  |
| ----------------- | ------- | ------------------------------------------ |
| **Next.js**       | 16.1.1  | Framework React para aplicaciones web      |
| **React**         | 19.2.3  | Librería UI                                |
| **TypeScript**    | 5.x     | Tipado estático                            |
| **Tailwind CSS**  | 4.x     | Framework de utilidades CSS                |
| **shadcn/ui**     | -       | Sistema de componentes UI accesibles       |
| **Radix UI**      | -       | Primitivos UI sin estilos (base de shadcn) |
| **Framer Motion** | 12.x    | Animaciones y transiciones                 |
| **Zustand**       | 5.x     | Gestión de estado                          |
| **next-intl**     | 4.7.0   | Internacionalización (i18n)                |
| **next-themes**   | 0.4.6   | Gestión de temas (dark/light mode)         |
| **Lucide React**  | 0.562.0 | Sistema de iconos                          |
| **Sonner**        | 2.x     | Notificaciones toast                       |

### Backend & Base de Datos

| Tecnología                   | Propósito                    |
| ---------------------------- | ---------------------------- |
| **Supabase**                 | Backend as a Service (BaaS)  |
| **PostgreSQL**               | Base de datos relacional     |
| **Supabase Auth**            | Autenticación y autorización |
| **Row Level Security (RLS)** | Seguridad a nivel de fila    |

### Pagos

| Tecnología | Propósito                                                   |
| ---------- | ----------------------------------------------------------- |
| **Flow**   | Procesador de pagos chileno (Webpay, OnePay, Transferencia) |

### Logística & Envíos

| Tecnología       | Propósito                                              |
| ---------------- | ------------------------------------------------------ |
| **Chilexpress**  | Cotización, cobertura y generación de envíos           |
| **Blue Express** | Tarifario por zona y tamaño para cotizaciones rápidas  |

### DevOps & Herramientas

| Tecnología         | Versión | Propósito             |
| ------------------ | ------- | --------------------- |
| **Turborepo**      | 2.3.0   | Monorepo build system |
| **npm Workspaces** | -       | Gestión de monorepo   |
| **ESLint**         | 9.x     | Linting de código     |
| **Prettier**       | 3.x     | Formateo de código    |

---

## 🎨 Sistema de Diseño

### Paleta de Colores

La identidad visual de Calmar utiliza una paleta inspirada en el mar y la
naturaleza:

| Nombre               | Hex       | Uso                                                   |
| -------------------- | --------- | ----------------------------------------------------- |
| **Background**       | `#ffffff` | Color de fondo principal                              |
| **Accent/Highlight** | `#86651D` | Elementos resaltados, CTAs, acentos dorados           |
| **Primary Dark**     | `#1D504B` | Color primario oscuro, headers, elementos principales |
| **Primary**          | `#62A49E` | Color primario, botones, enlaces                      |
| **Primary Light**    | `#A5C1B1` | Color suave, fondos secundarios, hover states         |
| **Text**             | `#343431` | Color de texto principal                              |

#### Vista Previa de la Paleta

```
┌──────────────┬──────────────┬──────────────┐
│   #ffffff    │   #86651D    │   #1D504B    │
│  Background  │    Accent    │ Primary Dark │
├──────────────┼──────────────┼──────────────┤
│   #62A49E    │   #A5C1B1    │   #343431    │
│   Primary    │ Primary Light│     Text     │
└──────────────┴──────────────┴──────────────┘
```

#### Uso de Colores

- **Fondos**: Usar `#ffffff` como fondo principal para mantener la limpieza de la
  marca
- **Textos**: Usar `#343431` para máxima legibilidad sobre fondos claros
- **Acciones primarias**: Usar `#62A49E` para botones y enlaces principales
- **Acentos**: Usar `#86651D` para elementos que requieren destacar (badges,
  alertas, promociones)
- **Elementos oscuros**: Usar `#1D504B` para headers, footers y secciones de
  contraste
- **Estados hover/secundarios**: Usar `#A5C1B1` para interacciones sutiles

### Tipografía

| Fuente                  | Uso                                                     | Enlace                                                                   |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Zalando Sans Expanded** | Tipografía para títulos y encabezados (H1-H6)           | [Google Fonts](https://fonts.google.com/specimen/Zalando+Sans+Expanded)  |
| **Inter**                 | Tipografía para cuerpo de texto, párrafos y UI general  | [Google Fonts](https://fonts.google.com/specimen/Inter)                  |

#### Jerarquía Tipográfica

```
ZALANDO SANS EXPANDED (Títulos)
├── H1-H6: Regular/Medium/Bold/Black para jerarquía visual moderna y expandida
├── Uso: Headers de sección, títulos de productos, headings principales
└── Características: Sans-serif moderna, expandida, con fuerte impacto visual

INTER (Cuerpo)
├── Body: Regular para lectura óptima
├── Navigation: Regular/Medium/Bold para navegación clara
├── Buttons: Bold para CTAs
└── Características: Sans-serif moderna, versátil y altamente legible, diseñada para interfaces
```

#### Configuración CSS

```css
/* Variables de colores */
:root {
  --color-background: #ffffff;
  --color-accent: #86651d;
  --color-primary-dark: #1d504b;
  --color-primary: #62a49e;
  --color-primary-light: #a5c1b1;
  --color-text: #343431;
}

/* Tipografías */
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Zalando Sans Expanded", ui-sans-serif, system-ui, sans-serif;
}

/* Aplicación automática */
body {
  font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
}
```

---

## 🏗 Arquitectura del Proyecto

El proyecto está estructurado como un **monorepo** utilizando Turborepo y npm
workspaces:

```
calmar-ecommerce/
├── apps/
│   ├── web/           # 🌐 Tienda online (Next.js)
│   └── admin/         # 🔧 Panel de administración (Next.js)
├── packages/
│   ├── config/        # ⚙️ Configuraciones compartidas
│   ├── database/      # 🗄️ Servicios de base de datos
│   ├── types/         # 📝 Tipos TypeScript compartidos
│   ├── ui/            # 🎨 Componentes UI reutilizables
│   └── utils/         # 🔨 Utilidades compartidas (Flow, etc.)
├── supabase/
│   └── migrations/    # 📂 Migraciones de base de datos
├── turbo.json         # 🚀 Configuración Turborepo
└── package.json       # 📦 Configuración raíz
```

---

## ⚡ Funcionalidades

### 🛒 E-commerce Core

- **Catálogo de productos** con variantes (tamaños, sabores)
- **Carrito de compras** persistente con Zustand
- **Checkout** completo con soporte para usuarios anónimos (guest checkout) y múltiples métodos de pago
- **Códigos de descuento** con reglas de uso y validación
- **Integración con Flow** para pagos nacionales chilenos
- **Cálculo de envío Blue Express**
- **Cotización y creación de envíos con Chilexpress**
- **Gestión de inventario** con reservas automáticas y descuentos por pagos
- **Registro de ingresos de stock** con costo neto, IVA, factura, fechas y estado de pago
- **Gestión de proveedores** con datos tributarios y direcciones de retiro
- **Sistema de categorías** jerárquico

### 👤 Gestión de Usuarios e Identidades

- **Separación de Identidades**: El sistema distingue claramente entre la persona natural (Usuario) y la entidad legal (Empresa/Prospecto).
- **Datos Independientes**: Un usuario puede tener un RUT y Email personal, mientras que su empresa vinculada puede tener un RUT (Tax ID) y Email corporativo diferentes.
- **Registro e inicio de sesión** con Supabase Auth
- **Confirmación por email**
- **Roles de usuario**: Customer, Admin, B2B
- **Perfil de usuario** con historial de pedidos segmentado (Personal vs Empresa)
- **Identificación por RUT** para vincular compras con CRM
- **Gestión de direcciones** de envío y facturación
- **Exención de pago de envíos** por usuario desde admin

### 🏢 Programa B2B (Business to Business)

- **Postulación de empresas** al programa B2B (crea prospectos en CRM)
- **Aprobación desde CRM** con configuración comercial centralizada
- **Precios fijos por producto** para clientes B2B
- **Crédito directo** con límites configurables
- **Términos de pago** configurables (30 días, etc.)

### 📇 CRM y Prospectos

- **Pipeline de prospectos** con etapas personalizables
- **Ficha de prospectos** con datos de empresa, dirección y despacho
- **Registro de muestras, consignaciones y ventas**
- **Gestión de crédito** automática en consignaciones (descuento al crear, restauración al pagar/devolver)
- **Vinculación de compras web a prospectos por RUT**

### 🧾 Gestión Interna

- **Registro de compras internas** con categorías y estados de pago
- **Entregas de material publicitario** asociadas a clientes

### 🎁 Programa de Fidelización (Calmar Points)

- **Acumulación de puntos** por compras
- **Canje de puntos** por descuentos
- **Historial de puntos** detallado
- **Sistema de recompensas** (próximamente)
- **Expiración de puntos** configurable

### 📦 Gestión de Pedidos

- **Flujo de estados**: Pendiente → Pagado → En preparación → Enviado →
  Entregado
- **Generación de números de orden**: Formato amigable y correlativo perpetuo (ej: ORD-1001)
- **Seguimiento de envíos** con tracking
- **Historial de pedidos** para clientes con visualización unificada de compras web y movimientos CRM
- **Notificaciones** por email

### 🌍 Internacionalización

- **Soporte multiidioma** (Español como idioma principal)
- **Traducciones centralizadas** en archivos JSON
- **URLs localizadas** con prefijo de idioma
- **Formato de moneda chilena** (CLP)

### 📱 SEO y Performance

- **Sitemap automático** dinámico con productos e idiomas
- **Robots.txt** configurado con exclusiones para áreas privadas
- **Meta tags completos** por página (title, description, keywords)
- **Open Graph** para compartir en redes sociales (Facebook, LinkedIn)
- **Twitter Cards** para compartir en Twitter/X
- **JSON-LD Structured Data** para productos (Google Rich Snippets)
- **Alternates hreflang** para SEO multiidioma (ES/EN)
- **Canonical URLs** para evitar contenido duplicado
- **Web App Manifest** para PWA básica
- **Generación estática** de páginas donde sea posible
- **Aviso de nueva versión** con botón para actualizar la web

### 📰 Marketing

- **Newsletter** con suscripción por email
- **Gestión de newsletter** desde el perfil (activar/desactivar descuento)
- **Formulario de contacto** con almacenamiento en BD
- **Productos destacados** en homepage

---

## 📱 Aplicaciones

### 🌐 Web (`apps/web`) - Puerto 3002

La tienda online principal para clientes finales.

**Páginas principales:**

- `/` - Homepage con hero, beneficios y productos destacados
- `/shop` - Catálogo de productos
- `/shop/[slug]` - Detalle de producto
- `/checkout` - Proceso de compra
- `/account` - Panel de usuario con pedidos, puntos y configuración
- `/login` - Autenticación
- `/register` - Registro con datos prellenados desde CRM
- `/about` - Página "Nosotros"
- `/contact` - Formulario de contacto
- `/b2b-apply` - Postulación al programa B2B

### 🔧 Admin (`apps/admin`) - Puerto 3003

Panel de administración para gestión interna.

**Funcionalidades:**

- Gestión de productos
- Gestión de pedidos
- Gestión de códigos de descuento
- Registro de compras internas y material publicitario
- Gestión de usuarios y aprobación B2B desde CRM
- CRM de prospectos y movimientos
- Reportes y métricas

---

## 📦 Paquetes Compartidos

### `@calmar/database`

Servicios para interacción con Supabase:

- `ProductService` - CRUD de productos
- `OrderService` - Gestión de pedidos
- `LoyaltyService` - Sistema de puntos
- `CRMService` - Prospectos, interacciones y movimientos comerciales
- `DiscountCodeService` - Gestión y validación de códigos

### `@calmar/ui`

Componentes UI reutilizables:

- `Button` - Botones con variantes
- `ProductCard` - Tarjeta de producto

### `@calmar/types`

Tipos TypeScript compartidos entre aplicaciones.

### `@calmar/utils`

Utilidades compartidas:

- `FlowService` - Integración con pasarela de pagos Flow
- `ChilexpressService` - Cotización, cobertura y tracking de envíos
- `pricing` - Cálculo de neto/IVA y formateo CLP
- `rut` y `phone` - Normalización y validación de datos chilenos

### `@calmar/config`

Configuraciones compartidas para ESLint, TypeScript, etc.

---

## 🚀 Configuración e Instalación

### Prerrequisitos

- Node.js 18+
- npm 10+
- Cuenta en Supabase
- Cuenta en Flow (para pagos)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd calmar-ecommerce

# Instalar dependencias
npm install

# Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# Iniciar Supabase local (opcional)
npm run supabase:start

# Ejecutar migraciones
npm run supabase:migrate

# Iniciar desarrollo
npm run dev
```

---

## 🔐 Variables de Entorno

### Apps (web/admin)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=https://www.calmar.cl # ¡CRÍTICO! Requerido para callbacks de Flow

# Flow (Pagos)
FLOW_API_KEY=your-flow-api-key
FLOW_SECRET_KEY=your-flow-secret-key
FLOW_BASE_URL=https://www.flow.cl/api  # o https://sandbox.flow.cl/api para testing

# Chilexpress (Envíos)
CHILEXPRESS_RATING_API_KEY=your-rating-api-key
CHILEXPRESS_TRANSPORT_API_KEY=your-transport-api-key
CHILEXPRESS_GEOREFERENCE_API_KEY=your-georeference-api-key
CHILEXPRESS_BASE_URL=https://testservices.wschilexpress.com
CHILEXPRESS_TCC=your-tcc
CHILEXPRESS_ORIGIN_CODE=PUCO

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=notificaciones@calmar.cl
SENDGRID_FROM_NAME=Notificaciones Calmar
ADMIN_EMAIL=contacto@calmar.cl
```

## 💸 Integración con Flow (Pagos)

La plataforma utiliza Flow como pasarela de pagos. El flujo de pago funciona de la siguiente manera:

1. **Creación de orden**: El usuario inicia el pago, el servidor crea una orden en Flow y redirige al usuario a la URL de pago de Flow.
2. **Confirmación (Server-to-Server)**: Flow hace un POST a `urlConfirmation` (`/api/payments/flow/confirm`) con el token de la transacción. El servidor valida el pago y actualiza la base de datos.
3. **Retorno (Browser)**: Flow redirige al usuario mediante un POST a `urlReturn` (`/api/payments/flow/result`). El servidor redirige al usuario a la página de éxito o error.

### Troubleshooting de Pagos (Error 403)

Si los usuarios experimentan un error "403 - Forbidden" después de ingresar los datos de su tarjeta en Flow, generalmente se debe a una configuración incorrecta de las URLs de retorno:

1. **Verificar NEXT_PUBLIC_APP_URL**: Asegúrate de que esta variable esté configurada en Vercel con el dominio correcto (ej: `https://www.calmar.cl`). Si está vacía o apunta a localhost, Flow intentará redirigir al usuario a un destino inválido.
2. **Verificar Dominio**: Asegúrate de que el dominio configurado en `NEXT_PUBLIC_APP_URL` esté correctamente asignado a tu proyecto de Vercel. Si el dominio apunta a otro servidor (como un IIS antiguo), ese servidor rechazará el POST de Flow con un error 403.
3. **Credenciales**: Verifica que `FLOW_API_KEY`, `FLOW_SECRET_KEY` y `FLOW_BASE_URL` correspondan al ambiente correcto (producción o sandbox).

---

## ✉️ Plantillas de Email (Supabase Auth)

Las plantillas HTML para los correos de autenticacion de Supabase se encuentran en:

- `supabase/email-templates/`

Estas plantillas usan la identidad visual de Calmar (colores y tipografias) y
deben copiarse en el panel de Supabase Auth cuando se actualicen.

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar todas las apps en desarrollo
npm run dev:web          # Solo app web (puerto 3002)
npm run dev:admin        # Solo app admin (puerto 3003)

# Build
npm run build            # Build de producción

# Linting
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificación de tipos TypeScript

# Supabase
npm run supabase:start   # Iniciar Supabase local
npm run supabase:migrate # Reset y aplicar migraciones
```

---

## 🗄️ Base de Datos

### Esquema Principal (PostgreSQL en Supabase)

| Tabla                    | Descripción                               |
| ------------------------ | ----------------------------------------- |
| `users`                  | Usuarios sincronizados con auth.users (incluye dirección y `shipping_fee_exempt`) |
| `products`               | Catálogo de productos con peso y dimensiones |
| `product_variants`       | Variantes de productos (sabores, tamaños) |
| `categories`             | Categorías de productos                   |
| `inventory`              | Stock de productos                        |
| `orders`                 | Pedidos de clientes (incluye `order_number` e `is_business_order`) |
| `order_items`            | Ítems de cada pedido                      |
| `prospects`              | Prospectos CRM con datos de empresa, despacho y configuración B2B |
| `prospect_interactions`  | Historial de interacciones CRM            |
| `prospect_product_prices` | Precios fijos por producto para clientes B2B |
| `product_movements`      | Muestras, consignaciones y ventas         |
| `movement_payments`      | Pagos asociados a movimientos             |
| `payments`               | Registros de pagos                        |
| `shipments`              | Información de envíos                     |
| `loyalty_points`         | Transacciones de puntos                   |
| `rewards`                | Recompensas canjeables                    |
| `discount_codes`         | Códigos de descuento                      |
| `discount_code_products` | Restricciones por producto                |
| `discount_code_users`    | Restricciones por usuario                 |
| `discount_code_usages`   | Registro de usos de códigos               |
| `suppliers`              | Proveedores con datos tributarios y de retiro |
| `stock_entries`          | Entradas de stock con trazabilidad y facturación (fechas incluidas) |
| `stock_entry_history`    | Historial de cambios de inventario por ingreso        |
| `supplier_items`         | Productos/servicios por proveedor con costo neto      |
| `purchase_categories`    | Categorías de compras internas            |
| `purchases`              | Registro de compras internas              |
| `marketing_deliveries`   | Entregas de material publicitario a clientes |
| `contact_messages`       | Mensajes del formulario de contacto       |
| `newsletter_subscribers` | Suscriptores al boletín                   |

### Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas granulares** para lectura/escritura según rol
- **Pedidos y movimientos** visibles solo para su propietario o admins
- **Trigger automático** para sincronizar auth.users con users públicos
- **Operaciones Críticas Server-Side**: Uso de cliente administrador (Service Role) en server actions (ej. creación de pedidos en checkout) para garantizar la escritura segura de datos independientemente del estado de sesión del usuario (soporte robusto para guest checkout).

### Funciones SQL clave

- `generate_order_number` - Genera números de orden amigables (ej: `ORD-1001`)
- `deduct_prospect_credit` - Descuenta crédito disponible para clientes B2B
- `create_credit_sale_movement` - Crea movimientos de venta a crédito con control de errores
- `handle_consignment_credit_management` - Gestiona el crédito en consignaciones (descuento/restauración)

---

## 🎯 Alcances del Proyecto

### ✅ Implementado (v1.0)

- [x] Tienda online completa con catálogo de productos
- [x] Carrito de compras y proceso de checkout
- [x] Integración con Flow para pagos
- [x] Sistema de autenticación con Supabase
- [x] Programa de puntos Calmar
- [x] Programa B2B centralizado en CRM con precios fijos y crédito
- [x] Historial de pedidos
- [x] Newsletter y formulario de contacto
- [x] Internacionalización (ES)
- [x] SEO optimizado (sitemap, robots.txt, meta tags)
- [x] Diseño responsive y moderno
- [x] Animaciones con Framer Motion
- [x] Notificaciones por email transaccionales
- [x] Sistema de cupones de descuento
- [x] Registro de compras internas y material publicitario

### 🔄 En Desarrollo

- [ ] Panel de administración completo
- [ ] Sistema de recompensas canjeables
- [x] Integración con servicios de envío (Blue Express/Chilexpress)

### 🔮 Futuro (Roadmap)

- [ ] App móvil (React Native)
- [ ] Suscripciones recurrentes
- [ ] Programa de referidos
- [ ] Integración con ERP
- [ ] Chatbot de atención al cliente
- [ ] Reseñas y valoraciones de productos
- [ ] Wishlist / Lista de deseos

---

## 📞 Contacto

**Calmar SpA**

- 🌐 Web: [www.calmar.cl](https://www.calmar.cl)
- 📧 Email: contacto@calmar.cl
- 📱 Teléfono: +56 9 1234 5678

---

## 📄 Licencia

Este proyecto es privado y propietario de **Calmar SpA**. Todos los derechos
reservados.

© 2026 Calmar SpA
