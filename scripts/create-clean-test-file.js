const XLSX = require('xlsx');
const path = require('path');

// Datos de prueba limpios - SIN IDs para crear nuevos clientes
const testData = [
  {
    'ID': '', // Vacío para crear nuevo cliente
    'Tipo Cliente': 'PERSONA',
    'Nombre Principal': 'Ana',
    'Apellido': 'Martínez',
    'RUT': '19.234.567-8',
    'Email': 'ana.martinez@nuevocliente.com',
    'Teléfono': '+56 9 8765 4321', // String limpio
    'Teléfono Móvil': '+56 9 1234 5678',
    'Dirección': 'Nueva Dirección 123',
    'Ciudad': 'Santiago',
    'Región': 'Región Metropolitana',
    'País': 'Chile',
    'Razón Social': '',
    'Giro': '',
    'Número Empleados': '',
    'Facturación Anual': '',
    'Sector Económico': '',
    'Fecha Nacimiento': '1992-08-20',
    'Género': 'Femenino',
    'Profesión': 'Doctora',
    'Título': 'Médico Cirujano'
  },
  {
    'ID': '', // Vacío para crear nuevo cliente
    'Tipo Cliente': 'EMPRESA',
    'Nombre Principal': 'Innovación Digital',
    'Apellido': '',
    'RUT': '77.888.999-0',
    'Email': 'info@innovaciondigital.cl',
    'Teléfono': '+56 2 2987 6543', // String limpio
    'Teléfono Móvil': '',
    'Dirección': 'Av. Tecnológica 789',
    'Ciudad': 'Concepción',
    'Región': 'Región del Biobío',
    'País': 'Chile',
    'Razón Social': 'Innovación Digital Ltda.',
    'Giro': 'Desarrollo de aplicaciones',
    'Número Empleados': '15',
    'Facturación Anual': '300000',
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

// Aplicar anchos de columna
const columnWidths = [
  { wch: 8 },   // ID
  { wch: 12 },  // Tipo Cliente
  { wch: 20 },  // Nombre Principal
  { wch: 15 },  // Apellido
  { wch: 15 },  // RUT
  { wch: 25 },  // Email
  { wch: 15 },  // Teléfono
  { wch: 15 },  // Teléfono Móvil
  { wch: 30 },  // Dirección
  { wch: 15 },  // Ciudad
  { wch: 20 },  // Región
  { wch: 12 },  // País
  { wch: 30 },  // Razón Social
  { wch: 20 },  // Giro
  { wch: 12 },  // Núm. Empleados
  { wch: 15 },  // Facturación
  { wch: 20 },  // Sector Económico
  { wch: 12 },  // Fecha Nacimiento
  { wch: 10 },  // Género
  { wch: 20 },  // Profesión
  { wch: 15 }   // Título
];

worksheet['!cols'] = columnWidths;

// Agregar hoja al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Nuevos Clientes');

// Generar archivo
const outputPath = path.join(__dirname, '..', 'nuevos-clientes-limpios.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Archivo limpio creado:', outputPath);
console.log('📋 Contiene 2 NUEVOS clientes (IDs vacíos):');
console.log('  - Ana Martínez (PERSONA)');
console.log('  - Innovación Digital (EMPRESA)');
console.log('🔧 Usar este archivo para crear clientes nuevos');
console.log('📞 Teléfonos como strings limpios'); 