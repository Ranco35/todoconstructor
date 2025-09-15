## Solución: Hydration mismatch y configuración de Supabase en cliente (Next.js)

### Contexto
- Aparecían errores de hidratación en páginas del dashboard (Next.js 15) y advertencias de cookies de Supabase al cargar vistas con datos dinámicos.
- Síntomas observados:
  - "Hydration failed because the server rendered HTML didn't match the client"
  - "Failed to parse cookie string … is not valid JSON"
  - Respuestas 406 de `rest/v1` al consultar tablas con el cliente en el navegador.

### Causas
- Mezcla de renderizado SSR + datos variables del navegador (fechas localizadas, cookies de sesión, etc.).
- Cookies antiguas de Supabase incompatibles con el cliente actual (base64 vs JSON).
- Varias instancias de `next dev` abiertas en puertos distintos (3000/3001/3002), causando estados inconsistentes.

### Decisiones de diseño
1) Forzar páginas problemáticas a client-only cuando dependen del estado del navegador/sesión:
   - Usar `next/dynamic` con `ssr: false` y mover la obtención de datos a `useEffect` con `createBrowserClient` de `@supabase/ssr`.
2) Limitar contextos/client-providers solo a las páginas que los usan (no en el layout global).
3) Estandarizar ejecución de dev server en un único puerto/instancia.

### Implementación
- Página de detalle de factura de compras (`src/app/dashboard/purchases/invoices/[id]/page.tsx`):
  - Convertida a client-only con:
    ```ts
    export default dynamic(() => Promise.resolve(InvoicePageClient), { ssr: false });
    ```
  - Carga de datos en cliente con:
    ```ts
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    ```
  - Render estable: primer estado "Cargando…" y luego datos (pagos, proveedor, bodega).

- Provider de Emails:
  - Quitado del layout global (`src/app/dashboard/layout.tsx`).
  - Reactivado solo en la página de emails: `src/app/dashboard/emails/page.tsx` envolviendo `<EmailsMainPage />` con `<EmailAnalysisProvider>`.

### Procedimiento operativo recomendado (Windows PowerShell)
1) Cerrar todos los servidores en ejecución:
   ```powershell
   taskkill /f /im node.exe
   ```
2) Limpiar caché de Next.js (opcional si hay errores de build):
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3) Iniciar dev server (en una única instancia):
   ```powershell
   cd C:\Users\eduar\DJANGO\Admintermas
   npm run dev
   ```
   Nota: en PowerShell no usar `&&` entre comandos.

4) Limpiar datos del sitio en el navegador si aparecen errores de cookies (Supabase):
   - Chrome → DevTools → Application → Storage → Clear site data (Cookies + Local Storage).
   - Volver a iniciar sesión.

### Checklist de verificación
- [ ] No aparece el aviso de hydration mismatch.
- [ ] Solo hay una instancia de `next dev` activa.
- [ ] La página de factura muestra pagos, total pagado, saldo, proveedor y bodega.
- [ ] La sección de emails funciona y el popup solo se monta en páginas de emails.

### Notas
- Mantener vistas que dependan de sesión/cookies como client-only simplifica y evita inconsistencias SSR/CSR.
- Para componentes globales, evitar montar providers que no sean necesarios en todo el árbol.


