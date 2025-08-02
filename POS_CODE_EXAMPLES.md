# Sistema POS - Ejemplos de Código y Casos de Uso

## Ejemplos de Implementación

### 1. Inicialización del Sistema de Diagnóstico

```typescript
// src/components/pos/ReceptionPOS.tsx
import { diagnosePOSIssues, fixMenuDiaIssue, syncPOSProducts } from '@/actions/pos/pos-actions';

export default function ReceptionPOS() {
  const [diagnosticMessages, setDiagnosticMessages] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  // Ejecutar diagnóstico automático al cargar la página
  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    try {
      console.log('🔍 DIAGNÓSTICO POS - Iniciando análisis...');
      
      // Ejecutar diagnóstico principal
      const diagnosticResult = await diagnosePOSIssues(1); // registerTypeId: 1
      
      // Ejecutar correcciones automáticas
      const fixResult = await fixMenuDiaIssue(1);
      const syncResult = await syncPOSProducts();
      
      // Combinar todos los mensajes
      const allMessages = [
        ...diagnosticResult,
        ...fixResult,
        ...syncResult
      ];
      
      setDiagnosticMessages(allMessages);
      setShowAlert(allMessages.length > 0);
      
      // Auto-ocultar alerta después de 10 segundos
      setTimeout(() => setShowAlert(false), 10000);
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      setDiagnosticMessages([`❌ Error en diagnóstico: ${error.message}`]);
      setShowAlert(true);
    }
  };

  return (
    <div className="p-6">
      {/* Alerta de diagnóstico */}
      {showAlert && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            🔍 Diagnóstico del Sistema POS
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {diagnosticMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
          <button
            onClick={() => setShowAlert(false)}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      )}
      
      {/* Resto del componente POS */}
      <h1 className="text-2xl font-bold mb-4">🏨 POS Recepción</h1>
      {/* ... contenido del POS ... */}
    </div>
  );
}
```

### 2. Función de Diagnóstico Completa

```typescript
// src/actions/pos/pos-actions.ts
import { createClient } from '@/utils/supabase/client';

export async function diagnosePOSIssues(registerTypeId: number): Promise<string[]> {
  const supabase = createClient();
  const messages: string[] = [];

  try {
    console.log('🔍 DIAGNÓSTICO POS - Iniciando análisis...');
    
    // 1. Verificar categorías POS
    console.log(`📋 Verificando categorías POS para registerTypeId: ${registerTypeId}`);
    
    const { data: categories } = await supabase
      .from('POSProductCategory')
      .select('id, name, displayName, isActive')
      .eq('cashRegisterTypeId', registerTypeId);

    console.log(`📊 Categorías encontradas: ${categories?.length || 0}`);
    console.log('📋 Categorías:', categories);

    const activeCategories = categories?.filter(cat => cat.isActive) || [];
    console.log(`✅ Categorías activas: ${activeCategories.length}`);
    console.log('📋 Categorías activas:', activeCategories.map(cat => ({ 
      id: cat.id, 
      name: cat.name, 
      displayName: cat.displayName 
    })));

    messages.push(`📊 Categorías encontradas: ${categories?.length || 0}`);
    messages.push(`✅ Categorías activas: ${activeCategories.length}`);

    // 2. Verificar productos POS
    const categoryIds = activeCategories.map(cat => cat.id).join(',');
    console.log(`🔍 Buscando productos POS para categoryIds: ${categoryIds}`);
    
    const { data: posProducts } = await supabase
      .from('POSProduct')
      .select('id, name, price, isActive, categoryId')
      .in('categoryId', activeCategories.map(cat => cat.id));

    console.log(`📦 Productos POS encontrados: ${posProducts?.length || 0}`);
    console.log('📋 Productos POS:', posProducts);

    const activePOSProducts = posProducts?.filter(product => product.isActive) || [];
    console.log(`✅ Productos POS válidos (activos + habilitados): ${activePOSProducts.length}`);
    console.log('📋 Productos válidos:', activePOSProducts);

    messages.push(`📦 Productos POS encontrados: ${posProducts?.length || 0}`);
    messages.push(`✅ Productos activos: ${activePOSProducts.length}`);

    // 3. Verificar sincronización con Product
    const { data: enabledProducts } = await supabase
      .from('Product')
      .select('id, name, price')
      .eq('isPOSEnabled', true);

    console.log(`📦 Productos habilitados para POS en Product: ${enabledProducts?.length || 0}`);
    messages.push(`📦 Productos habilitados: ${enabledProducts?.length || 0}`);

    // 4. Verificar productos no sincronizados
    const syncedProductIds = posProducts?.map(p => p.id) || [];
    const enabledProductIds = enabledProducts?.map(p => p.id) || [];
    const unsyncedProducts = enabledProducts?.filter(p => !syncedProductIds.includes(p.id)) || [];

    console.log(`📊 Productos sincronizados: ${syncedProductIds.length}`);
    console.log(`⚠️ Productos no sincronizados: ${unsyncedProducts.length}`);
    console.log('📋 Productos no sincronizados:', unsyncedProducts);

    if (unsyncedProducts.length > 0) {
      messages.push(`⚠️ ${unsyncedProducts.length} productos necesitan sincronización`);
    }

    // 5. Verificar categoría específica "Menu Dia"
    const menuDiaCategories = categories?.filter(cat => 
      cat.name.toLowerCase().includes('menu dia')
    ) || [];
    
    console.log(`🔍 Categorías que contienen "Menu Dia": ${menuDiaCategories.length}`);
    console.log('📋 Categorías Menu Dia:', menuDiaCategories);

    if (menuDiaCategories.length === 0) {
      messages.push('⚠️ No se encontró categoría "Menu Dia"');
    } else {
      messages.push(`✅ Categoría "Menu Dia" encontrada`);
    }

    return messages;

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return [`❌ Error en diagnóstico: ${error.message}`];
  }
}
```

