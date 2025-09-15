# Sistema de Emails de Presupuestos - Nombres de Productos Completos

## 📋 **RESUMEN EJECUTIVO**

Documentación completa del sistema de envío de emails de presupuestos con **corrección de nombres de productos** implementada. El sistema ahora muestra correctamente tanto el **nombre del producto** como la **descripción detallada** en emails y PDFs adjuntos.

### 🎯 **Estado del Sistema**
- ✅ **100% Funcional**
- ✅ **Nombres de Productos Corregidos**
- ✅ **PDFs Completos**
- ✅ **Emails Profesionales**
- ✅ **Listo para Producción**

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Componentes Principales:**

```
📧 Sistema de Emails de Presupuestos
├── 🎯 Modal de Envío (EmailBudgetModal.tsx)
├── 🔧 Lógica de Envío (email.ts)
├── 📄 Generación de PDFs (pdfExport.ts)
├── 🗄️ Obtención de Datos (get.ts)
├── 🌐 API Routes (send-email/route.ts)
└── 📧 Servicio de Email (email-service.ts)
```

### **Flujo de Datos:**

```
1. Usuario abre modal de envío
2. Sistema obtiene datos del presupuesto (get.ts)
3. Mapea nombres de productos correctamente
4. Genera email con plantilla HTML
5. Genera PDF con nombres + descripciones
6. Envía email con PDF adjunto
7. Registra en historial de emails
```

---

## 🔧 **FUNCIONALIDADES IMPLEMENTADAS**

### **1. Envío de Emails Profesionales**
- ✅ **Plantilla HTML corporativa** con diseño Termas LLifen
- ✅ **Nombres de productos visibles** en el cuerpo del email
- ✅ **Descripciones detalladas** de cada servicio
- ✅ **Secciones organizadas** por días o categorías
- ✅ **Cálculos automáticos** de IVA y totales
- ✅ **Información de contacto** integrada

### **2. Generación de PDFs Completos**
- ✅ **PDF adjunto automático** con formato profesional
- ✅ **Nombres de productos** claramente visibles
- ✅ **Descripciones detalladas** de servicios
- ✅ **Secciones y notas** bien organizadas
- ✅ **Diseño corporativo** con logo y colores
- ✅ **Previsualización** antes del envío

### **3. Integración con Inteligencia Artificial**
- ✅ **Claude (Anthropic)** para generación de emails
- ✅ **ChatGPT (OpenAI)** como alternativa
- ✅ **Selector de tono** (Formal/Profesional/Amigable)
- ✅ **Detección automática** de presupuestos grupales
- ✅ **Generación automática** de contenido personalizado

### **4. Historial y Trazabilidad**
- ✅ **Registro automático** en tabla `budget_emails`
- ✅ **Estados de entrega** (pending, sent, delivered, failed, bounced)
- ✅ **Información del remitente** y timestamps
- ✅ **Errores detallados** para debugging
- ✅ **Función de reenvío** para emails fallidos

---

## 📊 **CORRECCIÓN DE NOMBRES DE PRODUCTOS**

### **Problema Resuelto:**
**Antes:** Los PDFs adjuntos mostraban solo la descripción, perdiendo el nombre del producto.

**Después:** Los PDFs muestran inteligentemente:
- **Nombre del producto** + **descripción** (cuando son diferentes)
- **Solo el nombre** (cuando nombre = descripción)
- **Solo la descripción** (cuando no hay nombre)

### **Lógica Inteligente Implementada:**

```typescript
// Para cada línea de producto:
const productName = line.productName || '';
const description = line.description || '';

if (productName && description && productName !== description) {
  // Mostrar ambos: "Nombre del Producto\nDescripción detallada"
  displayText = `${productName}\n${description}`;
} else {
  // Mostrar solo uno: el que esté disponible
  displayText = productName || description || 'Sin descripción';
}
```

### **Ejemplos de Visualización:**

**Caso 1: Producto con nombre y descripción diferentes**
```
Grupos Once Buffet
Té/café/leche queso, jamón de pavo, mermeldas, miel, mantequilla, pasta de huevo galletas, queque, pie, kuchen, torta 1 panqueque con salsa
```

**Caso 2: Producto donde nombre = descripción**
```
Almuerzo por el día Adultos
```

**Caso 3: Producto con solo descripción**
```
Té/café/leche queso, jamón de pavo, mermeldas, miel, mantequilla, huevo revuelto galletas, queque, kuchen, fruta, cereales, yogurt, panqueques
```

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Tabla Principal: `budget_emails`**
```sql
CREATE TABLE budget_emails (
  id BIGSERIAL PRIMARY KEY,
  budget_id BIGINT REFERENCES sales_quotes(id),
  email_type VARCHAR(10) CHECK (email_type IN ('sent', 'received')),
  recipient_email VARCHAR(255),
  sender_email VARCHAR(255),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  message_id VARCHAR(255),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_by BIGINT REFERENCES auth.users(id),
  error_message TEXT,
  metadata JSONB
);
```

