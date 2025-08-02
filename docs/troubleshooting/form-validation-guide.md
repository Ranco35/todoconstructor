# Guía de Validación de Formularios - Troubleshooting

## 📋 Descripción

Esta guía proporciona metodologías y soluciones para debugging y resolución de problemas comunes en formularios de React con Next.js y Prisma.

## 🚨 Errores Comunes y Soluciones

### 1. **Error: `Cannot read properties of null (reading 'toString')`**

#### **Síntomas:**
```
TypeError: Cannot read properties of null (reading 'toString')
    at handleSubmit (FormComponent.tsx:150:108)
```

#### **Causa Principal:**
Intentar convertir valores null/undefined a string sin validación previa.

#### **Código Problemático:**
```typescript
// ❌ INCORRECTO - Puede causar error
formData.append('categoryId', data.categoryId.toString());
formData.append('price', data.price.toString());
```

#### **Solución:**
```typescript
// ✅ CORRECTO - Con validación
if (data.categoryId != null) {
  formData.append('categoryId', data.categoryId.toString());
}

if (data.price != null && data.price !== undefined) {
  formData.append('price', data.price.toString());
}
```

#### **Patrón de Validación Recomendado:**
```typescript
const safeAppendToFormData = (
  formData: FormData, 
  key: string, 
  value: any
) => {
  if (value != null && value !== undefined) {
    formData.append(key, value.toString());
  }
};

// Uso
safeAppendToFormData(formData, 'categoryId', data.categoryId);
safeAppendToFormData(formData, 'price', data.price);
```

---

### 2. **Error: `Invalid Prisma invocation - Unknown argument`**

#### **Síntomas:**
```
Unknown argument `type`. Did you mean `typeid`?
Unknown argument `iva`. Did you mean `vat`?
```

#### **Causa Principal:**
Desalineación entre nombres de campos en el formulario y el esquema de Prisma.

#### **Debugging Step-by-Step:**

1. **Verificar esquema Prisma:**
```bash
npx prisma studio
# O revisar schema.prisma directamente
```

2. **Comparar campos enviados vs esquema:**
```typescript
// ❌ INCORRECTO - Campos que no existen
const data = {
  type: "CONSUMIBLE",    // Campo inexistente
  iva: 21,               // Debería ser 'vat'
  minimum_stock: 10      // No existe en tabla Product
};
```

3. **Corregir mapeo de campos:**
```typescript
// ✅ CORRECTO - Campos según esquema
const data = {
  typeid: 1,             // Referencia a Product_Type
  vat: 21,               // Campo correcto
  // Stock se maneja en tabla separada Product_Stock
};
```

#### **Herramienta de Validación:**
```typescript
const validatePrismaFields = (data: any, model: string) => {
  const allowedFields = {
    Product: ['id', 'typeid', 'name', 'description', 'vat', 'categoryid', 'supplierid'],
    Product_Stock: ['id', 'current', 'min', 'max', 'warehouseid']
  };
  
  const invalid = Object.keys(data).filter(
    key => !allowedFields[model]?.includes(key)
  );
  
  if (invalid.length > 0) {
    console.warn(`Campos inválidos para ${model}:`, invalid);
  }
};
```

---

### 3. **Error: Validación de Lógica de Negocio**

#### **Síntomas:**
- Datos inconsistentes en base de datos
- Reglas de negocio no cumplidas
- Asignaciones incorrectas

#### **Ejemplo: Compatibilidad Producto-Bodega**

```typescript
// ✅ Sistema de validación robusto
const validateBusinessRules = async (productType: string, warehouseId?: number) => {
  const compatibilityMatrix = {
    'CONSUMIBLE': ['CONSUMIBLE', 'ALMACENAMIENTO'],
    'ALMACENABLE': ['CONSUMIBLE', 'ALMACENAMIENTO'],
    'INVENTARIO': ['INVENTARIO'],
    'SERVICIO': [],
    'COMBO': ['CONSUMIBLE', 'ALMACENAMIENTO']
  };
  
  if (warehouseId && productType !== 'SERVICIO') {
    const warehouse = await getWarehouse(warehouseId);
    const allowedTypes = compatibilityMatrix[productType] || [];
    
    if (!allowedTypes.includes(warehouse.type)) {
      throw new Error(
        `Producto ${productType} no compatible con bodega ${warehouse.type}. ` +
        `Tipos permitidos: ${allowedTypes.join(', ')}`
      );
    }
  }
};
```

---

## 🔧 Debugging Metodologías

