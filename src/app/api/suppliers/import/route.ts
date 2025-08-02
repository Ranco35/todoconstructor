import { NextRequest, NextResponse } from 'next/server';
import { importSuppliers, SupplierImportData } from '@/actions/suppliers/import';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIO POST /api/suppliers/import ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    console.log('Archivo recibido:', file.name, file.size, 'bytes');

    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Se admiten archivos Excel (.xlsx, .xls) y CSV.' },
        { status: 400 }
      );
    }

    // Leer el archivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: 'El archivo debe contener al menos una fila de encabezados y una fila de datos' },
        { status: 400 }
      );
    }

    console.log('Filas leídas:', jsonData.length);

    // Obtener encabezados y mapear a nuestros campos
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    
    console.log('Encabezados encontrados:', headers);

    // Mapeo de encabezados posibles a nuestros campos
    const headerMap: { [key: string]: keyof SupplierImportData } = {
      // Información básica
      'nombre del proveedor': 'name',
      'nombre proveedor': 'name',
      'proveedor': 'name',
      'name': 'name',
      'razon social': 'name',
      'razón social': 'name',
      
      'nombre de visualización': 'displayName',
      'nombre visualización': 'displayName',
      'display name': 'displayName',
      'nombre mostrar': 'displayName',
      
      'tipo de empresa': 'companyType',
      'tipo empresa': 'companyType',
      'company type': 'companyType',
      'tipo': 'companyType',
      
      'referencia interna': 'internalRef',
      'ref interna': 'internalRef',
      'internal ref': 'internalRef',
      'codigo': 'internalRef',
      'código': 'internalRef',
      
      'sitio web': 'website',
      'website': 'website',
      'web': 'website',
      'pagina web': 'website',
      'página web': 'website',
      
      'estado': 'active',
      'activo': 'active',
      'active': 'active',
      
      // Identificación fiscal
      'vat/rut': 'vat',
      'vat': 'vat',
      'rut': 'vat',
      'tax id': 'vat',
      
      'id fiscal': 'taxId',
      'tax id': 'taxId',
      'identificacion fiscal': 'taxId',
      'identificación fiscal': 'taxId',
      
      // Dirección
      'dirección principal': 'street',
      'direccion principal': 'street',
      'dirección': 'street',
      'direccion': 'street',
      'street': 'street',
      'calle': 'street',
      
      'dirección secundaria': 'street2',
      'direccion secundaria': 'street2',
      'street2': 'street2',
      'calle 2': 'street2',
      
      'ciudad': 'city',
      'city': 'city',
      
      'estado/región': 'state',
      'estado': 'state',
      'región': 'state',
      'region': 'state',
      'state': 'state',
      
      'código postal': 'zipCode',
      'codigo postal': 'zipCode',
      'zip code': 'zipCode',
      'postal': 'zipCode',
      
      'código país': 'countryCode',
      'codigo pais': 'countryCode',
      'país': 'countryCode',
      'pais': 'countryCode',
      'country': 'countryCode',
      
      // Contacto
      'teléfono': 'phone',
      'telefono': 'phone',
      'phone': 'phone',
      'fono': 'phone',
      
      'móvil': 'mobile',
      'movil': 'mobile',
      'mobile': 'mobile',
      'celular': 'mobile',
      
      'fax': 'fax',
      
      'email': 'email',
      'correo': 'email',
      'mail': 'email',
      'e-mail': 'email',
      
      // Configuración comercial
      'moneda': 'currency',
      'currency': 'currency',
      
      'términos de pago': 'paymentTerm',
      'terminos de pago': 'paymentTerm',
      'payment terms': 'paymentTerm',
      'pago': 'paymentTerm',
      
      'días de pago personalizados': 'customPaymentDays',
      'dias pago personalizados': 'customPaymentDays',
      'custom payment days': 'customPaymentDays',
      'dias personalizados': 'customPaymentDays',
      
      'límite de crédito': 'creditLimit',
      'limite credito': 'creditLimit',
      'credit limit': 'creditLimit',
      'credito': 'creditLimit',
      
      // Clasificación
      'tipo de proveedor': 'supplierRank',
      'tipo proveedor': 'supplierRank',
      'supplier rank': 'supplierRank',
      'ranking': 'supplierRank',
      'rango': 'supplierRank',
      
      'puntos de ranking': 'rankPoints',
      'puntos ranking': 'rankPoints',
      'rank points': 'rankPoints',
      'puntos': 'rankPoints',
      
      'categoría': 'category',
      'categoria': 'category',
      'category': 'category',
      
      // Responsables
      'gerente de cuenta': 'accountManager',
      'gerente cuenta': 'accountManager',
      'account manager': 'accountManager',
      'gerente': 'accountManager',
      
      'agente de compras': 'purchasingAgent',
      'agente compras': 'purchasingAgent',
      'purchasing agent': 'purchasingAgent',
      'comprador': 'purchasingAgent',
      
      // Notas
      'notas privadas': 'notes',
      'notas': 'notes',
      'notes': 'notes',
      'comentarios': 'notes',
      
      'notas públicas': 'publicNotes',
      'notas publicas': 'publicNotes',
      'public notes': 'publicNotes',
      'observaciones': 'publicNotes',
      
      // Configuración regional
      'idioma': 'language',
      'language': 'language',
      'lang': 'language',
      
      'zona horaria': 'timezone',
      'timezone': 'timezone',
      'huso horario': 'timezone',
    };

    // Mapear encabezados a índices
    const fieldIndexes: { [key in keyof SupplierImportData]?: number } = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toString().toLowerCase().trim();
      const field = headerMap[normalizedHeader];
      if (field) {
        fieldIndexes[field] = index;
      }
    });

    console.log('Mapeo de campos encontrados:', fieldIndexes);

    // Validar que tengamos al menos el campo obligatorio
    if (fieldIndexes.name === undefined) {
      return NextResponse.json(
        { 
          error: 'No se encontró la columna obligatoria "Nombre del Proveedor". Verifique que el archivo tenga los encabezados correctos.',
          requiredFields: ['Nombre del Proveedor']
        },
        { status: 400 }
      );
    }

    // Convertir filas a objetos de datos
    const suppliersData: SupplierImportData[] = dataRows
      .filter((row: any[]) => row && row.length > 0 && row[fieldIndexes.name!]) // Filtrar filas vacías
      .map((row: any[]) => {
        const supplier: SupplierImportData = {
          name: '', // Se llenará abajo
        };

        // Mapear cada campo
        Object.entries(fieldIndexes).forEach(([field, index]) => {
          if (index !== undefined && row[index] !== undefined) {
            (supplier as any)[field] = row[index]?.toString().trim() || '';
          }
        });

        return supplier;
      });

    console.log(`Datos mapeados: ${suppliersData.length} proveedores`);

    if (suppliersData.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron datos válidos para importar' },
        { status: 400 }
      );
    }

    // Procesar importación
    const result = await importSuppliers(suppliersData);
    
    console.log('Resultado de importación:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Importación completada exitosamente`,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        summary: result.summary,
        totalProcessed: suppliersData.length
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'La importación tuvo errores',
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        summary: result.summary,
        totalProcessed: suppliersData.length
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en POST /api/suppliers/import:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor durante la importación',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 