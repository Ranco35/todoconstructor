// Script de prueba para importación de productos con logs
const fs = require('fs');
const path = require('path');
// Usar rutas absolutas para importar módulos
const importParsersPath = path.resolve(__dirname, '../src/lib/import-parsers.js');
const importProductsPath = path.resolve(__dirname, '../src/actions/products/import.js');
const { parseExcel } = require(importParsersPath);
const { importProducts } = require(importProductsPath);

async function main() {
  // Ruta al archivo Excel de prueba (ajusta si es necesario)
  const excelPath = path.resolve(__dirname, '../nuevos-clientes-limpios.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('No se encontró el archivo Excel:', excelPath);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(excelPath);
  // Parsear productos
  const products = parseExcel(fileBuffer);
  console.log('🔍 Productos parseados:', products.length);
  // Importar productos con confirmación de eliminaciones
  const result = await importProducts(products, true);
  console.log('🔍 Resultado de importación:', JSON.stringify(result, null, 2));
  if (result.details && result.details.length > 0) {
    console.log('🔍 Detalles:');
    for (const d of result.details) {
      console.log('-', d.error || '', d);
    }
  }
}

main().catch(err => {
  console.error('Error en test-product-import:', err);
}); 