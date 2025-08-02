// Script de prueba para importación de productos con logs (TypeScript)
import fs from 'fs';
import path from 'path';
import { parseExcel } from '../src/lib/import-parsers';
import { importProducts } from '../src/actions/products/import';

async function main() {
  // Ruta al archivo Excel de prueba (ajusta si es necesario)
  const excelPath = path.resolve(__dirname, '../nuevos-clientes-limpios.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('No se encontró el archivo Excel:', excelPath);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(excelPath);
  // Convertir Buffer de Node.js a ArrayBuffer
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  // Parsear productos
  const products = parseExcel(arrayBuffer);
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