'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { CompanyType, PaymentTerm, SupplierRank } from '@/constants/supplier';
import { revalidatePath } from 'next/cache';

// Interfaces para la importación
export interface SupplierImportData {
  // Información básica
  name: string;
  displayName?: string;
  companyType?: string;
  internalRef?: string;
  website?: string;
  active?: string;
  
  // Identificación fiscal
  vat?: string;
  taxId?: string;
  
  // Dirección
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  countryCode?: string;
  
  // Contacto
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  
  // Configuración comercial
  currency?: string;
  paymentTerm?: string;
  customPaymentDays?: string;
  creditLimit?: string;
  
  // Clasificación
  supplierRank?: string;
  rankPoints?: string;
  category?: string;
  
  // Responsables
  accountManager?: string;
  purchasingAgent?: string;
  
  // Notas
  notes?: string;
  publicNotes?: string;
  
  // Configuración regional
  language?: string;
  timezone?: string;
}

export interface SupplierImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  summary: string;
}

// Función para normalizar y validar datos del proveedor
function normalizeSupplierData(supplierData: SupplierImportData, rowNumber: number): {
  data: any;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validaciones obligatorias
  if (!supplierData.name?.trim()) {
    errors.push(`Fila ${rowNumber}: El nombre del proveedor es obligatorio`);
  }

  // Normalizar companyType
  let companyType = CompanyType.INDIVIDUAL; // Por defecto
  if (supplierData.companyType) {
    const normalizedType = supplierData.companyType.trim().toLowerCase();
    if (normalizedType.includes('empresa') || normalizedType.includes('sociedad')) {
      companyType = CompanyType.EMPRESA;
    }
  }

  // Normalizar paymentTerm
  let paymentTerm = PaymentTerm.NET_30; // Por defecto
  if (supplierData.paymentTerm) {
    const normalizedTerm = supplierData.paymentTerm.trim().toLowerCase();
    if (normalizedTerm.includes('inmediato') || normalizedTerm === 'immediate') {
      paymentTerm = PaymentTerm.IMMEDIATE;
    } else if (normalizedTerm.includes('15') || normalizedTerm === 'net_15') {
      paymentTerm = PaymentTerm.NET_15;
    } else if (normalizedTerm.includes('60') || normalizedTerm === 'net_60') {
      paymentTerm = PaymentTerm.NET_60;
    } else if (normalizedTerm.includes('90') || normalizedTerm === 'net_90') {
      paymentTerm = PaymentTerm.NET_90;
    } else if (normalizedTerm.includes('custom') || normalizedTerm.includes('personalizado')) {
      paymentTerm = PaymentTerm.CUSTOM;
    }
  }

  // Normalizar supplierRank
  let supplierRank = SupplierRank.BRONZE; // Por defecto
  if (supplierData.supplierRank) {
    const normalizedRank = supplierData.supplierRank.trim().toLowerCase();
    if (normalizedRank.includes('silver') || normalizedRank.includes('plata')) {
      supplierRank = SupplierRank.SILVER;
    } else if (normalizedRank.includes('gold') || normalizedRank.includes('oro')) {
      supplierRank = SupplierRank.GOLD;
    } else if (normalizedRank.includes('platinum') || normalizedRank.includes('platino')) {
      supplierRank = SupplierRank.PLATINUM;
    } else if (normalizedRank.includes('part_time') || normalizedRank.includes('medio_tiempo')) {
      supplierRank = SupplierRank.PART_TIME;
    } else if (normalizedRank.includes('regular')) {
      supplierRank = SupplierRank.REGULAR;
    } else if (normalizedRank.includes('premium')) {
      supplierRank = SupplierRank.PREMIUM;
    }
  }

  // Validar email si se proporciona
  if (supplierData.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supplierData.email.trim())) {
      errors.push(`Fila ${rowNumber}: Email inválido`);
    }
  }

  // Normalizar campos numéricos
  const customPaymentDays = supplierData.customPaymentDays ? parseInt(supplierData.customPaymentDays) : null;
  const creditLimit = supplierData.creditLimit ? parseFloat(supplierData.creditLimit) : null;
  const rankPoints = supplierData.rankPoints ? parseInt(supplierData.rankPoints) : 0;

  // Normalizar activo
  const active = !supplierData.active || 
                 supplierData.active.toLowerCase() === 'true' || 
                 supplierData.active.toLowerCase() === 'sí' || 
                 supplierData.active.toLowerCase() === 'si' ||
                 supplierData.active.toLowerCase() === 'activo' ||
                 supplierData.active === '1';

  const dbData = {
    name: supplierData.name.trim(),
    displayName: supplierData.displayName?.trim() || null,
    companyType,
    internalRef: supplierData.internalRef?.trim() || null,
    website: supplierData.website?.trim() || null,
    active,
    vat: (supplierData.vat?.trim() && supplierData.vat.trim() !== '') ? supplierData.vat.trim() : null,
    taxId: (supplierData.taxId?.trim() && supplierData.taxId.trim() !== '') ? supplierData.taxId.trim() : null,
    street: supplierData.street?.trim() || null,
    street2: supplierData.street2?.trim() || null,
    city: supplierData.city?.trim() || null,
    state: supplierData.state?.trim() || null,
    zipCode: supplierData.zipCode?.trim() || null,
    countryCode: supplierData.countryCode?.trim() || 'CL',
    phone: supplierData.phone?.trim() || null,
    mobile: supplierData.mobile?.trim() || null,
    fax: supplierData.fax?.trim() || null,
    email: (supplierData.email?.trim() && supplierData.email.trim() !== '') ? supplierData.email.trim().toLowerCase() : null,
    currency: supplierData.currency?.trim() || 'CLP',
    paymentTerm,
    customPaymentDays,
    creditLimit,
    supplierRank,
    rankPoints,
    category: supplierData.category?.trim() || null,
    accountManager: supplierData.accountManager?.trim() || null,
    purchasingAgent: supplierData.purchasingAgent?.trim() || null,
    notes: supplierData.notes?.trim() || null,
    publicNotes: supplierData.publicNotes?.trim() || null,
    language: supplierData.language?.trim() || 'es',
    timezone: supplierData.timezone?.trim() || 'America/Santiago',
  };

  return { data: dbData, errors };
}

