# Numa

Numa es una aplicación web de finanzas personales **offline-first** diseñada para gestionar cuentas, ingresos, gastos, presupuestos, tarjetas de crédito, deudas, metas de ahorro e inversiones desde una interfaz móvil optimizada, incluso sin conexión a internet.

## Motivo

El proyecto nace para reemplazar hojas de cálculo y apps dispersas por una experiencia centralizada que funcione siempre — con o sin internet — y ayude a visualizar el estado financiero personal con rapidez, contexto y cero fricción.

## Tecnologías

- **Frontend:** Next.js 15, React 19, TypeScript strict, Tailwind CSS v4
- **Backend:** Node.js, Express, Drizzle ORM, PostgreSQL (Supabase)
- **Offline:** Dexie (IndexedDB), Zustand, Sync Queue con resolución Last-Write-Wins
- **Autenticación:** JWT (access + refresh tokens)
- **Monorepo:** Turborepo con paquetes compartidos (`types`, `validators`, `utils`, `offline`)
- **Despliegue:** Vercel para frontend, Render para API

## Features

- Dashboard financiero con resumen de balance, ingresos, gastos y ahorro
- Gestión de cuentas (corriente, ahorro, efectivo, inversión)
- Registro de ingresos, gastos y transferencias
- Categorización personalizable con iconos y colores
- Gestión de tarjetas de crédito con cargos, cuotas y pagos
- Control de presupuestos por categoría y período
- Metas de ahorro con seguimiento de progreso
- Gestión de deudas y plan de pagos
- Portafolio de inversiones (acciones, bonos, crypto, real estate)
- Exportación de reportes financieros a Excel
- Generación automática de reportes con resumen IA
- Funcionamiento offline completo con sincronización automática
- PWA instalable en dispositivos móviles
- Modo claro y oscuro
- Navegación mobile optimizada con bottom nav y gestos táctiles

## Arquitectura

La aplicación opera bajo un estricto principio **Offline First**:

```
Usuario → IndexedDB → UI → Sync Queue → API → PostgreSQL
```

Toda escritura se persiste primero en IndexedDB (Dexie), se refleja inmediatamente en la UI, y se encola para sincronización batch cada 30 segundos contra la API. La fuente de verdad en línea es PostgreSQL; la fuente de verdad fuera de línea es IndexedDB.

**Principios clave:**
- IDs generados en cliente (UUID v4) para permitir creación offline
- Resolución de conflictos: Last-Write-Wins por `updatedAt`
- Montos almacenados en centavos (enteros) — sin floats
- Soft delete en todas las entidades (`deletedAt`)
- Componentes de UI sin lógica de negocio
- Stores (Zustand) responsables del estado y sincronización local
- Servicios responsables de negocio, API y sincronización

## Estado actual

El proyecto se encuentra funcional y desplegado con una base sólida que cubre gestión financiera completa offline-first, dashboard en tiempo real, y sincronización automática con el servidor. Se continúa iterando en analítica, internacionalización y mejoras de experiencia de usuario.