### 1. **Logging Estratégico**

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    // Log 1: Datos de entrada
    console.log('🔍 Datos del formulario:', Object.fromEntries(formData));
    
    // Log 2: Transformaciones
    const processedData = processFormData(formData);
    console.log('🔄 Datos procesados:', processedData);
    
    // Log 3: Antes de envío a DB
    console.log('📤 Enviando a Prisma:', processedData);
    
    const result = await createRecord(processedData);
    
    // Log 4: Resultado
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    // Log 5: Error detallado
    console.error('❌ Error detallado:', {
      message: error.message,
      stack: error.stack,
      formData: Object.fromEntries(formData)
    });
    throw error;
  }
};
```

### 2. **Validación por Capas**

```typescript
// Capa 1: Validación de Frontend
const validateClientSide = (data: FormData): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.get('name')) errors.push('Nombre es requerido');
  if (data.get('price') && isNaN(Number(data.get('price')))) {
    errors.push('Precio debe ser numérico');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Capa 2: Validación de Server Action
const validateServerSide = (data: any): void => {
  if (!data.name?.trim()) {
    throw new Error('Nombre no puede estar vacío');
  }
  
  if (data.price < 0) {
    throw new Error('Precio no puede ser negativo');
  }
};

// Capa 3: Validación de Base de Datos (Prisma)
// Configurada en schema.prisma con constraints
```

### 3. **Testing de Formularios**

```typescript
// Test unitario para validaciones
describe('FormValidation', () => {
  test('debe validar campos requeridos', () => {
    const formData = new FormData();
    const result = validateClientSide(formData);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nombre es requerido');
  });
  
  test('debe manejar valores null sin errores', () => {
    const data = { categoryId: null, price: undefined };
    
    expect(() => {
      const formData = new FormData();
      if (data.categoryId != null) {
        formData.append('categoryId', data.categoryId.toString());
      }
    }).not.toThrow();
  });
});
```

---

## 🛠️ Herramientas de Debugging

### 1. **Console Debugging**
```typescript
// Helper para debugging de FormData
const debugFormData = (formData: FormData, label = 'FormData') => {
  console.group(`🔍 ${label}`);
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value, `(${typeof value})`);
  }
  console.groupEnd();
};

// Uso
debugFormData(formData, 'Datos antes de procesar');
```

### 2. **Prisma Query Logging**
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}

// O en código
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### 3. **Error Boundary para Formularios**
```typescript
class FormErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Form Error:', error, errorInfo);
    // Enviar a servicio de logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Error en el formulario</h2>
          <details>
            <summary>Detalles técnicos</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📝 Checklist de Validación

### **Antes de Enviar Formulario:**
- [ ] Todos los campos requeridos están presentes
- [ ] Tipos de datos son correctos (number, string, boolean)
- [ ] Valores no son null/undefined donde no se permite
- [ ] Rangos de valores son válidos (ej: IVA 0-100%)
- [ ] Reglas de negocio se cumplen

### **En Server Action:**
- [ ] Validación de entrada robusta
- [ ] Manejo de errores específicos
- [ ] Campos mapeados correctamente al esquema Prisma
- [ ] Transacciones cuando sea necesario
- [ ] Logging apropiado

### **En Base de Datos:**
- [ ] Constraints definidos en schema
- [ ] Relaciones correctas
- [ ] Índices para performance
- [ ] Validaciones de integridad

---

## 🎯 Mejores Prácticas

### 1. **Validación Defensiva**
```typescript
// Siempre asumir que los datos pueden ser null/undefined
const safeToString = (value: any): string => {
  if (value == null) return '';
  return value.toString();
};

const safeToNumber = (value: any): number | null => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};
```

### 2. **Mensajes de Error Claros**
```typescript
// ❌ Error genérico
throw new Error('Error al guardar');

// ✅ Error específico y accionable
throw new Error(
  'No se puede asignar producto CONSUMIBLE a bodega INVENTARIO. ' +
  'Selecciona una bodega de tipo CONSUMIBLE o ALMACENAMIENTO.'
);
```

### 3. **Validación en Tiempo Real**
```typescript
const useRealtimeValidation = (value: any, validator: Function) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (value) {
      try {
        validator(value);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [value, validator]);
  
  return error;
};
```

### 4. **Separación de Responsabilidades**
- **Frontend:** Validación UX y tipos básicos
- **Server Actions:** Validación de negocio y seguridad
- **Base de Datos:** Integridad y constraints

---

## 📚 Recursos Adicionales

### **Documentación:**
- [React Hook Form](https://react-hook-form.com/) - Para formularios complejos
- [Zod](https://zod.dev/) - Validación de esquemas TypeScript
- [Prisma Validation](https://www.prisma.io/docs/concepts/components/prisma-client/crud#data-validation)

### **Tools:**
- [Prisma Studio](https://www.prisma.io/studio) - Explorar base de datos
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debug componentes
- [Next.js DevTools](https://nextjs.org/docs/advanced-features/debugging) - Debug server actions

---

**Última actualización:** Diciembre 2024  
**Aplicable a:** React, Next.js, Prisma, TypeScript  
**Nivel:** Intermedio-Avanzado 