### **Función SQL: `get_budget_lines_with_product`**
```sql
CREATE OR REPLACE FUNCTION get_budget_lines_with_product(budget_id bigint)
RETURNS TABLE(
  id bigint, 
  quote_id bigint, 
  product_id bigint, 
  product_name text, 
  description character varying, 
  quantity numeric, 
  unit_price numeric, 
  discount_percent numeric, 
  taxes jsonb, 
  subtotal numeric,
  display_type varchar(20),
  section_title text,
  note_text text
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT 
    sql.id,
    sql.quote_id,
    sql.product_id,
    p.name as product_name,
    sql.description,
    sql.quantity,
    sql.unit_price,
    sql.discount_percent,
    sql.taxes,
    sql.subtotal,
    sql.display_type,
    sql.section_title,
    sql.note_text
  FROM sales_quote_lines sql
  LEFT JOIN "Product" p ON sql.product_id = p.id
  WHERE sql.quote_id = budget_id
  ORDER BY sql.id;
$function$;
```

---

## 🎨 **PLANTILLAS DE EMAIL**

### **Plantilla Principal: `budgetQuote`**
```typescript
export const emailTemplates = {
  budgetQuote: (data: {
    clientName: string;
    budgetId: string;
    budgetNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
      displayType?: string;
      sectionTitle?: string;
      noteText?: string;
    }>;
    subtotal: number;
    taxes: number;
    total: number;
    validUntil: string;
    contactPerson: string;
    contactPhone: string;
  }): EmailTemplate => ({
    subject: `Presupuesto ${data.budgetNumber} - Termas Llifen`,
    html: `<!-- Plantilla HTML profesional -->`,
    text: `<!-- Versión texto plano -->`
  })
};
```

### **Características de la Plantilla:**
- ✅ **Diseño corporativo** con colores Termas LLifen
- ✅ **Tabla de productos** con nombres y descripciones
- ✅ **Secciones destacadas** con colores distintivos
- ✅ **Cálculos automáticos** de subtotal, IVA y total
- ✅ **Información de contacto** prominente
- ✅ **Responsive design** para móviles

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### **Variables de Entorno Requeridas:**
```env
# Gmail SMTP Configuration
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=your_app_password
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587

# AI Services (Opcional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### **Dependencias NPM:**
```json
{
  "nodemailer": "^6.9.0",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.6.0",
  "@anthropic-ai/sdk": "^0.24.0",
  "openai": "^4.0.0"
}
```

---

## 🚀 **FUNCIONALIDADES AVANZADAS**

### **1. Sistema Híbrido Server Actions + API Routes**
```typescript
// Wrapper inteligente que decide automáticamente qué método usar
export async function sendBudgetEmail(emailData: SendBudgetEmailInput) {
  const useServerActions = await shouldUseServerActions();
  
  if (useServerActions) {
    try {
      return await serverSendBudgetEmail(emailData);
    } catch (error) {
      // Fallback automático a API Route
    }
  }
  
  // Usar API Route como fallback
  return await fetch('/api/sales/budgets/send-email', {
    method: 'POST',
    body: JSON.stringify(emailData)
  });
}
```

### **2. Generación de PDFs con HTML Personalizado**
```typescript
// Soporte para plantillas HTML personalizadas
if (input.useCustomHTML && input.customHTML) {
  pdfBuffer = await generateBudgetPDFWithCustomHTML(input.customHTML, budget.number);
} else {
  pdfBuffer = await generateBudgetPDFBuffer(budgetFormData, clientFormData);
}
```

### **3. Previsualización en Tiempo Real**
```typescript
// Modal de previsualización del PDF antes del envío
const generatePreview = async () => {
  const previewContent = useCustomHTML && customHTML ? customHTML : defaultHTML;
  setPreviewContent(previewContent);
  setShowPreview(true);
};
```

---

## 📈 **MÉTRICAS Y ESTADÍSTICAS**

### **Funciones de Analytics:**
```typescript
// Estadísticas de emails por presupuesto
export async function getBudgetEmailStats(budgetId: number): Promise<{
  success: boolean;
  data?: {
    total_emails: number;
    sent_emails: number;
    successful_emails: number;
    failed_emails: number;
    last_email_sent?: string;
  };
}>;

// Historial completo de emails
export async function getBudgetEmailHistory(budgetId: number): Promise<{
  success: boolean;
  data?: BudgetEmailHistoryItem[];
}>;
```

### **Estados de Entrega:**
- **pending:** Email en cola de envío
- **sent:** Email enviado exitosamente
- **delivered:** Email entregado al destinatario
- **failed:** Error en el envío
- **bounced:** Email rebotado

---

## 🛡️ **SEGURIDAD Y VALIDACIONES**

### **Validaciones Implementadas:**
```typescript
// Validación de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(input.recipientEmail)) {
  return { success: false, message: 'El formato del email no es válido' };
}