### 3. Corrección de Problemas de Menu Dia

```typescript
export async function fixMenuDiaIssue(registerTypeId: number): Promise<string[]> {
  const supabase = createClient();
  const messages: string[] = [];

  try {
    console.log('🔧 CORRIGIENDO PROBLEMA DE MENU DIA...');
    
    // 1. Buscar categorías "Menu Dia"
    const { data: menuDiaCategories } = await supabase
      .from('POSProductCategory')
      .select('*')
      .ilike('name', '%Menu Dia%');

    console.log(`🔍 Categorías encontradas con "Menu Dia": ${menuDiaCategories?.length || 0}`);
    console.log('📋 Categorías encontradas:', menuDiaCategories);

    if (!menuDiaCategories || menuDiaCategories.length === 0) {
      // Crear categoría Menu Dia si no existe
      console.log('➕ Creando categoría "Menu Dia"...');
      
      const { data: newCategory, error } = await supabase
        .from('POSProductCategory')
        .insert([{
          name: 'Menu Dia',
          displayName: 'Menú del Día',
          cashRegisterTypeId: registerTypeId,
          isActive: true,
          sortOrder: 0,
          icon: '🍽️',
          color: '#FF6B35'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando categoría:', error);
        messages.push(`❌ Error creando categoría: ${error.message}`);
      } else {
        console.log('✅ Categoría "Menu Dia" creada:', newCategory);
        messages.push('✅ Categoría "Menu Dia" creada exitosamente');
      }

      return messages;
    }

    // 2. Verificar y corregir registerTypeId
    for (const category of menuDiaCategories) {
      if (category.cashRegisterTypeId !== registerTypeId) {
        console.log(`🔄 Corrigiendo tipo de caja para "${category.name}"...`);
        
        const { data: updatedCategory, error } = await supabase
          .from('POSProductCategory')
          .update({ cashRegisterTypeId: registerTypeId })
          .eq('id', category.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error actualizando categoría:', error);
          messages.push(`❌ Error actualizando "${category.name}": ${error.message}`);
        } else {
          console.log(`✅ Tipo de caja corregido para "${category.name}":`, updatedCategory);
          messages.push(`✅ Tipo de caja corregido para "${category.name}"`);
        }
      }

      // 3. Verificar y activar categoría si está inactiva
      if (!category.isActive) {
        console.log(`🔄 Activando categoría "${category.name}"...`);
        
        const { data: activatedCategory, error } = await supabase
          .from('POSProductCategory')
          .update({ isActive: true })
          .eq('id', category.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error activando categoría:', error);
          messages.push(`❌ Error activando "${category.name}": ${error.message}`);
        } else {
          console.log(`✅ Categoría "${category.name}" activada:`, activatedCategory);
          messages.push(`✅ Categoría "${category.name}" activada`);
        }
      }
    }

    if (messages.length === 0) {
      messages.push('✅ Categoría "Menu Dia" está correctamente configurada');
    }

    return messages;

  } catch (error) {
    console.error('❌ Error corrigiendo Menu Dia:', error);
    return [`❌ Error corrigiendo Menu Dia: ${error.message}`];
  }
}
```

