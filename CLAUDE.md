# eco-wellness-panel — Panel de administración web de Rewalk

## Qué es
SPA React (Vite + TypeScript) que usan:
- **company_admin** — gestiona su empresa: empleados, recompensas, retos, suscripción
- **superadmin** — gestiona todas las empresas (lista, crea, cambia plan/suscripción, facturación)
- **employee** — vista básica de empleado (rara vez accede al panel, principalmente usa la app)

## Arrancar en local
```bash
npm run dev     # Vite dev server en http://localhost:5174
```
La API backend debe estar corriendo en `http://localhost:3000`.

## Estructura de páginas
```
src/
  App.tsx                 — Router principal basado en role: LoginPage | AdminPanel | SuperadminPanel | EmployeePanel
  api/client.ts           — Todas las llamadas a la API REST del backend
  context/AuthContext.tsx — Token JWT en localStorage, rol, subscriptionStatus
  pages/
    LoginPage.tsx         — Formulario de login (llama a /api/auth/login)
    DashboardPage.tsx     — Métricas de empresa del mes (empleados activos, km, calorías, minutos)
    EmployeePage.tsx      — Vista de empleado (stats, ranking, actividad)
    RewardsPage.tsx       — CRUD de recompensas + validación de canjes
    ChallengesPage.tsx    — CRUD de retos de equipo
    SubscriptionPage.tsx  — Ver y cambiar plan/suscripción
    SuperadminPage.tsx    — Listado de todas las empresas + crear empresa
    BillingPage.tsx       — Facturación (superadmin)
  components/             — Componentes compartidos (si los hay)
```

## Flujo de autenticación
1. Login → JWT guardado en `localStorage` bajo la clave `token`
2. `AuthContext` expone: `token`, `role`, `subscriptionStatus`, `login()`, `logout()`
3. `App.tsx` renderiza el panel adecuado según `role`

## Paneles por rol
- **superadmin** → tabs: 🏢 Empresas | 💶 Facturación
- **company_admin** → tabs: Dashboard | Recompensas | Retos | Suscripción
- **employee** → EmployeePanel (básico, sin tabs)

## Banner de suspensión
`SuspensionBanner` aparece si `subscriptionStatus === 'suspended' | 'cancelled'`.

## API
`src/api/client.ts` exporta `api` con todos los métodos tipados.
La URL base es `http://localhost:3000/api` (hardcoded — cambiar para producción).
El token se adjunta automáticamente como `Authorization: Bearer <token>`.

## Assets / Branding
```
public/
  rewalk_wordmark_dark.svg   — Logo usado en la cabecera del panel
  rewalk_wordmark.svg        — Versión clara
  rewalk_logo.svg / _dark    — Solo icono
  rewalk_icon.svg            — Favicon / icono pequeño
```
Color principal: `#E8472A` (rojo Rewalk)

## Build y deploy
```bash
npm run build   # Genera dist/
```
No hay deploy automatizado aún — manual o pendiente configurar Netlify/Vercel.
El panel es interno, no tiene dominio público todavía.

## Notas técnicas
- No usa React Router; la navegación entre "páginas" es state local (`tab` con useState)
- Vite en puerto 5174 (puede conflictar con otras instancias — revisar si ya hay otro proceso)
- Sin tests por ahora