// Validación de presupuesto
const budgetResult = await getBudgetById(input.budgetId);
if (!budgetResult.success || !budgetResult.data) {
  return { success: false, message: 'No se encontró el presupuesto especificado' };
}

// Validación de cliente
if (!budget.client) {
  return { success: false, message: 'El presupuesto debe tener un cliente asociado' };
}
```

### **Limpieza de Contenido:**
```typescript
// Función para limpiar texto en PDFs
const cleanTextForPDF = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remover caracteres HTML
    .replace(/\n/g, ' ') // Reemplazar saltos de línea
    .trim();
};
```

---

## 🔍 **TROUBLESHOOTING**

### **Problemas Comunes y Soluciones:**

**1. Error: "Cannot read properties of undefined (reading 'apply')"**
- **Causa:** Problema con jsPDF en servidor
- **Solución:** Sistema híbrido con fallback a HTML personalizado

**2. Error: "PDF buffer vacío o inválido"**
- **Causa:** Fallo en generación de PDF
- **Solución:** Email se envía sin PDF, con notificación al usuario

**3. Error: "Variables de entorno de Gmail no configuradas"**
- **Causa:** Faltan credenciales de Gmail
- **Solución:** Configurar GMAIL_USER y GMAIL_APP_PASSWORD

**4. Error: "Server Actions falló, usando API Route"**
- **Causa:** Server Actions no disponibles en producción
- **Solución:** Fallback automático a API Route (funcional)

---

## 📚 **GUÍAS DE USO**

### **Para Desarrolladores:**

**1. Agregar Nuevo Campo a Emails:**
```typescript
// 1. Actualizar interface en email.ts
interface SendBudgetEmailInput {
  // ... campos existentes
  nuevoCampo?: string;
}

// 2. Agregar a plantilla HTML
const templateData = {
  // ... datos existentes
  nuevoCampo: input.nuevoCampo || 'Valor por defecto'
};

// 3. Actualizar plantilla en email-service.ts
html: `<!-- Usar ${data.nuevoCampo} en la plantilla -->`
```

**2. Personalizar Plantilla de PDF:**
```typescript
// Crear HTML personalizado
const customHTML = `
  <div style="font-family: Arial, sans-serif;">
    <!-- Tu diseño personalizado -->
  </div>
`;

// Usar en generación de PDF
pdfBuffer = await generateBudgetPDFWithCustomHTML(customHTML, budget.number);
```

### **Para Usuarios Finales:**

**1. Enviar Presupuesto por Email:**
1. Abrir presupuesto en `/dashboard/sales/budgets/[id]`
2. Hacer clic en botón "📧 Enviar por Email"
3. Verificar email del destinatario
4. Opcional: Generar mensaje con IA
5. Opcional: Incluir PDF adjunto
6. Hacer clic en "Enviar Presupuesto"

**2. Usar Generación Automática con IA:**
1. Expandir sección "✨ Generación Automática con IA"
2. Seleccionar proveedor (Claude o ChatGPT)
3. Elegir tono (Formal/Profesional/Amigable)
4. Hacer clic en "Generar Email con IA"
5. Revisar y ajustar el mensaje generado

---

## 🎯 **ROADMAP FUTURO**

### **Mejoras Planificadas:**
- [ ] **Plantillas personalizables** por usuario
- [ ] **Programación de envíos** automáticos
- [ ] **Tracking de apertura** de emails
- [ ] **Plantillas por tipo** de presupuesto
- [ ] **Integración con CRM** externo
- [ ] **Analytics avanzados** de conversión

### **Optimizaciones Técnicas:**
- [ ] **Cache de PDFs** generados
- [ ] **Compresión de adjuntos** automática
- [ ] **Queue de envíos** para grandes volúmenes
- [ ] **Retry automático** para emails fallidos
- [ ] **Métricas en tiempo real** de entrega

---

## 📞 **SOPORTE Y MANTENIMIENTO**

### **Logs y Debugging:**
```typescript
// Logs detallados en consola
console.log('📧 Enviando presupuesto por email:', input);
console.log('✅ Presupuesto enviado exitosamente');
console.error('❌ Error enviando presupuesto:', error);
```

### **Monitoreo:**
- **Estado de emails:** Revisar tabla `budget_emails`
- **Errores de envío:** Filtrar por `status = 'failed'`
- **Performance:** Monitorear tiempos de generación de PDFs
- **Uso de IA:** Tracking de tokens consumidos

### **Mantenimiento Regular:**
- **Limpieza de logs** antiguos
- **Actualización de plantillas** estacionales
- **Verificación de credenciales** de Gmail
- **Backup de configuraciones** personalizadas

---

**Fecha de Documentación:** 9 de Enero, 2025  
**Versión:** 2.0 (Con corrección de nombres de productos)  
**Estado:** ✅ **COMPLETAMENTE FUNCIONAL**  
**Mantenido por:** Equipo de Desarrollo Admintermas