### 4. Sincronización de Productos

```typescript
export async function syncPOSProducts(): Promise<string[]> {
  const supabase = createClient();
  const messages: string[] = [];

  try {
    console.log('🔄 Iniciando sincronización de productos POS...');
    
    // 1. Obtener productos habilitados para POS
    console.log('🔍 Buscando productos habilitados para POS...');
    
    const { data: enabledProducts } = await supabase
      .from('Product')
      .select('id, name, price, categoryId')
      .eq('isPOSEnabled', true);

    console.log(`📊 Productos encontrados para sincronizar: ${enabledProducts?.length || 0}`);

    if (!enabledProducts || enabledProducts.length === 0) {
      console.log('ℹ️ No hay productos para sincronizar');
      messages.push('ℹ️ No hay productos habilitados para POS');
      return messages;
    }

    // 2. Obtener productos ya existentes en POS
    const { data: existingPOSProducts } = await supabase
      .from('POSProduct')
      .select('productId');

    const existingProductIds = existingPOSProducts?.map(p => p.productId) || [];

    // 3. Encontrar productos que necesitan sincronización
    const productsToSync = enabledProducts.filter(p => !existingProductIds.includes(p.id));

    console.log(`🔄 Productos a sincronizar: ${productsToSync.length}`);

    if (productsToSync.length === 0) {
      messages.push('✅ Todos los productos están sincronizados');
      return messages;
    }

    // 4. Crear entradas en POSProduct para productos no sincronizados
    for (const product of productsToSync) {
      try {
        const { data: newPOSProduct, error } = await supabase
          .from('POSProduct')
          .insert([{
            productId: product.id,
            name: product.name,
            price: product.price,
            categoryId: product.categoryId || 1, // Categoría por defecto
            isActive: true,
            sortOrder: 0
          }])
          .select()
          .single();

        if (error) {
          console.error(`❌ Error sincronizando producto ${product.name}:`, error);
          messages.push(`❌ Error sincronizando "${product.name}": ${error.message}`);
        } else {
          console.log(`✅ Producto sincronizado: ${product.name}`);
          messages.push(`✅ Producto sincronizado: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ Error procesando producto ${product.name}:`, error);
        messages.push(`❌ Error procesando "${product.name}": ${error.message}`);
      }
    }

    return messages;

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return [`❌ Error en sincronización: ${error.message}`];
  }
}
```

### 5. Creación de Productos de Prueba

