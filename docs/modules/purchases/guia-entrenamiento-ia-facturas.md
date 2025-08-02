# 🧠 Guía de Entrenamiento IA para Facturas - Mejora Continua

**🎯 Objetivo**: Mejorar progresivamente la precisión de extracción de datos de facturas PDF  
**📈 Meta**: Alcanzar 98%+ de precisión con facturas chilenas reales  
**⚡ Estrategia**: Aprendizaje iterativo basado en casos reales  

---

## 🚀 **ESTRATEGIAS DE MEJORA CONTINUA**

### **1. 📝 Sistema de Feedback y Corrección**

#### **Implementar Botón "Corregir Datos"**
```tsx
// src/components/purchases/PDFDataCorrection.tsx
export function PDFDataCorrectionModal({ extractedData, onSave }: Props) {
  const [correctedData, setCorrectedData] = useState(extractedData)
  
  const saveCorrectionForTraining = async () => {
    // Guardar corrección para mejorar prompts futuros
    await supabase.from('pdf_training_corrections').insert({
      original_data: extractedData,
      corrected_data: correctedData,
      pdf_text: pdfText,
      correction_type: 'user_feedback',
      created_at: new Date()
    })
  }
  
  return (
    <Dialog>
      <DialogContent>
        <h3>🔧 Corregir Datos Extraídos</h3>
        
        {/* Campos editables */}
        <Input 
          label="Número de Factura"
          value={correctedData.invoiceNumber}
          onChange={(e) => setCorrectedData({
            ...correctedData, 
            invoiceNumber: e.target.value
          })}
        />
        
        <Input 
          label="Proveedor"
          value={correctedData.supplierName}
          onChange={(e) => setCorrectedData({
            ...correctedData, 
            supplierName: e.target.value
          })}
        />
        
        <Input 
          label="RUT"
          value={correctedData.supplierRut}
          onChange={(e) => setCorrectedData({
            ...correctedData, 
            supplierRut: e.target.value
          })}
        />
        
        <div className="grid grid-cols-3 gap-4">
          <Input 
            label="Subtotal" 
            type="number"
            value={correctedData.subtotal}
            onChange={(e) => setCorrectedData({
              ...correctedData, 
              subtotal: parseFloat(e.target.value)
            })}
          />
          <Input 
            label="IVA" 
            type="number"
            value={correctedData.taxAmount}
            onChange={(e) => setCorrectedData({
              ...correctedData, 
              taxAmount: parseFloat(e.target.value)
            })}
          />
          <Input 
            label="Total" 
            type="number"
            value={correctedData.totalAmount}
            onChange={(e) => setCorrectedData({
              ...correctedData, 
              totalAmount: parseFloat(e.target.value)
            })}
          />
        </div>
        
        <Button onClick={saveCorrectionForTraining}>
          💾 Guardar y Mejorar IA
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

### **2. 🗃️ Base de Datos de Entrenamiento**

#### **Tabla para Acumular Casos de Entrenamiento**
```sql
-- Migración: Sistema de entrenamiento IA
CREATE TABLE pdf_training_corrections (
    id BIGSERIAL PRIMARY KEY,
    
    -- Datos originales extraídos
    original_data JSONB NOT NULL,
    
    -- Datos corregidos por usuario
    corrected_data JSONB NOT NULL,
    
    -- Texto original del PDF
    pdf_text TEXT,
    
    -- Metadatos de mejora
    extraction_method VARCHAR(10), -- 'ai' o 'ocr'
    original_confidence NUMERIC(3,2),
    correction_type VARCHAR(20), -- 'user_feedback', 'validation_error', 'manual_review'
    
    -- Información del proveedor (para patterns específicos)
    supplier_id BIGINT REFERENCES suppliers(id),
    supplier_format_type VARCHAR(50), -- 'standard', 'electronic', 'handwritten'
    
    -- Análisis de errores
    error_fields TEXT[], -- ['invoiceNumber', 'taxAmount']
    error_patterns TEXT[], -- Patterns que fallaron
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Estado de procesamiento
    used_for_training BOOLEAN DEFAULT false,
    training_batch_id VARCHAR(50)
);

