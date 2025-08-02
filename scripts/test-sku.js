// Script de prueba para la generación de SKU inteligente
import { testSKUGeneration } from '../src/lib/sku-generator.js';

console.log('🧪 Iniciando pruebas de generación de SKU...\n');

try {
  testSKUGeneration();
  console.log('✅ Pruebas de generación de SKU completadas exitosamente!');
} catch (error) {
  console.error('❌ Error en las pruebas:', error);
} 