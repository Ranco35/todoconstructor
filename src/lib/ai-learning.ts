'use server';

import { createClient } from './supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

interface SupplierCorrection {
  id?: number;
  original_text: string;
  supplier_id: number;
  supplier_name: string;
  supplier_tax_id?: string;
  processed: boolean;
  created_at?: string;
  processed_at?: string | null;
}

/**
 * Guarda una corrección de proveedor para entrenamiento de la IA
 * @param originalText Texto original extraído de la factura
 * @param correctedSupplier Proveedor corregido seleccionado por el usuario
 */
export async function saveSupplierCorrection(
  originalText: string, 
  correctedSupplier: { id: number; name: string; taxId?: string }
) {
  const supabase = createClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const { data, error } = await supabase
      .from('supplier_corrections')
      .insert([
        {
          original_text: originalText,
          supplier_id: correctedSupplier.id,
          supplier_name: correctedSupplier.name,
          supplier_tax_id: correctedSupplier.taxId,
          processed: false,
          created_by: user.id
        }
      ])
      .select();

    if (error) throw error;
    
    console.log('✅ Corrección de proveedor guardada:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al guardar la corrección:', error);
    return { success: false, error: 'No se pudo guardar la corrección' };
  }
}

/**
 * Procesa las correcciones pendientes para entrenar el modelo de IA
 */
export async function processPendingCorrections() {
  const supabase = createClient();
  
  try {
    // Obtener correcciones no procesadas
    const { data: pendingCorrections, error: fetchError } = await supabase
      .from('supplier_corrections')
      .select('*')
      .eq('processed', false)
      .limit(50); // Procesar en lotes

    if (fetchError) throw fetchError;
    if (!pendingCorrections?.length) {
      console.log('No hay correcciones pendientes para procesar');
      return { success: true, processed: 0 };
    }

    console.log(`Procesando ${pendingCorrections.length} correcciones...`);
    
    // Aquí iría la lógica para entrenar el modelo de IA con las correcciones
    // Por ahora, solo las marcamos como procesadas
    const correctionIds = pendingCorrections.map(c => c.id);
    
    const { error: updateError } = await supabase
      .from('supplier_corrections')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .in('id', correctionIds);

    if (updateError) throw updateError;
    
    console.log(`✅ ${correctionIds.length} correcciones procesadas`);
    return { success: true, processed: correctionIds.length };
    
  } catch (error) {
    console.error('Error procesando correcciones:', error);
    return { success: false, error: 'Error procesando correcciones' };
  }
}

/**
 * Obtiene sugerencias de proveedores basadas en el historial de correcciones
 * @param text Texto a buscar (ej: nombre o RUT de proveedor)
 */
export async function getSupplierSuggestions(text: string) {
  if (!text.trim()) return [];
  
  const supabase = createClient();
  
  try {
    // Buscar en correcciones anteriores que coincidan con el texto
    const { data: corrections, error } = await supabase
      .from('supplier_corrections')
      .select('supplier_id, supplier_name, supplier_tax_id, COUNT(*)')
      .or(`supplier_name.ilike.%${text}%,supplier_tax_id.ilike.%${text}%,original_text.ilike.%${text}%`)
      .limit(5);

    if (error) throw error;
    
    // Ordenar por frecuencia de correcciones
    const suggestions = corrections.map(c => ({
      id: c.supplier_id,
      name: c.supplier_name,
      taxId: c.supplier_tax_id,
      confidence: 0.9 // Alta confianza por ser una corrección previa
    }));
    
    return suggestions;
    
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    return [];
  }
}

/**
 * Busca un proveedor en la base de datos considerando correcciones previas
 * @param name Nombre del proveedor
 * @param taxId RUT del proveedor (opcional)
 */
export async function findSupplierWithCorrections(name: string, taxId?: string) {
  const supabase = createClient();
  
  try {
    // Primero buscar por RUT exacto si está disponible
    if (taxId) {
      const { data: byTaxId, error: taxIdError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('tax_id', taxId)
        .maybeSingle();
      
      if (taxIdError) throw taxIdError;
      if (byTaxId) return byTaxId;
    }
    
    // Si no se encontró por RUT, buscar por nombre con coincidencia parcial
    if (name) {
      const { data: byName, error: nameError } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', `%${name}%`)
        .limit(5);
      
      if (nameError) throw nameError;
      
      // Si hay múltiples coincidencias, buscar en las correcciones
      if (byName?.length > 0) {
        // Buscar si alguna de estas coincidencias tiene correcciones previas
        const supplierIds = byName.map(s => s.id);
        
        const { data: corrections, error: correctionsError } = await supabase
          .from('supplier_corrections')
          .select('supplier_id, COUNT(*)')
          .in('supplier_id', supplierIds)
          .order('count', { ascending: false })
          .limit(1);
        
        if (!correctionsError && corrections?.length > 0) {
          // Devolver el proveedor más corregido
          const mostCorrectedId = corrections[0].supplier_id;
          return byName.find(s => s.id === mostCorrectedId) || byName[0];
        }
        
        return byName[0]; // Devolver la primera coincidencia si no hay correcciones
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error buscando proveedor con correcciones:', error);
    return null;
  }
}