```typescript
export async function createSampleMenuDiaProducts(): Promise<string[]> {
  const supabase = createClient();
  const messages: string[] = [];

  try {
    console.log('🍽️ CREANDO PRODUCTOS DE PRUEBA PARA MENU DIA...');
    
    // 1. Buscar categoría Menu Dia
    const { data: menuDiaCategory, error: categoryError } = await supabase
      .from('POSProductCategory')
      .select('id')
      .ilike('name', '%Menu Dia%')
      .eq('cashRegisterTypeId', 1)
      .single();

    if (categoryError) {
      console.error('❌ Error buscando categoría Menu Dia:', categoryError);
      messages.push(`❌ Error buscando categoría Menu Dia: ${categoryError.message}`);
      return messages;
    }

    // 2. Productos de prueba a crear
    const sampleProducts = [
      {
        name: 'Menú Ejecutivo',
        price: 15000,
        description: 'Entrada + Plato principal + Postre + Bebida',
        icon: '🍽️'
      },
      {
        name: 'Menú Vegetariano',
        price: 12000,
        description: 'Opción vegetariana completa',
        icon: '🥗'
      },
      {
        name: 'Menú Infantil',
        price: 8000,
        description: 'Menú especial para niños',
        icon: '👶'
      }
    ];

    // 3. Crear productos en Product
    for (const product of sampleProducts) {
      try {
        // Crear en tabla Product
        const { data: newProduct, error: productError } = await supabase
          .from('Product')
          .insert([{
            name: product.name,
            price: product.price,
            description: product.description,
            isPOSEnabled: true,
            isActive: true,
            categoryId: 1 // Categoría por defecto
          }])
          .select()
          .single();

        if (productError) {
          console.error(`❌ Error creando producto ${product.name}:`, productError);
          messages.push(`❌ Error creando "${product.name}": ${productError.message}`);
          continue;
        }

        // Crear en tabla POSProduct
        const { data: newPOSProduct, error: posError } = await supabase
          .from('POSProduct')
          .insert([{
            productId: newProduct.id,
            name: product.name,
            price: product.price,
            categoryId: menuDiaCategory.id,
            isActive: true,
            sortOrder: 0
          }])
          .select()
          .single();

        if (posError) {
          console.error(`❌ Error creando producto POS ${product.name}:`, posError);
          messages.push(`❌ Error creando POS "${product.name}": ${posError.message}`);
        } else {
          console.log(`✅ Producto creado: ${product.name} - $${product.price}`);
          messages.push(`✅ ${product.icon} ${product.name} creado - $${product.price.toLocaleString()}`);
        }

      } catch (error) {
        console.error(`❌ Error procesando producto ${product.name}:`, error);
        messages.push(`❌ Error procesando "${product.name}": ${error.message}`);
      }
    }

    return messages;

  } catch (error) {
    console.error('❌ Error creando productos de prueba:', error);
    return [`❌ Error creando productos de prueba: ${error.message}`];
  }
}
```

## Casos de Uso Prácticos

### Caso 1: Configuración Inicial del POS

```typescript
// Ejecutar al configurar un nuevo POS
async function setupNewPOS(registerTypeId: number) {
  const messages = [];
  
  // 1. Diagnosticar estado actual
  const diagnosticResult = await diagnosePOSIssues(registerTypeId);
  messages.push(...diagnosticResult);
  
  // 2. Corregir problemas encontrados
  const fixResult = await fixMenuDiaIssue(registerTypeId);
  messages.push(...fixResult);
  
  // 3. Sincronizar productos
  const syncResult = await syncPOSProducts();
  messages.push(...syncResult);
  
  // 4. Crear productos de prueba si es necesario
  const sampleResult = await createSampleMenuDiaProducts();
  messages.push(...sampleResult);
  
  return messages;
}
```

### Caso 2: Mantenimiento Diario

```typescript
// Ejecutar como tarea de mantenimiento diario
async function dailyMaintenance() {
  try {
    // Verificar ambos tipos de POS
    const receptionResult = await diagnosePOSIssues(1);
    const restaurantResult = await diagnosePOSIssues(2);
    
    // Sincronizar productos
    const syncResult = await syncPOSProducts();
    
    // Log de resultados
    console.log('📊 Mantenimiento diario completado');
    console.log('🏨 Recepción:', receptionResult);
    console.log('🍽️ Restaurante:', restaurantResult);
    console.log('🔄 Sincronización:', syncResult);
    
  } catch (error) {
    console.error('❌ Error en mantenimiento diario:', error);
  }
}
```

### Caso 3: Validación de Datos

