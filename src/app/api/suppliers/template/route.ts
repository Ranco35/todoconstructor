import { NextResponse } from 'next/server';
import { getSupplierImportTemplate } from '@/actions/suppliers/import';
// Evitar importación estática de XLSX

export async function GET() {
  try {
    console.log('=== INICIO GET /api/suppliers/template ===');

    // Obtener datos de ejemplo
    const exampleData = await getSupplierImportTemplate();

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Crear hoja de plantilla con datos de ejemplo
    const templateSheet = XLSX.utils.json_to_sheet(exampleData, {
      header: [
        'name',
        'displayName',
        'companyType',
        'internalRef',
        'website',
        'active',
        'vat',
        'taxId',
        'street',
        'street2',
        'city',
        'state',
        'zipCode',
        'countryCode',
        'phone',
        'mobile',
        'fax',
        'email',
        'currency',
        'paymentTerm',
        'customPaymentDays',
        'creditLimit',
        'supplierRank',
        'rankPoints',
        'category',
        'accountManager',
        'purchasingAgent',
        'notes',
        'publicNotes',
        'language',
        'timezone'
      ]
    });

    // Personalizar encabezados a español
    const headers = {
      A1: { v: 'Nombre del Proveedor', t: 's' },
      B1: { v: 'Nombre de Visualización', t: 's' },
      C1: { v: 'Tipo de Empresa', t: 's' },
      D1: { v: 'Referencia Interna', t: 's' },
      E1: { v: 'Sitio Web', t: 's' },
      F1: { v: 'Estado', t: 's' },
      G1: { v: 'VAT/RUT', t: 's' },
      H1: { v: 'ID Fiscal', t: 's' },
      I1: { v: 'Dirección Principal', t: 's' },
      J1: { v: 'Dirección Secundaria', t: 's' },
      K1: { v: 'Ciudad', t: 's' },
      L1: { v: 'Estado/Región', t: 's' },
      M1: { v: 'Código Postal', t: 's' },
      N1: { v: 'Código País', t: 's' },
      O1: { v: 'Teléfono', t: 's' },
      P1: { v: 'Móvil', t: 's' },
      Q1: { v: 'Fax', t: 's' },
      R1: { v: 'Email', t: 's' },
      S1: { v: 'Moneda', t: 's' },
      T1: { v: 'Términos de Pago', t: 's' },
      U1: { v: 'Días de Pago Personalizados', t: 's' },
      V1: { v: 'Límite de Crédito', t: 's' },
      W1: { v: 'Tipo de Proveedor', t: 's' },
      X1: { v: 'Puntos de Ranking', t: 's' },
      Y1: { v: 'Categoría', t: 's' },
      Z1: { v: 'Gerente de Cuenta', t: 's' },
      AA1: { v: 'Agente de Compras', t: 's' },
      AB1: { v: 'Notas Privadas', t: 's' },
      AC1: { v: 'Notas Públicas', t: 's' },
      AD1: { v: 'Idioma', t: 's' },
      AE1: { v: 'Zona Horaria', t: 's' }
    };

    // Aplicar encabezados personalizados
    Object.assign(templateSheet, headers);

    // Configurar ancho de columnas
    templateSheet['!cols'] = [
      { wch: 25 },  // Nombre del Proveedor
      { wch: 20 },  // Nombre de Visualización
      { wch: 15 },  // Tipo de Empresa
      { wch: 15 },  // Referencia Interna
      { wch: 25 },  // Sitio Web
      { wch: 10 },  // Estado
      { wch: 15 },  // VAT/RUT
      { wch: 15 },  // ID Fiscal
      { wch: 30 },  // Dirección Principal
      { wch: 25 },  // Dirección Secundaria
      { wch: 15 },  // Ciudad
      { wch: 20 },  // Estado/Región
      { wch: 12 },  // Código Postal
      { wch: 10 },  // Código País
      { wch: 15 },  // Teléfono
      { wch: 15 },  // Móvil
      { wch: 15 },  // Fax
      { wch: 25 },  // Email
      { wch: 10 },  // Moneda
      { wch: 20 },  // Términos de Pago
      { wch: 15 },  // Días de Pago Personalizados
      { wch: 15 },  // Límite de Crédito
      { wch: 15 },  // Tipo de Proveedor
      { wch: 12 },  // Puntos de Ranking
      { wch: 15 },  // Categoría
      { wch: 20 },  // Gerente de Cuenta
      { wch: 20 },  // Agente de Compras
      { wch: 30 },  // Notas Privadas
      { wch: 30 },  // Notas Públicas
      { wch: 10 },  // Idioma
      { wch: 20 },  // Zona Horaria
    ];

    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla Proveedores');

    // Crear hoja de instrucciones
    const instructionsData = [
      {
        'CAMPO': 'Nombre del Proveedor',
        'DESCRIPCIÓN': 'Razón social o nombre comercial del proveedor',
        'OBLIGATORIO': 'SÍ',
        'FORMATO': 'Texto libre',
        'EJEMPLO': 'Proveedor Ejemplo S.A.'
      },
      {
        'CAMPO': 'Nombre de Visualización',
        'DESCRIPCIÓN': 'Nombre corto para mostrar en el sistema',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'Texto libre',
        'EJEMPLO': 'Proveedor Demo'
      },
      {
        'CAMPO': 'Tipo de Empresa',
        'DESCRIPCIÓN': 'Tipo de organización del proveedor',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'INDIVIDUAL o EMPRESA',
        'EJEMPLO': 'EMPRESA'
      },
      {
        'CAMPO': 'Referencia Interna',
        'DESCRIPCIÓN': 'Código interno para identificar el proveedor',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'Texto libre',
        'EJEMPLO': 'PROV001'
      },
      {
        'CAMPO': 'VAT/RUT',
        'DESCRIPCIÓN': 'Número de identificación fiscal',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'Texto con formato RUT chileno',
        'EJEMPLO': '12345678-9'
      },
      {
        'CAMPO': 'Email',
        'DESCRIPCIÓN': 'Correo electrónico principal del proveedor',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'Email válido',
        'EJEMPLO': 'contacto@proveedor.com'
      },
      {
        'CAMPO': 'Estado',
        'DESCRIPCIÓN': 'Estado del proveedor en el sistema',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'true/false, sí/no, activo/inactivo',
        'EJEMPLO': 'true'
      },
      {
        'CAMPO': 'Tipo de Proveedor',
        'DESCRIPCIÓN': 'Clasificación del proveedor',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'BRONZE, SILVER, GOLD, PLATINUM, PART_TIME, REGULAR, PREMIUM',
        'EJEMPLO': 'SILVER'
      },
      {
        'CAMPO': 'Términos de Pago',
        'DESCRIPCIÓN': 'Condiciones de pago acordadas',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'IMMEDIATE, NET_15, NET_30, NET_60, NET_90, CUSTOM',
        'EJEMPLO': 'NET_30'
      },
      {
        'CAMPO': 'Límite de Crédito',
        'DESCRIPCIÓN': 'Límite de crédito en pesos chilenos',
        'OBLIGATORIO': 'NO',
        'FORMATO': 'Número sin separadores',
        'EJEMPLO': '1000000'
      }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { wch: 25 },  // CAMPO
      { wch: 50 },  // DESCRIPCIÓN
      { wch: 15 },  // OBLIGATORIO
      { wch: 30 },  // FORMATO
      { wch: 30 },  // EJEMPLO
    ];

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

    // Crear hoja de valores válidos
    const validValuesData = [
      { 'CAMPO': 'Tipo de Empresa', 'VALORES VÁLIDOS': 'INDIVIDUAL, EMPRESA' },
      { 'CAMPO': 'Estado', 'VALORES VÁLIDOS': 'true, false, sí, no, activo, inactivo, 1, 0' },
      { 'CAMPO': 'Tipo de Proveedor', 'VALORES VÁLIDOS': 'BRONZE, SILVER, GOLD, PLATINUM, PART_TIME, REGULAR, PREMIUM' },
      { 'CAMPO': 'Términos de Pago', 'VALORES VÁLIDOS': 'IMMEDIATE, NET_15, NET_30, NET_60, NET_90, CUSTOM' },
      { 'CAMPO': 'Moneda', 'VALORES VÁLIDOS': 'CLP, USD, EUR (por defecto CLP)' },
      { 'CAMPO': 'Código País', 'VALORES VÁLIDOS': 'CL, AR, PE, BO, EC, etc. (código ISO de 2 letras)' },
      { 'CAMPO': 'Idioma', 'VALORES VÁLIDOS': 'es, en, pt (por defecto es)' },
      { 'CAMPO': 'Zona Horaria', 'VALORES VÁLIDOS': 'America/Santiago, America/New_York, etc.' }
    ];

    const validValuesSheet = XLSX.utils.json_to_sheet(validValuesData);
    validValuesSheet['!cols'] = [
      { wch: 25 },  // CAMPO
      { wch: 60 },  // VALORES VÁLIDOS
    ];

    XLSX.utils.book_append_sheet(workbook, validValuesSheet, 'Valores Válidos');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    console.log('Plantilla de proveedores generada exitosamente');

    // Retornar archivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="plantilla_proveedores.xlsx"',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error en GET /api/suppliers/template:', error);
    return NextResponse.json(
      { 
        error: 'Error al generar plantilla de proveedores',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 