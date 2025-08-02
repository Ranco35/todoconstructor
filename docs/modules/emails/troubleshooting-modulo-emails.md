# 🔧 Troubleshooting - Módulo de Emails

## 📋 Índice de Problemas Resueltos

1. [Problemas de Base de Datos](#problemas-de-base-de-datos)
2. [Errores de Webpack y Caché](#errores-de-webpack-y-caché)
3. [Problemas de Nomenclatura](#problemas-de-nomenclatura)
4. [Errores de Políticas RLS](#errores-de-políticas-rls)
5. [Problemas de Análisis de Correos](#problemas-de-análisis-de-correos)
6. [Errores de Componentes React](#errores-de-componentes-react)
7. [Guía de Debugging](#guía-de-debugging)

---

## 🗄️ Problemas de Base de Datos

### **1. Error: "relation sales_quote does not exist"**

#### **Problema:**
```
Error: relation "sales_quote" does not exist
at Object.error (error.js:156:20)
```

#### **Causa:**
La tabla se llama `sales_quotes` (plural) no `sales_quote` (singular).

#### **Solución:**
```sql
-- ❌ INCORRECTO
CREATE TABLE SentEmailTracking (
  budget_id BIGINT REFERENCES sales_quote(id)
);

-- ✅ CORRECTO  
CREATE TABLE SentEmailTracking (
  budget_id BIGINT REFERENCES sales_quotes(id)
);
```

#### **Código de Corrección:**
```sql
-- Aplicar corrección en migración
ALTER TABLE SentEmailTracking 
DROP CONSTRAINT IF EXISTS sentemailtracking_budget_id_fkey;

ALTER TABLE SentEmailTracking 
ADD CONSTRAINT sentemailtracking_budget_id_fkey 
FOREIGN KEY (budget_id) REFERENCES sales_quotes(id);
```

---

### **2. Error: Columnas de Cliente Incorrectas**

#### **Problema:**
```
Error: column "name" does not exist
Hint: Perhaps you meant to reference the column "nombrePrincipal"
```

#### **Causa:**
Inconsistencia en nombres de columnas entre frontend y base de datos.

#### **Solución:**
```typescript
// ❌ INCORRECTO
const clientData = {
  name: client.name,
  phone: client.phone
}

// ✅ CORRECTO
const clientData = {
  nombrePrincipal: client.nombrePrincipal,
  telefono: client.telefono
}
```

#### **Mapping Correcto:**
```typescript
// utils/client-mapping.ts
export function mapClientData(client: any) {
  return {
    id: client.id,
    nombrePrincipal: client.nombrePrincipal || client.name,
    apellido: client.apellido || client.lastName,
    telefono: client.telefono || client.phone,
    email: client.email
  }
}
```

---

## ⚙️ Errores de Webpack y Caché

### **3. Error: ChunkLoadError**

#### **Problema:**
```
ChunkLoadError: Loading chunk [id] failed
Error: Loading CSS chunk [id] failed
```

#### **Causa:**
Caché corrupta de Next.js después de múltiples cambios.

#### **Solución Paso a Paso:**
```bash
# 1. Detener servidor de desarrollo
Ctrl+C

# 2. Limpiar caché Next.js
rm -rf .next

# 3. Limpiar caché node_modules (opcional)
rm -rf node_modules/.cache

# 4. Reinstalar dependencias (si es necesario)
npm install

# 5. Reiniciar servidor
npm run dev
```

#### **Script Automático PowerShell:**
```powershell
# fix-webpack-cache.ps1
Write-Host "🔧 Limpiando caché de Next.js..."

# Terminar procesos Node.js
taskkill /f /im node.exe 2>$null

# Eliminar directorio .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Caché .next eliminado"
}

# Reiniciar servidor
Write-Host "🚀 Reiniciando servidor..."
npm run dev
```

---

### **4. Error: "Server Actions must be async functions"**

#### **Problema:**
```
Error: Server Actions must be async functions
at validateServerAction
```

#### **Causa:**
Funciones síncronas exportadas desde archivos con `'use server'`.

#### **Solución:**
```typescript
// ❌ INCORRECTO
'use server'

export function formatEmailData(data) {
  return data.formatted
}

// ✅ CORRECTO - Mover a utils
// utils/email-client-utils.ts (SIN 'use server')
export function formatEmailData(data) {
  return data.formatted
}

// email-actions.ts
'use server'

export async function analyzeEmails() {
  // Solo funciones async aquí
}
```

---

## 📝 Problemas de Nomenclatura

### **5. Error: Inconsistencia en Nombres de Campos**

#### **Problema:**
Frontend usa camelCase, base de datos usa snake_case.

#### **Mapping Centralizado:**
```typescript
// types/email-mappings.ts
export const EMAIL_FIELD_MAPPING = {
  // Frontend -> Database
  recipientEmail: 'recipient_email',
  emailType: 'email_type',
  sentAt: 'sent_at',
  deliveredAt: 'delivered_at',
  openedAt: 'opened_at',
  clientId: 'client_id',
  reservationId: 'reservation_id',
  budgetId: 'budget_id',
  sentByUserId: 'sent_by_user_id'
}

export function mapToDatabase(frontendData: any) {
  const mapped: any = {}
  Object.keys(frontendData).forEach(key => {
    const dbKey = EMAIL_FIELD_MAPPING[key as keyof typeof EMAIL_FIELD_MAPPING] || key
    mapped[dbKey] = frontendData[key]
  })
  return mapped
}

export function mapFromDatabase(dbData: any) {
  const mapped: any = {}
  Object.keys(dbData).forEach(key => {
    const frontendKey = Object.keys(EMAIL_FIELD_MAPPING).find(
      k => EMAIL_FIELD_MAPPING[k as keyof typeof EMAIL_FIELD_MAPPING] === key
    ) || key
    mapped[frontendKey] = dbData[key]
  })
  return mapped
}
```

---

## 🔒 Errores de Políticas RLS

### **6. Error: Políticas RLS Duplicadas**

#### **Problema:**
```
Error: policy "policy_name" for table "table_name" already exists
```

#### **Solución Segura:**
```sql
-- ✅ Siempre usar IF EXISTS
DROP POLICY IF EXISTS "EmailAnalysisReports_select_policy" ON "EmailAnalysisReports";
DROP POLICY IF EXISTS "EmailAnalysisReports_insert_policy" ON "EmailAnalysisReports";
DROP POLICY IF EXISTS "EmailAnalysisReports_update_policy" ON "EmailAnalysisReports";

-- Crear políticas nuevas
CREATE POLICY "EmailAnalysisReports_select_policy" 
ON "EmailAnalysisReports" FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "EmailAnalysisReports_insert_policy" 
ON "EmailAnalysisReports" FOR INSERT 
TO authenticated 
WITH CHECK (true);
```

---

## 📧 Problemas de Análisis de Correos

### **7. Error: Análisis de Todos los Correos (No Solo Sin Leer)**

#### **Problema:**
El sistema analizaba TODOS los correos del día, incluso los ya leídos, causando confusión en el modal de bienvenida.

#### **Causa:**
```typescript
// ❌ PROBLEMA: No filtraba por correos sin leer
const emails = await getEmailsToday()
```

#### **Solución:**
```typescript
// ✅ CORRECCIÓN: Filtrar solo correos sin leer
export async function getUnreadEmails() {
  try {
    const emails = await gmail.users.messages.list({
      userId: 'me',
      q: `is:unread newer_than:1d`, // Solo correos sin leer del último día
      maxResults: 50
    })

    if (!emails.data.messages) {
      return []
    }

    const emailDetails = await Promise.all(
      emails.data.messages.map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        })
        
        return {
          id: message.id,
          subject: getHeader(detail.data, 'Subject'),
          from: getHeader(detail.data, 'From'),
          date: getHeader(detail.data, 'Date'),
          body: getEmailBody(detail.data),
          isRead: false // Todos son sin leer por el filtro
        }
      })
    )

    return emailDetails
  } catch (error) {
    console.error('❌ Error getting unread emails:', error)
    throw error
  }
}
```

#### **Actualización en Modal:**
```typescript
// components/emails/EmailAnalysisPopup.tsx
<div className="text-2xl font-bold text-blue-600">
  {analysis?.totalEmails || 0}
</div>
<div className="text-sm text-blue-700">Correos no leídos</div> {/* Actualizado */}

// Mensaje mejorado
{analysis?.totalEmails === 0 ? (
  <div className="bg-green-50 p-4 rounded-lg text-center">
    <div className="text-green-600 font-medium">
      ✅ Excelente! No hay correos sin leer
    </div>
    <div className="text-sm text-green-700 mt-1">
      Todos los correos están al día
    </div>
  </div>
) : (
  // Mostrar análisis...
)}
```

---

### **8. Error: OpenAI API Rate Limiting**

#### **Problema:**
```
Error: Rate limit exceeded for requests
```

#### **Solución con Retry Logic:**
```typescript
// utils/openai-retry.ts
export async function openaiWithRetry(
  completion: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await completion()
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry ${attempt}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}

// Uso en analysis-actions.ts
const completion = await openaiWithRetry(async () => {
  return await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.3
  })
})
```

---

## ⚛️ Errores de Componentes React

### **9. Error: "Cannot read properties of undefined"**

#### **Problema:**
```
TypeError: Cannot read properties of undefined (reading 'map')
```

#### **Solución con Defensive Programming:**
```typescript
// ❌ PROBLEMA
{reports.map(report => (
  <div key={report.id}>{report.summary}</div>
))}

// ✅ SOLUCIÓN
{Array.isArray(reports) && reports.length > 0 ? (
  reports.map(report => (
    <div key={report.id}>
      {report?.summary || 'Sin resumen disponible'}
    </div>
  ))
) : (
  <div className="text-center py-8 text-muted-foreground">
    No hay reportes disponibles
  </div>
)}
```

#### **Hook Personalizado para Estados Seguros:**
```typescript
// hooks/useSafeState.ts
import { useState, useCallback } from 'react'

export function useSafeState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const safeSetValue = useCallback(async (
    updateFunction: () => Promise<T> | T
  ) => {
    setLoading(true)
    setError(null)
    try {
      const newValue = await updateFunction()
      setValue(newValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  return { value, loading, error, setValue: safeSetValue }
}
```

---

### **10. Error: Hydration Mismatch**

#### **Problema:**
```
Warning: Text content did not match. Server: "..." Client: "..."
```

#### **Solución:**
```typescript
// ❌ PROBLEMA: Fechas formateadas en servidor vs cliente
<div>{new Date(report.created_at).toLocaleDateString()}</div>

// ✅ SOLUCIÓN: useEffect para cliente
function ReportDate({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString('es-CL'))
  }, [date])

  return <div>{formattedDate || 'Cargando fecha...'}</div>
}
```

---

## 🐛 Guía de Debugging

### **Técnicas de Debugging Implementadas**

#### **1. Logging Estructurado**
```typescript
// utils/logger.ts
export const logger = {
  email: {
    analysis: (message: string, data?: any) => 
      console.log(`📧 [EMAIL-ANALYSIS] ${message}`, data),
    client: (message: string, data?: any) => 
      console.log(`👤 [CLIENT-ID] ${message}`, data),
    tracking: (message: string, data?: any) => 
      console.log(`📤 [EMAIL-TRACKING] ${message}`, data),
    error: (message: string, error?: any) => 
      console.error(`❌ [EMAIL-ERROR] ${message}`, error)
  }
}

// Uso en código
logger.email.analysis('Iniciando análisis de correos', { count: emails.length })
logger.email.client('Cliente encontrado', { id: client.id, email: client.email })
logger.email.error('Error en análisis', error)
```

#### **2. Debugging Components**
```typescript
// components/debug/EmailDebugPanel.tsx (Solo en desarrollo)
export function EmailDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md">
      <h4 className="font-bold mb-2">🐛 Email Debug</h4>
      <div className="space-y-1">
        <div>OpenAI Status: {debugInfo?.openai ? '✅' : '❌'}</div>
        <div>Gmail Status: {debugInfo?.gmail ? '✅' : '❌'}</div>
        <div>Last Analysis: {debugInfo?.lastAnalysis || 'N/A'}</div>
        <div>Unread Count: {debugInfo?.unreadCount || 0}</div>
      </div>
    </div>
  )
}
```

#### **3. Error Boundaries**
```typescript
// components/errors/EmailErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary'

function EmailErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-red-800 font-medium">Error en el módulo de emails</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}

export function withEmailErrorBoundary(Component: React.ComponentType) {
  return function WrappedComponent(props: any) {
    return (
      <ErrorBoundary
        FallbackComponent={EmailErrorFallback}
        onError={(error, errorInfo) => {
          console.error('❌ Email Error Boundary:', error, errorInfo)
        }}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```

---

## 🔍 Herramientas de Diagnóstico

### **Script de Diagnóstico del Sistema**
```typescript
// utils/email-system-diagnostics.ts
export async function runEmailSystemDiagnostics() {
  const results = {
    database: false,
    openai: false,
    gmail: false,
    scheduler: false,
    components: false
  }

  try {
    // Test Database Connection
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from('EmailAnalysisReports').select('id').limit(1)
    results.database = !error

    // Test OpenAI Connection
    try {
      await openai.models.list()
      results.openai = true
    } catch (error) {
      results.openai = false
    }

    // Test Gmail Connection
    try {
      const emails = await getUnreadEmails()
      results.gmail = true
    } catch (error) {
      results.gmail = false
    }

    // Test Scheduler Status
    try {
      const scheduleResult = await fetch('/api/emails/analysis-scheduler', { method: 'POST' })
      results.scheduler = scheduleResult.ok
    } catch (error) {
      results.scheduler = false
    }

    results.components = true // Si llegamos aquí, React está funcionando

  } catch (error) {
    console.error('❌ Diagnostics failed:', error)
  }

  return results
}
```

---

## 📞 Contacto y Soporte

### **Para Reportar Nuevos Problemas:**

1. **Información requerida:**
   - Descripción detallada del error
   - Pasos para reproducir
   - Screenshots si aplica
   - Logs de consola
   - Versión del navegador

2. **Formato de reporte:**
```markdown
## 🐛 Bug Report

**Descripción:** [Describe el problema]

**Pasos para reproducir:**
1. Ir a...
2. Hacer clic en...
3. Ver error...

**Comportamiento esperado:** [Qué debería pasar]

**Comportamiento actual:** [Qué está pasando]

**Logs de consola:**
```
[Paste logs here]
```

**Entorno:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Version: [Version number]
```

### **Escalación de Problemas:**
1. **Nivel 1:** Problemas de UI/UX - Revisar componentes
2. **Nivel 2:** Problemas de lógica - Revisar server actions
3. **Nivel 3:** Problemas de BD - Revisar migraciones y funciones SQL
4. **Nivel 4:** Problemas de integración - Revisar APIs externas (OpenAI, Gmail)

---

**Documentado por:** IA Assistant (Claude)  
**Última actualización:** 18 de Enero, 2025  
**Versión:** 1.0.0 