```typescript
// Validar integridad de datos POS
async function validatePOSData(registerTypeId: number): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Validar categorías
    const { data: categories } = await supabase
      .from('POSProductCategory')
      .select('id, name, isActive')
      .eq('cashRegisterTypeId', registerTypeId);
    
    if (!categories || categories.length === 0) {
      console.log('❌ No hay categorías configuradas');
      return false;
    }
    
    // Validar productos
    const { data: products } = await supabase
      .from('POSProduct')
      .select('id, name, price, isActive')
      .in('categoryId', categories.map(c => c.id));
    
    if (!products || products.length === 0) {
      console.log('❌ No hay productos configurados');
      return false;
    }
    
    // Validar precios
    const invalidPrices = products.filter(p => !p.price || p.price <= 0);
    if (invalidPrices.length > 0) {
      console.log('❌ Productos con precios inválidos:', invalidPrices);
      return false;
    }
    
    console.log('✅ Validación de datos POS exitosa');
    return true;
    
  } catch (error) {
    console.error('❌ Error validando datos POS:', error);
    return false;
  }
}
```

## Mejores Prácticas

### 1. Manejo de Errores

```typescript
// Patrón de manejo de errores para operaciones POS
async function safeExecutePOSOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> {
  try {
    console.log(`🔄 Iniciando ${operationName}...`);
    const result = await operation();
    console.log(`✅ ${operationName} completado exitosamente`);
    return result;
  } catch (error) {
    console.error(`❌ Error en ${operationName}:`, error);
    // Aquí podrías enviar el error a un servicio de monitoreo
    return null;
  }
}
```

### 2. Optimización de Consultas

```typescript
// Consulta optimizada para obtener datos POS
async function getOptimizedPOSData(registerTypeId: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('POSProductCategory')
    .select(`
      id,
      name,
      displayName,
      isActive,
      POSProduct (
        id,
        name,
        price,
        isActive,
        Product (
          id,
          name,
          isPOSEnabled
        )
      )
    `)
    .eq('cashRegisterTypeId', registerTypeId)
    .eq('isActive', true)
    .eq('POSProduct.isActive', true);
  
  return { data, error };
}
```

### 3. Caching de Resultados

```typescript
// Cache simple para resultados de diagnóstico
const diagnosticCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getCachedDiagnostic(registerTypeId: number): Promise<string[]> {
  const cacheKey = `diagnostic_${registerTypeId}`;
  const cached = diagnosticCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('🔄 Usando resultado de diagnóstico en cache');
    return cached.data;
  }
  
  const result = await diagnosePOSIssues(registerTypeId);
  diagnosticCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}
```

## Configuración de Pruebas

### Test de Diagnóstico

```typescript
// Test para verificar funcionamiento del diagnóstico
describe('POS Diagnostic System', () => {
  test('should diagnose reception POS issues', async () => {
    const result = await diagnosePOSIssues(1);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });
  
  test('should fix Menu Dia issues', async () => {
    const result = await fixMenuDiaIssue(1);
    expect(result).toBeInstanceOf(Array);
    expect(result.some(msg => msg.includes('Menu Dia'))).toBe(true);
  });
  
  test('should sync POS products', async () => {
    const result = await syncPOSProducts();
    expect(result).toBeInstanceOf(Array);
  });
});
```

## Monitoreo y Alertas

### Sistema de Alertas

```typescript
// Sistema de alertas para problemas críticos
async function checkCriticalIssues(registerTypeId: number) {
  const issues = await diagnosePOSIssues(registerTypeId);
  
  const criticalIssues = issues.filter(issue => 
    issue.includes('❌') || issue.includes('⚠️')
  );
  
  if (criticalIssues.length > 0) {
    // Enviar alerta (email, Slack, etc.)
    await sendAlert({
      type: 'POS_CRITICAL_ISSUE',
      registerTypeId,
      issues: criticalIssues,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

Esta documentación proporciona ejemplos prácticos y casos de uso reales para el sistema POS de Admintermas, facilitando su implementación y mantenimiento. 