// Función principal de importación
export async function importSuppliers(suppliersData: SupplierImportData[]): Promise<SupplierImportResult> {
  console.log('=== INICIO importSuppliers ===');
  console.log('Total de proveedores a procesar:', suppliersData.length);

  const supabase = await getSupabaseServerClient();
  const result: SupplierImportResult = {
    success: false,
    created: 0,
    updated: 0,
    errors: [],
    summary: ''
  };

  try {
    for (let i = 0; i < suppliersData.length; i++) {
      const supplierData = suppliersData[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      console.log(`Procesando fila ${rowNumber}:`, supplierData.name);

      // Normalizar y validar datos
      const { data: dbData, errors: validationErrors } = normalizeSupplierData(supplierData, rowNumber);
      
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        continue;
      }

      // Verificar duplicados por email
      let isDuplicate = false;
      
      if (dbData.email) {
        const { data: emailCheck } = await supabase
          .from('Supplier')
          .select('id')
          .eq('email', dbData.email)
          .single();
        
        if (emailCheck) {
          result.errors.push(`Fila ${rowNumber}: Ya existe un proveedor con el email ${dbData.email}`);
          isDuplicate = true;
        }
      }

      // Verificar duplicados por VAT/RUT
      if (!isDuplicate && dbData.vat) {
        const { data: vatCheck } = await supabase
          .from('Supplier')
          .select('id')
          .eq('vat', dbData.vat)
          .single();
        
        if (vatCheck) {
          result.errors.push(`Fila ${rowNumber}: Ya existe un proveedor con el VAT/RUT ${dbData.vat}`);
          isDuplicate = true;
        }
      }

      // Verificar duplicados por nombre
      if (!isDuplicate) {
        const { data: nameCheck } = await supabase
          .from('Supplier')
          .select('id')
          .eq('name', dbData.name)
          .single();
        
        if (nameCheck) {
          result.errors.push(`Fila ${rowNumber}: Ya existe un proveedor con el nombre ${dbData.name}`);
          isDuplicate = true;
        }
      }

      if (!isDuplicate) {
        // Crear nuevo proveedor
        const { data: supplier, error: supplierError } = await supabase
          .from('Supplier')
          .insert([dbData])
          .select()
          .single();

        if (supplierError) {
          console.error('Error creando proveedor:', supplierError);
          result.errors.push(`Fila ${rowNumber}: Error creando proveedor - ${supplierError.message}`);
        } else {
          console.log(`Proveedor creado exitosamente: ID ${supplier.id}`);
          result.created++;
        }
      }
    }

    // Generar resumen
    const totalProcessed = result.created + result.updated;
    const totalErrors = result.errors.length;
    
    result.success = totalErrors === 0 || totalProcessed > 0;
    result.summary = `Procesados: ${totalProcessed} | Creados: ${result.created} | Actualizados: ${result.updated} | Errores: ${totalErrors}`;

    console.log('=== RESUMEN IMPORTACIÓN ===');
    console.log(result.summary);
    console.log('Errores:', result.errors);

    // Revalidar las páginas relacionadas
    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/configuration/admin-suppliers');

    return result;

  } catch (error) {
    console.error('Error en importSuppliers:', error);
    result.success = false;
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    result.summary = 'Error crítico durante la importación';
    return result;
  }
}

