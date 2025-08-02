'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import * as XLSX from 'xlsx';

// Interfaces para filtros de exportación
export interface SupplierExportFilters {
  search?: string;
  companyType?: string;
  active?: boolean;
  supplierRank?: string;
  category?: string;
  countryCode?: string;
  selectedIds?: number[];
}

// Interface para datos de exportación
export interface SupplierExportData {
  // Información básica
  ID: number;
  'Nombre del Proveedor': string;
  'Nombre de Visualización': string | null;
  'Tipo de Empresa': string;
  'Referencia Interna': string | null;
  'Sitio Web': string | null;
  'Estado': string;
  
  // Identificación fiscal
  'VAT/RUT': string | null;
  'ID Fiscal': string | null;
  
  // Dirección
  'Dirección Principal': string | null;
  'Dirección Secundaria': string | null;
  'Ciudad': string | null;
  'Estado/Región': string | null;
  'Código Postal': string | null;
  'Código País': string | null;
  
  // Contacto
  'Teléfono': string | null;
  'Móvil': string | null;
  'Fax': string | null;
  'Email': string | null;
  
  // Configuración comercial
  'Moneda': string | null;
  'Términos de Pago': string;
  'Días de Pago Personalizados': number | null;
  'Límite de Crédito': number | null;
  
  // Clasificación
  'Tipo de Proveedor': string;
  'Puntos de Ranking': number;
  'Categoría': string | null;
  
  // Responsables
  'Gerente de Cuenta': string | null;
  'Agente de Compras': string | null;
  
  // Notas
  'Notas Privadas': string | null;
  'Notas Públicas': string | null;
  
  // Configuración regional
  'Idioma': string | null;
  'Zona Horaria': string | null;
  
  // Metadatos
  'Fecha de Creación': string;
  'Fecha de Actualización': string;
  
  // Relaciones
  'Etiquetas': string;
  'Contactos': string;
  'Cuentas Bancarias': string;
}

// Función para obtener proveedores para exportación
export async function getSuppliersForExport(filters: SupplierExportFilters = {}): Promise<any[]> {
  console.log('=== INICIO getSuppliersForExport ===');
  console.log('Filtros aplicados:', filters);

  const supabase = await getSupabaseServerClient();

  try {
    let query = supabase
      .from('Supplier')
      .select(`
        *,
        etiquetas:SupplierTagAssignment(
          etiqueta:SupplierTag(nombre)
        )
      `);

    // Aplicar filtros
    if (filters.selectedIds && filters.selectedIds.length > 0) {
      query = query.in('id', filters.selectedIds);
    } else {
      // Solo aplicar otros filtros si no hay IDs específicos seleccionados
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `displayName.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%,` +
          `vat.ilike.%${filters.search}%,` +
          `category.ilike.%${filters.search}%`
        );
      }

      if (filters.companyType && filters.companyType !== 'todos') {
        query = query.eq('companyType', filters.companyType);
      }

      if (typeof filters.active === 'boolean') {
        query = query.eq('active', filters.active);
      }

      if (filters.supplierRank && filters.supplierRank !== 'todos') {
        query = query.eq('supplierRank', filters.supplierRank);
      }

      if (filters.category && filters.category !== 'todos') {
        query = query.eq('category', filters.category);
      }

      if (filters.countryCode && filters.countryCode !== 'todos') {
        query = query.eq('countryCode', filters.countryCode);
      }
    }

    const { data: suppliers, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error obteniendo proveedores:', error);
      throw error;
    }

    console.log(`Proveedores obtenidos: ${suppliers?.length || 0}`);
    return suppliers || [];

  } catch (error) {
    console.error('Error en getSuppliersForExport:', error);
    throw error;
  }
}

// Función para obtener contactos de proveedores
async function getSupplierContacts(supplierIds: number[]): Promise<Map<number, any[]>> {
  const supabase = await getSupabaseServerClient();
  const contactsMap = new Map<number, any[]>();

  try {
    const { data: contacts } = await supabase
      .from('SupplierContact')
      .select('*')
      .in('supplierId', supplierIds)
      .eq('active', true);

    contacts?.forEach(contact => {
      if (!contactsMap.has(contact.supplierId)) {
        contactsMap.set(contact.supplierId, []);
      }
      contactsMap.get(contact.supplierId)?.push(contact);
    });

  } catch (error) {
    console.error('Error obteniendo contactos:', error);
  }

  return contactsMap;
}

