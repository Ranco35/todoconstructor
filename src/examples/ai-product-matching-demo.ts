/**
 * 🤖 DEMO: Sistema de Matching Inteligente de Productos
 * 
 * Este archivo muestra cómo integrar el sistema de matching
 * con datos extraídos por IA de facturas PDF
 */

import { processAIExtractedInvoice, createDraftInvoiceFromAI } from '@/actions/purchases/ai-invoice-processing';
import { matchExtractedProducts } from '@/utils/product-matching-ai';

// Ejemplo de datos extraídos por IA de una factura PDF
const exampleExtractedData = {
  supplier: {
    name: "Distribuidora San Miguel Ltda",
    rut: "76.543.210-8",
    address: "Av. San Miguel 1234, Santiago"
  },
  invoice: {
    number: "F-000012345",
    date: "2025-01-16",
    dueDate: "2025-02-15",
    total: 45680,
    subtotal: 38387,
    tax: 7293
  },
  products: [
    {
      description: "COCA COLA SIN AZUCAR X06 LATA 350 CC",
      quantity: 4,
      unitPrice: 3300,
      subtotal: 13200
    },
    {
      description: "40253",  // Solo código SKU
      quantity: 2,
      unitPrice: 17488,
      subtotal: 34976
    },
    {
      description: "Servicio de flete especial",
      quantity: 1,
      unitPrice: 5000,
      subtotal: 5000
    },
    {
      description: "HARINA QUINTAL",
      quantity: 1,
      unitPrice: 18500,
      subtotal: 18500
    }
  ]
};

/**
 * Ejemplo 1: Procesamiento básico de matching
 */