-- Tabla para patterns exitosos
CREATE TABLE pdf_extraction_patterns (
    id BIGSERIAL PRIMARY KEY,
    
    -- Pattern específico
    pattern_type VARCHAR(30), -- 'invoice_number', 'supplier_rut', 'amounts'
    regex_pattern TEXT,
    confidence_boost NUMERIC(3,2) DEFAULT 0.1,
    
    -- Contexto de aplicación
    supplier_types VARCHAR(20)[], -- ['empresa', 'individual']
    pdf_formats VARCHAR(20)[], -- ['electronic', 'scanned', 'mixed']
    
    -- Estadísticas
    success_rate NUMERIC(3,2),
    total_applications INTEGER DEFAULT 0,
    successful_applications INTEGER DEFAULT 0,
    
    -- Metadatos
    created_from_training_id BIGINT REFERENCES pdf_training_corrections(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **3. 🤖 Mejora Automática de Prompts**

#### **Sistema de Prompt Dinámico**
```typescript
// src/lib/ai-prompt-optimizer.ts
export class AIPromptOptimizer {
  
  static async getOptimizedPrompt(
    supplierType: string, 
    pdfFormat: string,
    historicalErrors: string[]
  ): Promise<string> {
    
    // Base prompt mejorado
    let prompt = `Eres un experto en facturas chilenas. Extrae EXACTAMENTE los datos del PDF.

REGLAS CRÍTICAS:
1. NUNCA inventes números - solo extrae lo que ves
2. Para RUT: busca formato XX.XXX.XXX-X o XXXXXXXX-X
3. Para números de factura: busca "N°", "Nº", "Factura" seguido de números
4. Para montos: identifica Subtotal/Neto, IVA 19%, Total
5. Fechas en formato DD/MM/YYYY o DD-MM-YYYY

DATOS REQUERIDOS:
{
  "invoiceNumber": "número_exacto_del_pdf",
  "supplierName": "nombre_exacto_del_proveedor", 
  "supplierRut": "rut_con_formato_chileno",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "subtotal": número_sin_iva,
  "taxAmount": numero_iva_19_porciento,  
  "totalAmount": número_total_final,
  "confidence": 0.95,
  "lines": [...]
}`

    // Añadir reglas específicas por tipo de proveedor
    if (supplierType === 'retail') {
      prompt += `

ESPECIAL RETAIL:
- Busca códigos de barras como referencia adicional
- Total puede estar en línea separada con "TOTAL A PAGAR"
- IVA puede aparecer como "I.V.A." o "IMP. VALOR AGREGADO"`
    }
    
    if (supplierType === 'services') {
      prompt += `

ESPECIAL SERVICIOS:
- Honorarios pueden estar exentos de IVA
- Busca "EXENTO" o "SIN IVA" 
- Retenciones pueden aparecer como descuentos`
    }
    
    // Añadir correcciones históricas
    if (historicalErrors.includes('invoiceNumber')) {
      prompt += `

⚠️ NÚMERO DE FACTURA:
- Revisa TODA la página, puede estar en header o footer
- Puede tener prefijos como "F-", "FC-", "NF-" 
- No confundir con orden de compra o guía de despacho`
    }
    
    if (historicalErrors.includes('taxAmount')) {
      prompt += `

⚠️ CÁLCULO IVA:
- IVA siempre es 19% en Chile
- Si total incluye IVA: IVA = Total * 0.19 / 1.19
- Si tienes subtotal: IVA = Subtotal * 0.19
- Redondear a 2 decimales`
    }
    
    return prompt
  }
  
  static async recordPromptPerformance(
    promptVersion: string,
    accuracy: number,
    errorFields: string[]
  ) {
    // Registrar performance para optimización futura
    await supabase.from('prompt_performance_log').insert({
      prompt_version: promptVersion,
      accuracy_score: accuracy,
      error_fields: errorFields,
      created_at: new Date()
    })
  }
}
```

### **4. 📋 Patrones OCR Mejorados**

#### **Sistema de Patterns Adaptativo**
```typescript
// src/lib/ocr-pattern-learner.ts
export class OCRPatternLearner {
  
  static async getAdaptivePatterns(supplierName: string): Promise<ExtractionPatterns> {
    // Obtener patterns específicos del proveedor
    const { data: supplierPatterns } = await supabase
      .from('pdf_extraction_patterns')
      .select('*')
      .eq('supplier_types', supplierName)
      .eq('is_active', true)
      .order('success_rate', { ascending: false })
    
    return {
      invoiceNumber: [
        // Patterns base
        /(?:factura|invoice|n[°º]?\.?)\s*:?\s*([a-z]?[\d\-]+)/i,
        /(?:f|n)[^\w]*(\d{3,})/i,
        
        // Patterns específicos del proveedor
        ...supplierPatterns
          .filter(p => p.pattern_type === 'invoice_number')
          .map(p => new RegExp(p.regex_pattern, 'i'))
      ],
      
      amounts: [
        // Patterns mejorados para montos
        /(?:total|sum|monto)\s*:?\s*\$?\s*([\d,\.]+)/i,
        /(?:subtotal|neto)\s*:?\s*\$?\s*([\d,\.]+)/i,
        /(?:iva|tax|impuesto)\s*:?\s*\$?\s*([\d,\.]+)/i,
        
        // Patterns específicos aprendidos
        ...supplierPatterns
          .filter(p => p.pattern_type === 'amounts')
          .map(p => new RegExp(p.regex_pattern, 'i'))
      ]
    }
  }
  
  static async learnFromCorrection(correction: TrainingCorrection) {
    const originalText = correction.pdf_text
    const correctedData = correction.corrected_data
    
    // Analizar qué patterns habrían funcionado
    const invoicePattern = this.findWorkingPattern(
      originalText, 
      correctedData.invoiceNumber,
      'invoice_number'
    )
    
    if (invoicePattern) {
      // Guardar pattern exitoso
      await supabase.from('pdf_extraction_patterns').insert({
        pattern_type: 'invoice_number',
        regex_pattern: invoicePattern.source,
        confidence_boost: 0.15,
        supplier_types: [correction.supplier_id?.toString()],
        success_rate: 1.0,
        total_applications: 1,
        successful_applications: 1,
        created_from_training_id: correction.id
      })
    }
  }
  
  private static findWorkingPattern(
    text: string, 
    targetValue: string,
    patternType: string
  ): RegExp | null {
    // Generar patterns candidatos basados en el contexto
    const lines = text.split('\n')
    const targetLine = lines.find(line => 
      line.toLowerCase().includes(targetValue.toLowerCase())
    )
    
    if (targetLine) {
      // Crear pattern específico para este contexto
      const escapedValue = targetValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const context = targetLine.substring(0, targetLine.indexOf(targetValue))
      
      return new RegExp(`${context}\\s*${escapedValue}`, 'i')
    }
    
    return null
  }
}
```

### **5. 🎯 Templates de Proveedores Específicos**

#### **Reconocimiento de Formatos**
```typescript
// src/lib/supplier-template-detector.ts
export class SupplierTemplateDetector {
  
  static async detectTemplate(pdfText: string, supplierName: string): Promise<TemplateInfo> {
    // Detectar tipo de factura por características
    const characteristics = {
      hasElectronicHeader: /factura\s+electr[oó]nica/i.test(pdfText),
      hasBarcode: /código\s+de\s+barras|\|\|[|\s]+\|\|/i.test(pdfText),
      hasTimbre: /timbre\s+electr[oó]nico|sii\.cl/i.test(pdfText),
      hasRetention: /retenci[oó]n|honorarios/i.test(pdfText),
      layout: this.detectLayout(pdfText)
    }
    
    // Buscar template específico en BD
    const { data: template } = await supabase
      .from('supplier_templates')
      .select('*')
      .eq('supplier_name', supplierName)
      .eq('characteristics', characteristics)
      .single()
    
    if (template) {
      return {
        templateId: template.id,
        extractionRules: template.extraction_rules,
        confidence: template.success_rate
      }
    }
    
    // Si no existe, crear template base
    return this.createBaseTemplate(supplierName, characteristics)
  }
  
  private static detectLayout(text: string): LayoutType {
    const lines = text.split('\n')
    const headerLines = lines.slice(0, 10)
    const footerLines = lines.slice(-10)
    
    if (headerLines.some(line => /logo|header/i.test(line))) {
      return 'professional'
    }
    if (footerLines.some(line => /total|suma/i.test(line))) {
      return 'footer_totals'
    }
    return 'simple'
  }
}
```

---

## 📈 **ESTRATEGIAS DE IMPLEMENTACIÓN GRADUAL**

### **Fase 1: Sistema de Feedback (Semana 1-2)**
```typescript
// Implementar correcciones manuales inmediatas
1. Agregar botón "Corregir" en vista previa
2. Permitir edición in-situ de datos extraídos  
3. Guardar correcciones en BD para análisis
4. Mostrar estadísticas de precisión por proveedor
```

### **Fase 2: Mejora de Prompts (Semana 3-4)**
```typescript
// Optimización basada en correcciones
1. Analizar errores más frecuentes
2. Crear prompts específicos por tipo de proveedor
3. Implementar A/B testing de prompts
4. Métricas de mejora en tiempo real
```

### **Fase 3: OCR Adaptativo (Semana 5-6)**
```typescript
// Patterns dinámicos
1. Generar patterns OCR desde correcciones
2. Sistema de confidence scoring
3. Fallback inteligente IA → OCR → Manual
4. Validación cruzada de métodos
```

### **Fase 4: Templates Inteligentes (Semana 7-8)**
```typescript
// Reconocimiento automático
1. Detectar formatos de factura conocidos
2. Aplicar reglas específicas por template
3. Aprendizaje de nuevos formatos
4. Optimización continua automática
```

---

## 🎯 **CASOS DE USO PRÁCTICOS**

### **Ejemplo 1: Proveedor Recurrente**
```
📄 Factura: "Distribuidora ABC"
🔍 Detección: Template conocido
⚡ Aplicación: Reglas específicas → 98% precisión
✅ Resultado: Extracción perfecta automática
```

### **Ejemplo 2: Nuevo Formato**
```
📄 Factura: Formato desconocido
🤖 Procesamiento: IA general → 85% precisión
✏️ Corrección: Usuario ajusta 2 campos
📚 Aprendizaje: Sistema crea nuevo template
🔄 Próxima vez: 95% precisión automática
```

### **Ejemplo 3: Factura Compleja**
```
📄 Factura: Múltiples servicios + retenciones
🧠 IA: Identifica estructura → 78% precisión
🔍 OCR: Patterns específicos → 82% precisión
🎯 Combinación: Mejor de ambos → 91% precisión
✅ Validación: Usuario confirma → Template guardado
```

---

## 📊 **MÉTRICAS DE MEJORA**

### **Dashboard de Entrenamiento**
```tsx
// Componente de métricas
export function AITrainingDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Precisión General */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Precisión General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {overallAccuracy}%
          </div>
          <Progress value={overallAccuracy} className="mt-2" />
        </CardContent>
      </Card>
      
      {/* Mejora Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Mejora Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            +{weeklyImprovement}%
          </div>
          <p className="text-sm text-gray-600">
            vs semana anterior
          </p>
        </CardContent>
      </Card>
      
      {/* Facturas Procesadas */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Facturas Procesadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalProcessed}
          </div>
          <p className="text-sm text-gray-600">
            {correctionsCount} correcciones aplicadas
          </p>
        </CardContent>
      </Card>
      
    </div>
  )
}
```

### **Análisis por Proveedor**
```sql
-- Query para identificar proveedores problemáticos
SELECT 
    s.name as supplier_name,
    COUNT(*) as total_invoices,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE manual_corrections > 0) as correction_rate,
    ARRAY_AGG(DISTINCT error_fields) as common_errors
FROM pdf_extraction_log pel
JOIN suppliers s ON pel.supplier_id = s.id
WHERE pel.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name
ORDER BY avg_confidence ASC
LIMIT 10;
```

---

## 🚀 **PRÓXIMOS PASOS RECOMENDADOS**

### **Implementación Inmediata (Esta Semana)**
1. ✅ **Agregar botón "Corregir Datos"** en vista previa
2. ✅ **Crear tabla** `pdf_training_corrections`
3. ✅ **Implementar guardado** de correcciones
4. ✅ **Dashboard básico** de métricas

### **Mejoras Semanales**
- **Semana 1**: Sistema de feedback funcionando
- **Semana 2**: Análisis de errores frecuentes  
- **Semana 3**: Prompts optimizados por proveedor
- **Semana 4**: OCR patterns adaptativo
- **Semana 5**: Templates automáticos
- **Semana 6**: Validación cruzada métodos

### **Meta a 2 Meses**
- **📈 95%+ precisión** en proveedores recurrentes
- **🤖 Detección automática** de formatos nuevos
- **⚡ 0.5 segundos** tiempo de procesamiento promedio
- **📊 Dashboard completo** de entrenamiento

---

## 💡 **TIPS PARA MEJORA INMEDIATA**

### **1. Empezar Hoy Mismo:**
```typescript
// Agregar este botón en PDFInvoiceUploader.tsx
<Button 
  variant="outline" 
  onClick={() => setShowCorrectionModal(true)}
  className="mt-4"
>
  ✏️ Corregir Datos para Mejorar IA
</Button>
```

### **2. Recopilar Casos Problemáticos:**
- **Facturas escaneadas** (baja calidad)
- **Formatos no estándar** (planillas Excel exportadas)
- **Múltiples servicios** en una factura
- **Retenciones y descuentos** complejos

### **3. Documentar Patterns:**
- **Proveedores retail**: Códigos de barras, totales destacados
- **Servicios profesionales**: Honorarios, retenciones
- **Importaciones**: Múltiples monedas, aranceles

---

**🎯 ¡COMIENZA HOY MISMO!**

**El sistema actual ya tiene las bases. Ahora solo necesitas:**
1. **Implementar feedback de usuario** 
2. **Analizar errores frecuentes**
3. **Iterar prompts basado en casos reales**

**📈 Con 2-3 semanas de uso y correcciones, tendrás un sistema que lee facturas con 95%+ de precisión específicamente para tus proveedores chilenos.** 