# 🔌 **Guía de Integración con tu Sistema de IA Existente**

**Objetivo:** Conectar tu sistema de IA que ya funciona con el nuevo sistema de matching inteligente de productos.

---

## 🎯 **Punto de Integración Principal**

### **Archivo a Modificar:**
```
src/components/purchases/AIInvoiceProcessor.tsx
```

### **Función a Reemplazar:**
```javascript
const extractDataWithAI = async (text: string): Promise<any> => {
  // ⚠️ AQUÍ va tu código de IA existente
}
```

---

## 🔧 **Cómo Integrar tu IA**

### **Paso 1: Localiza la Función**
Busca en `AIInvoiceProcessor.tsx` esta sección:
```javascript
// ╔════════════════════════════════════════════════════════════════════════════════════════╗
// ║ 🔌 PUNTO DE INTEGRACIÓN CON TU SISTEMA DE IA EXISTENTE                                ║
```

### **Paso 2: Reemplaza con tu Código**
```javascript
const extractDataWithAI = async (text: string): Promise<any> => {
  console.log('🤖 Llamando a tu sistema de IA...');
  
  // 🔥 REEMPLAZA ESTA SECCIÓN CON TU CÓDIGO REAL:
  
  // Opción A: Si tienes una función existente
  const aiResult = await tuFuncionDeIA(text);
  
  // Opción B: Si usas una API externa  
  const response = await fetch('/api/tu-endpoint-ia', {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: { 'Content-Type': 'application/json' }
  });
  const aiResult = await response.json();
  
  // Opción C: Si usas OpenAI/Claude directamente
  const aiResult = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Extrae datos estructurados: ${text}`
    }]
  });
  
  // 🎯 DEVOLVER en este formato específico:
  return {
    supplier: {
      name: aiResult.proveedor_nombre,
      rut: aiResult.proveedor_rut, 
      address: aiResult.proveedor_direccion
    },
    invoice: {
      number: aiResult.factura_numero,
      date: aiResult.factura_fecha, // YYYY-MM-DD
      total: aiResult.factura_total,
      subtotal: aiResult.factura_subtotal,
      tax: aiResult.factura_impuesto
    },
    products: aiResult.productos.map(p => ({
      description: p.nombre_producto,
      quantity: p.cantidad,
      unitPrice: p.precio_unitario,
      subtotal: p.subtotal
    }))
  };
};
```

---

## 📋 **Formato de Respuesta Requerido**

Tu IA debe devolver **exactamente** este formato:

```javascript
{
  supplier: {
    name: string,           // Nombre del proveedor
    rut?: string,          // RUT del proveedor (opcional)
    address?: string       // Dirección (opcional)
  },
  invoice: {
    number: string,        // Número de factura
    date: string,          // Fecha en formato YYYY-MM-DD
    total: number,         // Total de la factura
    subtotal: number,      // Subtotal sin impuestos
    tax: number            // Total de impuestos
  },
  products: Array<{
    description: string,   // Nombre/descripción del producto
    quantity: number,      // Cantidad
    unitPrice: number,     // Precio unitario
    subtotal: number       // Subtotal de la línea
  }>
}
```

---

## ✅ **Ejemplos de Integración**

### **Ejemplo 1: Tu Función Existente**
```javascript
const extractDataWithAI = async (text: string) => {
  // Usando tu función existente que ya funciona
  const resultado = await miFuncionExistenteDeIA(text);
  
  // Mapear tu formato al formato requerido
  return {
    supplier: {
      name: resultado.supplier_name,
      rut: resultado.supplier_rut,
      address: resultado.supplier_address
    },
    invoice: {
      number: resultado.invoice_number,
      date: resultado.invoice_date,
      total: parseFloat(resultado.total_amount),
      subtotal: parseFloat(resultado.subtotal_amount),
      tax: parseFloat(resultado.tax_amount)
    },
    products: resultado.line_items.map(item => ({
      description: item.product_description,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(item.unit_price),
      subtotal: parseFloat(item.line_total)
    }))
  };
};
```

### **Ejemplo 2: API Externa**
```javascript
const extractDataWithAI = async (text: string) => {
  const response = await fetch('https://tu-api.com/extract', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer tu-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      document_text: text,
      extraction_type: 'invoice'
    })
  });
  
  const data = await response.json();
  
  return {
    supplier: {
      name: data.extracted.supplier.name,
      rut: data.extracted.supplier.tax_id,
      address: data.extracted.supplier.address
    },
    invoice: {
      number: data.extracted.document.number,
      date: data.extracted.document.date,
      total: data.extracted.totals.total,
      subtotal: data.extracted.totals.subtotal,
      tax: data.extracted.totals.tax
    },
    products: data.extracted.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.total
    }))
  };
};
```

### **Ejemplo 3: OpenAI/ChatGPT**
```javascript
const extractDataWithAI = async (text: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Extrae datos estructurados de facturas y devuelve JSON válido"
    }, {
      role: "user", 
      content: `Extrae estos datos de la factura:\n\n${text}`
    }],
    temperature: 0.1
  });
  
  const extracted = JSON.parse(completion.choices[0].message.content);
  
  return {
    supplier: {
      name: extracted.proveedor,
      rut: extracted.rut_proveedor,
      address: extracted.direccion_proveedor
    },
    invoice: {
      number: extracted.numero_factura,
      date: extracted.fecha_factura,
      total: extracted.total,
      subtotal: extracted.subtotal,
      tax: extracted.impuestos
    },
    products: extracted.productos.map(p => ({
      description: p.descripcion,
      quantity: p.cantidad,
      unitPrice: p.precio_unitario,
      subtotal: p.subtotal
    }))
  };
};
```

---

## 🧪 **Cómo Probar la Integración**

### **1. Mantén la Simulación Primero**
- No elimines el código de simulación inmediatamente
- Prueba que el flujo completo funciona con datos falsos
- Verifica que el matching de productos funciona

### **2. Integra Gradualmente**
```javascript
const extractDataWithAI = async (text: string) => {
  console.log('🧪 Modo prueba: usando datos simulados');
  
  // PASO 1: Primero solo llama tu IA sin usar el resultado
  const tuResultado = await tuFuncionDeIA(text);
  console.log('🤖 Resultado de tu IA:', tuResultado);
  
  // PASO 2: Sigue devolviendo datos simulados mientras pruebas
  return {
    supplier: { name: "Simulado", rut: "12345678-9" },
    // ... resto simulado
  };
  
  // PASO 3: Cuando estés seguro, reemplaza con:
  // return mapearTuResultado(tuResultado);
};
```

### **3. Verifica el Formato**
```javascript
const extractDataWithAI = async (text: string) => {
  const resultado = await tuFuncionDeIA(text);
  
  // Validar formato antes de devolver
  if (!resultado.supplier?.name) {
    throw new Error('IA no extrajo nombre del proveedor');
  }
  
  if (!resultado.products?.length) {
    throw new Error('IA no extrajo productos');
  }
  
  return resultado;
};
```

---

## 🔍 **Debugging y Monitoreo**

### **Logs Útiles:**
```javascript
const extractDataWithAI = async (text: string) => {
  console.log('📄 Texto enviado a IA:', text.substring(0, 200) + '...');
  
  const resultado = await tuFuncionDeIA(text);
  
  console.log('🤖 Respuesta de IA:', resultado);
  console.log('📊 Productos extraídos:', resultado.products?.length || 0);
  console.log('💰 Total extraído:', resultado.invoice?.total);
  
  return resultado;
};
```

### **Manejo de Errores:**
```javascript
const extractDataWithAI = async (text: string) => {
  try {
    const resultado = await tuFuncionDeIA(text);
    return resultado;
  } catch (error) {
    console.error('❌ Error en IA:', error);
    
    // Fallback con datos mínimos para no romper el flujo
    return {
      supplier: { name: "Error - Revisar manualmente" },
      invoice: { 
        number: "ERROR", 
        date: new Date().toISOString().split('T')[0],
        total: 0, subtotal: 0, tax: 0 
      },
      products: [{
        description: "Error en extracción - Revisar PDF",
        quantity: 1,
        unitPrice: 0,
        subtotal: 0
      }]
    };
  }
};
```

---

## 🚀 **Resultado Final**

Una vez integrado correctamente:

1. **Usuario sube PDF** → Extracción de texto funciona
2. **Tu IA procesa** → Datos estructurados extraídos
3. **Sistema busca productos** → Matching inteligente automático
4. **Usuario confirma dudas** → Solo cuando es necesario
5. **Factura creada** → Con productos vinculados a tu base de datos

**🎉 ¡Tu IA + Matching Inteligente = Facturas 100% automatizadas!**

---

**Próximo paso:** Modifica `extractDataWithAI()` con tu código real de IA. 