export async function exampleBasicMatching() {
  console.log('🚀 Ejemplo 1: Procesamiento básico de matching');
  
  try {
    // Procesar solo los productos (sin todo el contexto de factura)
    const result = await matchExtractedProducts(exampleExtractedData.products);
    
    console.log('📊 Resultados del matching:');
    console.log(`Total productos: ${result.totalProducts}`);
    console.log(`Automáticos: ${result.automaticMatches}`);
    console.log(`Confirmaciones: ${result.needsConfirmation}`);
    console.log(`Sin match: ${result.noMatches}`);
    
    // Mostrar detalles de cada producto
    result.matches.forEach((match, index) => {
      console.log(`\n🔍 Producto ${index + 1}: "${match.extractedProduct.description}"`);
      console.log(`   Confianza: ${match.confidence}%`);
      console.log(`   Requiere confirmación: ${match.needsConfirmation ? 'Sí' : 'No'}`);
      
      if (match.matchedProduct) {
        console.log(`   ✅ Vinculado a: ${match.matchedProduct.name} (${match.matchedProduct.sku})`);
      } else if (match.needsConfirmation) {
        console.log(`   ❓ Razón: ${match.reason}`);
        console.log(`   Opciones: ${match.possibleMatches.length} productos similares`);
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en matching básico:', error);
  }
}

/**
 * Ejemplo 2: Procesamiento completo de factura
 */
export async function exampleCompleteInvoiceProcessing() {
  console.log('\n🚀 Ejemplo 2: Procesamiento completo de factura');
  
  try {
    // Procesar toda la factura con matching de productos
    const processedData = await processAIExtractedInvoice(exampleExtractedData);
    
    console.log('📄 Factura procesada:');
    console.log(`Proveedor: ${processedData.supplier.name}`);
    console.log(`Número: ${processedData.invoice.number}`);
    console.log(`Total: $${processedData.invoice.total.toLocaleString()}`);
    
    console.log('\n📊 Resumen de productos:');
    console.log(`Total: ${processedData.summary.totalProducts}`);
    console.log(`✅ Automáticos: ${processedData.summary.automaticMatches}`);
    console.log(`❓ Confirmaciones: ${processedData.summary.needsConfirmation}`);
    console.log(`❌ Sin match: ${processedData.summary.noMatches}`);
    
    console.log(`\n🔄 Requiere confirmación: ${processedData.requiresConfirmation ? 'Sí' : 'No'}`);
    
    return processedData;
    
  } catch (error) {
    console.error('❌ Error en procesamiento completo:', error);
  }
}

/**
 * Ejemplo 3: Simulación de confirmaciones del usuario
 */
export async function exampleUserConfirmations() {
  console.log('\n🚀 Ejemplo 3: Simulación de confirmaciones del usuario');
  
  try {
    // Procesar factura
    const processedData = await processAIExtractedInvoice(exampleExtractedData);
    
    if (!processedData.requiresConfirmation) {
      console.log('✅ No se requieren confirmaciones - todos los productos se vincularon automáticamente');
      return processedData.productMatches;
    }
    
    // Simular confirmaciones del usuario
    const confirmedMatches = processedData.productMatches.map(match => {
      if (!match.needsConfirmation) {
        return match; // Ya está confirmado automáticamente
      }
      
      console.log(`\n❓ Confirmando: "${match.extractedProduct.description}"`);
      
      if (match.possibleMatches.length > 0) {
        // Simular que el usuario selecciona la primera opción
        const selectedProduct = match.possibleMatches[0];
        console.log(`   👤 Usuario selecciona: ${selectedProduct.name} (${selectedProduct.relevanceScore}% similitud)`);
        
        return {
          ...match,
          matchedProduct: selectedProduct,
          confidence: 100,
          needsConfirmation: false,
          reason: 'manual_confirmation'
        };
      } else {
        // Simular que el usuario marca como producto nuevo
        console.log(`   👤 Usuario marca como producto nuevo`);
        
        return {
          ...match,
          matchedProduct: null,
          confidence: 100,
          needsConfirmation: false,
          reason: 'new_product'
        };
      }
    });
    
    console.log('\n✅ Todas las confirmaciones completadas');
    return confirmedMatches;
    
  } catch (error) {
    console.error('❌ Error en simulación de confirmaciones:', error);
  }
}

/**
 * Ejemplo 4: Creación de factura borrador final
 */
export async function exampleCreateDraftInvoice() {
  console.log('\n🚀 Ejemplo 4: Creación de factura borrador final');
  
  try {
    // Procesar factura y simular confirmaciones
    const processedData = await processAIExtractedInvoice(exampleExtractedData);
    const confirmedMatches = await exampleUserConfirmations();
    
    if (!confirmedMatches) {
      throw new Error('No se pudieron obtener confirmaciones');
    }
    
    // Crear factura borrador con productos confirmados
    const draftInvoice = await createDraftInvoiceFromAI(processedData, confirmedMatches);
    
    console.log('\n📝 Factura borrador creada:');
    console.log(`Proveedor ID: ${draftInvoice.supplierId}`);
    console.log(`Número: ${draftInvoice.supplierInvoiceNumber}`);
    console.log(`Total líneas: ${draftInvoice.lines.length}`);
    
    console.log('\n📦 Líneas de productos:');
    draftInvoice.lines.forEach((line, index) => {
      console.log(`${index + 1}. ${line.description}`);
      console.log(`   Cantidad: ${line.quantity} x $${line.unitPrice.toLocaleString()}`);
      
      if (line.productId) {
        console.log(`   ✅ Vinculado: Producto ID ${line.productId} (${line.productCode})`);
      } else {
        console.log(`   📝 Texto libre: No vinculado a producto existente`);
      }
      
      console.log(`   Total: $${line.lineTotal.toLocaleString()}\n`);
    });
    
    return draftInvoice;
    
  } catch (error) {
    console.error('❌ Error creando factura borrador:', error);
  }
}

/**
 * Ejecutar todos los ejemplos
 */
export async function runAllExamples() {
  console.log('🤖 === DEMO: Sistema de Matching Inteligente de Productos ===\n');
  
  await exampleBasicMatching();
  await exampleCompleteInvoiceProcessing();
  await exampleUserConfirmations();
  await exampleCreateDraftInvoice();
  
  console.log('\n🎉 === Demo completado ===');
}

// Casos de prueba específicos para diferentes escenarios
export const testCases = {
  // Caso 1: Productos con matching perfecto
  perfectMatch: [
    {
      description: "40253",
      quantity: 1,
      unitPrice: 17488,
      subtotal: 17488
    }
  ],
  
  // Caso 2: Productos con múltiples coincidencias
  multipleMatches: [
    {
      description: "COCA COLA",
      quantity: 1,
      unitPrice: 3300,
      subtotal: 3300
    }
  ],
  
  // Caso 3: Productos nuevos
  newProducts: [
    {
      description: "Servicio especial de consultoría",
      quantity: 1,
      unitPrice: 50000,
      subtotal: 50000
    }
  ],
  
  // Caso 4: Mix de diferentes tipos
  mixedScenario: [
    {
      description: "40253", // Perfecto
      quantity: 2,
      unitPrice: 17488,
      subtotal: 34976
    },
    {
      description: "COCA COLA SIN AZUCAR", // Múltiples opciones
      quantity: 4,
      unitPrice: 3300,
      subtotal: 13200
    },
    {
      description: "Servicio de instalación", // Nuevo
      quantity: 1,
      unitPrice: 25000,
      subtotal: 25000
    }
  ]
};

/**
 * Función helper para testing
 */
export async function testSpecificScenario(scenarioName: keyof typeof testCases) {
  console.log(`\n🧪 Testing escenario: ${scenarioName}`);
  
  const products = testCases[scenarioName];
  const result = await matchExtractedProducts(products);
  
  console.log(`Resultados: ${result.automaticMatches} automáticos, ${result.needsConfirmation} confirmaciones, ${result.noMatches} sin match`);
  
  return result;
} 