// Función para obtener cuentas bancarias de proveedores
async function getSupplierBanks(supplierIds: number[]): Promise<Map<number, any[]>> {
  const supabase = await getSupabaseServerClient();
  const banksMap = new Map<number, any[]>();

  try {
    const { data: banks } = await supabase
      .from('SupplierBank')
      .select('*')
      .in('supplierId', supplierIds)
      .eq('active', true);

    banks?.forEach(bank => {
      if (!banksMap.has(bank.supplierId)) {
        banksMap.set(bank.supplierId, []);
      }
      banksMap.get(bank.supplierId)?.push(bank);
    });

  } catch (error) {
    console.error('Error obteniendo cuentas bancarias:', error);
  }

  return banksMap;
}

// Función para convertir datos a formato de exportación
function formatSupplierForExport(
  supplier: any,
  contacts: any[] = [],
  banks: any[] = []
): SupplierExportData {
  // Formatear etiquetas
  const etiquetas = supplier.etiquetas?.map((et: any) => et.etiqueta?.nombre).filter(Boolean).join(', ') || '';
  
  // Formatear contactos
  const contactosTexto = contacts
    .map(c => `${c.name} (${c.position || 'N/A'}) - ${c.email || 'N/A'}`)
    .join('; ');
  
  // Formatear cuentas bancarias
  const bancosTexto = banks
    .map(b => `${b.bankName} - ${b.accountNumber} (${b.holderName})`)
    .join('; ');

  // Convertir enums a texto legible
  const companyTypeText = supplier.companyType === 'INDIVIDUAL' ? 'Individual' : 'Empresa';
  const supplierRankText = {
    'BRONZE': 'Bronce',
    'SILVER': 'Plata', 
    'GOLD': 'Oro',
    'PLATINUM': 'Platino',
    'PART_TIME': 'Medio Tiempo',
    'REGULAR': 'Regular',
    'PREMIUM': 'Premium'
  }[supplier.supplierRank] || supplier.supplierRank;

  const paymentTermText = {
    'IMMEDIATE': 'Inmediato',
    'NET_15': 'Neto 15 días',
    'NET_30': 'Neto 30 días', 
    'NET_60': 'Neto 60 días',
    'NET_90': 'Neto 90 días',
    'CUSTOM': 'Personalizado'
  }[supplier.paymentTerm] || supplier.paymentTerm;

  return {
    ID: supplier.id,
    'Nombre del Proveedor': supplier.name || '',
    'Nombre de Visualización': supplier.displayName,
    'Tipo de Empresa': companyTypeText,
    'Referencia Interna': supplier.internalRef,
    'Sitio Web': supplier.website,
    'Estado': supplier.active ? 'Activo' : 'Inactivo',
    'VAT/RUT': supplier.vat,
    'ID Fiscal': supplier.taxId,
    'Dirección Principal': supplier.street,
    'Dirección Secundaria': supplier.street2,
    'Ciudad': supplier.city,
    'Estado/Región': supplier.state,
    'Código Postal': supplier.zipCode,
    'Código País': supplier.countryCode,
    'Teléfono': supplier.phone,
    'Móvil': supplier.mobile,
    'Fax': supplier.fax,
    'Email': supplier.email,
    'Moneda': supplier.currency,
    'Términos de Pago': paymentTermText,
    'Días de Pago Personalizados': supplier.customPaymentDays,
    'Límite de Crédito': supplier.creditLimit,
    'Tipo de Proveedor': supplierRankText,
    'Puntos de Ranking': supplier.rankPoints || 0,
    'Categoría': supplier.category,
    'Gerente de Cuenta': supplier.accountManager,
    'Agente de Compras': supplier.purchasingAgent,
    'Notas Privadas': supplier.notes,
    'Notas Públicas': supplier.publicNotes,
    'Idioma': supplier.language,
    'Zona Horaria': supplier.timezone,
    'Fecha de Creación': supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('es-CL') : '',
    'Fecha de Actualización': supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString('es-CL') : '',
    'Etiquetas': etiquetas,
    'Contactos': contactosTexto,
    'Cuentas Bancarias': bancosTexto,
  };
}

