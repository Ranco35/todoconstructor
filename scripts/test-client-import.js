const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Datos de prueba para importar
const testData = [
  {
    'ID': '',
    'Tipo Cliente': 'PERSONA',
    'Nombre Principal': 'Maria',
    'Apellido': 'González',
    'RUT': '18.123.456-7',
    'Email': 'maria.gonzalez@test.com',
    'Teléfono': '+56 9 8765 4321',
    'Teléfono Móvil': '+56 9 1234 5678',
    'Dirección': 'Avenida Test 123',
    'Ciudad': 'Santiago',
    'Región': 'Región Metropolitana',
    'País': 'Chile',
    'Razón Social': '',
    'Giro': '',
    'Número Empleados': '',
    'Facturación Anual': '',
    'Sector Económico': '',
    'Fecha Nacimiento': '1990-05-15',
    'Género': 'Femenino',
    'Profesión': 'Ingeniera',
    'Título': 'Ingeniera Civil'
  },
  {
    'ID': '',
    'Tipo Cliente': 'EMPRESA',
    'Nombre Principal': 'Tech Solutions',
    'Apellido': '',
    'RUT': '76.987.654-3',
    'Email': 'contacto@techsolutions.cl',
    'Teléfono': '+56 2 2345 6789',
    'Teléfono Móvil': '',
    'Dirección': 'Calle Empresarial 456',
    'Ciudad': 'Valparaíso',
    'Región': 'Región de Valparaíso',
    'País': 'Chile',
    'Razón Social': 'Tech Solutions SpA',
    'Giro': 'Desarrollo de software',
    'Número Empleados': '25',
    'Facturación Anual': '500000',
    'Sector Económico': 'Tecnología',
    'Fecha Nacimiento': '',
    'Género': '',
    'Profesión': '',
    'Título': ''
  }
];

// Crear workbook
const workbook = XLSX.utils.book_new();

// Crear hoja de datos
const worksheet = XLSX.utils.json_to_sheet(testData);

// Agregar hoja al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes Test');

// Generar archivo
const outputPath = path.join(__dirname, '..', 'test-clientes-importar.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Archivo de prueba creado:', outputPath);
console.log('📋 Contiene 2 clientes de prueba:');
console.log('  - María González (PERSONA)');
console.log('  - Tech Solutions (EMPRESA)');
console.log('🔧 Usar este archivo para probar la importación'); 