// Función para obtener plantilla de ejemplo
export async function getSupplierImportTemplate(): Promise<SupplierImportData[]> {
  return [
    {
      name: 'Proveedor Ejemplo S.A.',
      displayName: 'Proveedor Demo',
      companyType: 'EMPRESA',
      internalRef: 'PROV001',
      website: 'https://www.ejemplo.com',
      active: 'true',
      vat: '12345678-9',
      taxId: '12345678-9',
      street: 'Avenida Principal 123',
      street2: 'Oficina 456',
      city: 'Santiago',
      state: 'Región Metropolitana',
      zipCode: '8320000',
      countryCode: 'CL',
      phone: '+56 2 1234 5678',
      mobile: '+56 9 8765 4321',
      fax: '+56 2 1234 5679',
      email: 'contacto@ejemplo.com',
      currency: 'CLP',
      paymentTerm: 'NET_30',
      customPaymentDays: '',
      creditLimit: '1000000',
      supplierRank: 'SILVER',
      rankPoints: '75',
      category: 'Servicios',
      accountManager: 'Juan Pérez',
      purchasingAgent: 'María González',
      notes: 'Proveedor confiable con buenos tiempos de entrega',
      publicNotes: 'Horario de atención: Lunes a Viernes 9:00-18:00',
      language: 'es',
      timezone: 'America/Santiago'
    },
    {
      name: 'Proveedor Individual',
      displayName: 'Juan Carlos Proveedor',
      companyType: 'INDIVIDUAL',
      internalRef: 'PROV002',
      website: '',
      active: 'true',
      vat: '87654321-2',
      taxId: '87654321-2',
      street: 'Calle Secundaria 456',
      street2: '',
      city: 'Valparaíso',
      state: 'Región de Valparaíso',
      zipCode: '2340000',
      countryCode: 'CL',
      phone: '+56 32 123 4567',
      mobile: '+56 9 1234 5678',
      fax: '',
      email: 'juan@individual.com',
      currency: 'CLP',
      paymentTerm: 'IMMEDIATE',
      customPaymentDays: '',
      creditLimit: '500000',
      supplierRank: 'BRONZE',
      rankPoints: '45',
      category: 'Materiales',
      accountManager: 'Ana Martínez',
      purchasingAgent: 'Carlos Silva',
      notes: 'Proveedor especializado en materiales de construcción',
      publicNotes: 'Entrega solo en horario de mañana',
      language: 'es',
      timezone: 'America/Santiago'
    }
  ];
} 