// Función para generar Excel
export async function generateSuppliersExcel(filters: SupplierExportFilters = {}): Promise<Buffer> {
  console.log('=== INICIO generateSuppliersExcel ===');

  try {
    // Obtener datos de proveedores
    const suppliers = await getSuppliersForExport(filters);
    
    if (suppliers.length === 0) {
      throw new Error('No se encontraron proveedores para exportar');
    }

    // Obtener IDs de proveedores
    const supplierIds = suppliers.map(s => s.id);
    
    // Obtener datos relacionados en paralelo
    const [contactsMap, banksMap] = await Promise.all([
      getSupplierContacts(supplierIds),
      getSupplierBanks(supplierIds)
    ]);

    // Formatear datos para exportación
    const exportData: SupplierExportData[] = suppliers.map(supplier => {
      const contacts = contactsMap.get(supplier.id) || [];
      const banks = banksMap.get(supplier.id) || [];
      return formatSupplierForExport(supplier, contacts, banks);
    });

    console.log(`Datos formateados: ${exportData.length} proveedores`);

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de datos
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 25 },  // Nombre del Proveedor
      { wch: 20 },  // Nombre de Visualización
      { wch: 15 },  // Tipo de Empresa
      { wch: 15 },  // Referencia Interna
      { wch: 20 },  // Sitio Web
      { wch: 10 },  // Estado
      { wch: 15 },  // VAT/RUT
      { wch: 15 },  // ID Fiscal
      { wch: 25 },  // Dirección Principal
      { wch: 20 },  // Dirección Secundaria
      { wch: 15 },  // Ciudad
      { wch: 20 },  // Estado/Región
      { wch: 12 },  // Código Postal
      { wch: 10 },  // Código País
      { wch: 15 },  // Teléfono
      { wch: 15 },  // Móvil
      { wch: 15 },  // Fax
      { wch: 25 },  // Email
      { wch: 10 },  // Moneda
      { wch: 15 },  // Términos de Pago
      { wch: 12 },  // Días de Pago Personalizados
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
      { wch: 15 },  // Fecha de Creación
      { wch: 15 },  // Fecha de Actualización
      { wch: 30 },  // Etiquetas
      { wch: 40 },  // Contactos
      { wch: 40 },  // Cuentas Bancarias
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
    
    // Crear hoja de instrucciones
    const instructionsData = [
      { 'Campo': 'ID', 'Descripción': 'Identificador único del proveedor', 'Obligatorio': 'No', 'Ejemplo': '1' },
      { 'Campo': 'Nombre del Proveedor', 'Descripción': 'Razón social o nombre comercial', 'Obligatorio': 'Sí', 'Ejemplo': 'Proveedor S.A.' },
      { 'Campo': 'Tipo de Empresa', 'Descripción': 'Individual o Empresa', 'Obligatorio': 'Sí', 'Ejemplo': 'Empresa' },
      { 'Campo': 'VAT/RUT', 'Descripción': 'Número de identificación fiscal', 'Obligatorio': 'No', 'Ejemplo': '12345678-9' },
      { 'Campo': 'Email', 'Descripción': 'Correo electrónico principal', 'Obligatorio': 'No', 'Ejemplo': 'contacto@proveedor.com' },
      { 'Campo': 'Tipo de Proveedor', 'Descripción': 'Bronce, Plata, Oro, Platino, etc.', 'Obligatorio': 'No', 'Ejemplo': 'Plata' },
      { 'Campo': 'Términos de Pago', 'Descripción': 'Inmediato, Neto 30 días, etc.', 'Obligatorio': 'No', 'Ejemplo': 'Neto 30 días' },
      { 'Campo': 'Estado', 'Descripción': 'Activo o Inactivo', 'Obligatorio': 'No', 'Ejemplo': 'Activo' },
    ];
    
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { wch: 25 },  // Campo
      { wch: 50 },  // Descripción
      { wch: 15 },  // Obligatorio
      { wch: 30 },  // Ejemplo
    ];
    
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('Excel generado exitosamente');
    return buffer;

  } catch (error) {
    console.error('Error en generateSuppliersExcel:', error);
    throw error;
  }
}

// Función principal de exportación
export async function exportSuppliers(filters: SupplierExportFilters = {}): Promise<Buffer> {
  console.log('=== INICIO exportSuppliers ===');
  console.log('Filtros:', filters);

  try {
    return await generateSuppliersExcel(filters);
  } catch (error) {
    console.error('Error en exportSuppliers:', error);
    throw error;
  }
} 