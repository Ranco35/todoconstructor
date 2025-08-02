'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
  validateSupplierName, 
  validateVAT, 
  validateEmail, 
  validatePhone, 
  validateCreditLimit,
  generateInternalRef,
  calculateRank
} from '@/lib/supplier-utils';
import { assignTagsToSupplier } from './tags';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function createSupplier(formData: FormData) {
  const supabase = await getSupabaseClient();
  
  try {
    // Extraer datos del formulario
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const companyType = formData.get('companyType') as 'INDIVIDUAL' | 'EMPRESA';
    const internalRef = formData.get('internalRef') as string;
    const website = formData.get('website') as string;
    const active = formData.get('active') === 'true';
    
    // Identificación fiscal
    const vat = formData.get('vat') as string;
    const taxId = formData.get('taxId') as string;
    
    // Dirección
    const street = formData.get('street') as string;
    const street2 = formData.get('street2') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const countryCode = formData.get('countryCode') as string;
    
    // Contacto
    const phone = formData.get('phone') as string;
    const mobile = formData.get('mobile') as string;
    const fax = formData.get('fax') as string;
    const email = formData.get('email') as string;
    
    // Configuración comercial
    const currency = formData.get('currency') as string;
    const paymentTerm = formData.get('paymentTerm') as any;
    const customPaymentDays = formData.get('customPaymentDays') as string;
    const creditLimit = formData.get('creditLimit') as string;
    
    // Clasificación
    const supplierRank = formData.get('supplierRank') as any;
    const rankPoints = formData.get('rankPoints') as string;
    const category = formData.get('category') as string;
    
    // Responsables
    const accountManager = formData.get('accountManager') as string;
    const purchasingAgent = formData.get('purchasingAgent') as string;
    
    // Multimedia y notas
    const logo = formData.get('logo') as string;
    const image = formData.get('image') as string;
    const notes = formData.get('notes') as string;
    const publicNotes = formData.get('publicNotes') as string;
    
    // Configuración regional
    const language = formData.get('language') as string;
    const timezone = formData.get('timezone') as string;

    // Etiquetas
    const etiquetas = formData.get('etiquetas') as string;
    const tagIds: number[] = etiquetas ? JSON.parse(etiquetas) : [];

    // Validaciones
    const nameValidation = validateSupplierName(name);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    const vatValidation = validateVAT(vat, countryCode);
    if (!vatValidation.isValid) {
      throw new Error(vatValidation.error);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Validar teléfono principal (opcional)
    if (phone && phone.trim() !== '') {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        throw new Error(`Teléfono principal: ${phoneValidation.error}`);
      }
    }

    // Validar teléfono móvil (opcional)
    if (mobile && mobile.trim() !== '') {
      const mobileValidation = validatePhone(mobile);
      if (!mobileValidation.isValid) {
        throw new Error(`Teléfono móvil: ${mobileValidation.error}`);
      }
    }

    const creditLimitValidation = validateCreditLimit(
      creditLimit && creditLimit.trim() !== '' ? parseFloat(creditLimit) : undefined
    );
    if (!creditLimitValidation.isValid) {
      throw new Error(creditLimitValidation.error);
    }

    // Verificar unicidad del VAT si se proporciona
    if (vat && vat.trim() !== '') {
      const { data: existingSupplier } = await supabase
        .from('Supplier')
        .select('id')
        .eq('vat', vat.trim())
        .single();
      
      if (existingSupplier) {
        throw new Error('Ya existe un proveedor con este RUT/VAT');
      }
    }

    // Generar referencia interna si no se proporciona
    let finalInternalRef = internalRef;
    if (!finalInternalRef || finalInternalRef.trim() === '') {
      const { data: existingRefs } = await supabase
        .from('Supplier')
        .select('internalRef')
        .not('internalRef', 'is', null);
      
      const refs = existingRefs?.map(s => s.internalRef).filter(Boolean) as string[] || [];
      finalInternalRef = generateInternalRef(name, refs);
    } else {
      // Verificar unicidad de la referencia interna
      const { data: existingSupplier } = await supabase
        .from('Supplier')
        .select('id')
        .eq('internalRef', finalInternalRef.trim())
        .single();
      
      if (existingSupplier) {
        throw new Error('Ya existe un proveedor con esta referencia interna');
      }
    }

    // Calcular ranking automático si no se proporciona
    const finalRankPoints = rankPoints ? parseInt(rankPoints) : 0;
    const finalSupplierRank = supplierRank || calculateRank(finalRankPoints);

    // Crear el proveedor
    const { data: newSupplier, error: createError } = await supabase
      .from('Supplier')
      .insert({
        name: name.trim(),
        displayName: displayName?.trim() || null,
        companyType: companyType || 'EMPRESA',
        internalRef: finalInternalRef.trim(),
        website: website?.trim() || null,
        active,
        vat: vat?.trim() || null,
        taxId: taxId?.trim() || null,
        street: street?.trim() || null,
        street2: street2?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        countryCode: countryCode || 'CL',
        phone: phone?.trim() || null,
        mobile: mobile?.trim() || null,
        fax: fax?.trim() || null,
        email: email?.trim() || null,
        currency: currency || 'CLP',
        paymentTerm: paymentTerm || 'NET_30',
        customPaymentDays: customPaymentDays ? parseInt(customPaymentDays) : null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        supplierRank: finalSupplierRank,
        rankPoints: finalRankPoints,
        category: category?.trim() || null,
        accountManager: accountManager?.trim() || null,
        purchasingAgent: purchasingAgent?.trim() || null,
        logo: logo?.trim() || null,
        image: image?.trim() || null,
        notes: notes?.trim() || null,
        publicNotes: publicNotes?.trim() || null,
        language: language || 'es',
        timezone: timezone || 'America/Santiago',
        // TODO: Agregar createdBy cuando se implemente autenticación
        // createdBy: userId,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creando proveedor: ${createError.message}`);
    }

    // Asignar etiquetas si se proporcionaron
    if (tagIds.length > 0 && newSupplier) {
      await assignTagsToSupplier(newSupplier.id, tagIds);
    }

    revalidatePath('/dashboard/suppliers');
    redirect('/dashboard/suppliers');
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
} 