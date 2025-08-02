"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Script de prueba para importación de productos con logs (TypeScript)
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const import_parsers_1 = require("../src/lib/import-parsers");
const import_1 = require("../src/actions/products/import");
async function main() {
    // Ruta al archivo Excel de prueba (ajusta si es necesario)
    const excelPath = path_1.default.resolve(__dirname, '../nuevos-clientes-limpios.xlsx');
    if (!fs_1.default.existsSync(excelPath)) {
        console.error('No se encontró el archivo Excel:', excelPath);
        process.exit(1);
    }
    const fileBuffer = fs_1.default.readFileSync(excelPath);
    // Convertir Buffer de Node.js a ArrayBuffer
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
    // Parsear productos
    const products = (0, import_parsers_1.parseExcel)(arrayBuffer);
    console.log('🔍 Productos parseados:', products.length);
    // Importar productos con confirmación de eliminaciones
    const result = await (0, import_1.importProducts)(products, true);
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
