#!/usr/bin/env node

/**
 * Script de conveniencia para limpiar precios con decimales en POS
 * 
 * Uso:
 *   node scripts/fix-pos-decimal-prices.js
 * 
 * Este script ejecuta el endpoint /api/pos/clean-prices para eliminar
 * decimales residuales de productos POS existentes.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENDPOINTS = {
  development: 'http://localhost:3000/api/pos/clean-prices',
  production: 'https://admintermas.vercel.app/api/pos/clean-prices'
};

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function cleanPOSPrices(endpoint) {
  try {
    console.log(`🔄 Ejecutando limpieza en: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Limpieza completada exitosamente!');
      console.log(`📊 Resultados:`);
      if (result.data) {
        console.log(`   - Total productos: ${result.data.totalProducts || 'N/A'}`);
        console.log(`   - Productos con decimales: ${result.data.productsWithDecimals || 0}`);
        console.log(`   - Productos actualizados: ${result.data.updatedProducts || 0}`);
      }
      console.log(`💬 Mensaje: ${result.message}`);
    } else {
      console.error('❌ Error en la limpieza:');
      console.error(`   ${result.error || 'Error desconocido'}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error ejecutando limpieza:');
    console.error(`   ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧹 Script de Limpieza de Precios POS');
  console.log('=====================================\n');
  
  console.log('Este script elimina decimales residuales de productos POS.');
  console.log('Es seguro ejecutarlo múltiples veces.\n');
  
  // Seleccionar entorno
  const env = await promptUser('¿En qué entorno ejecutar? (d=desarrollo, p=producción): ');
  
  let endpoint;
  if (env === 'd' || env === 'dev' || env === 'desarrollo') {
    endpoint = ENDPOINTS.development;
    console.log('🔧 Modo: DESARROLLO');
  } else if (env === 'p' || env === 'prod' || env === 'producción') {
    endpoint = ENDPOINTS.production;
    console.log('🚀 Modo: PRODUCCIÓN');
  } else {
    console.log('❌ Opción no válida. Saliendo...');
    rl.close();
    return;
  }
  
  // Confirmación
  const confirm = await promptUser(`\n¿Confirmas ejecutar limpieza en ${endpoint}? (s/n): `);
  
  if (confirm !== 's' && confirm !== 'sí' && confirm !== 'si' && confirm !== 'y' && confirm !== 'yes') {
    console.log('⏹️ Operación cancelada.');
    rl.close();
    return;
  }
  
  // Ejecutar limpieza
  console.log('');
  const success = await cleanPOSPrices(endpoint);
  
  if (success) {
    console.log('\n🎉 ¡Limpieza completada! Ahora puedes:');
    console.log('   1. Probar el POS con múltiples cantidades');
    console.log('   2. Verificar que no hay diferencias de centavos');
    console.log('   3. Confirmar que 2 piscinas = $38.000 exactos');
  } else {
    console.log('\n❌ La limpieza falló. Revisa:');
    console.log('   1. Que el servidor esté ejecutándose');
    console.log('   2. Que el endpoint sea correcto');
    console.log('   3. Los logs del servidor para más detalles');
  }
  
  rl.close();
}

// Verificar disponibilidad de fetch
if (typeof fetch === 'undefined') {
  console.error('❌ Este script requiere Node.js 18+ con fetch nativo.');
  console.error('   O instala node-fetch: npm install node-fetch');
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Error inesperado:');
  console.error(error);
  rl.close();
  process.exit(1);
}); 