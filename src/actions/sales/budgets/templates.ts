'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import type { BudgetTemplate, BudgetTemplateCreateInput } from '@/types/ventas/budget-template';

// Plantillas por defecto para ferretería/construcción
const DEFAULT_TEMPLATES = [
  // PINTURA
  {
    name: 'Kit de Pintura Interior',
    description: 'Presupuesto para pintura interior: pintura, rodillos, brochas, cinta y accesorios',
    category: 'pintura', icon: '🎨', color: 'blue', sort_order: 1,
    summary_template: 'Presupuesto Pintura Interior - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 15 días. Stock sujeto a disponibilidad.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Kit de Pintura Interior' },
      { displayType: 'product', description: 'Pintura latex interior (galón)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Rodillo antigoteo 23cm', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Brocha 2 pulgadas', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Cinta de enmascarar', quantity: 2, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Rendimiento estimado: 10-12 m2 por galón. Seleccione los productos del catálogo.' },
    ],
  },
  {
    name: 'Kit de Pintura Exterior',
    description: 'Presupuesto para pintura exterior: esmalte, primer, brochas y herramientas',
    category: 'pintura', icon: '🏠', color: 'teal', sort_order: 2,
    summary_template: 'Presupuesto Pintura Exterior - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 15 días. Recomendamos aplicar primer antes de pintar.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Kit de Pintura Exterior' },
      { displayType: 'product', description: 'Esmalte al agua exterior (galón)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Primer sellador (galón)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Rodillo de lana 23cm', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Brocha angular 3 pulgadas', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Para superficies nuevas, aplicar 2 manos de primer. Seleccione los productos del catálogo.' },
    ],
  },
  // PLOMERÍA
  {
    name: 'Kit de Plomería Básico',
    description: 'Materiales básicos para instalación o reparación de cañerías',
    category: 'plomeria', icon: '🔧', color: 'cyan', sort_order: 10,
    summary_template: 'Presupuesto Plomería - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 15 días. No incluye mano de obra.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Materiales de Plomería' },
      { displayType: 'product', description: 'Cañería PVC/PPR según requerimiento', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Codos y fittings', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Llave de paso', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Teflón y pegamento PVC', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Presupuesto de materiales. No incluye instalación. Seleccione los productos del catálogo.' },
    ],
  },
  // ELECTRICIDAD
  {
    name: 'Kit Eléctrico Básico',
    description: 'Materiales para instalación eléctrica domiciliaria',
    category: 'electricidad', icon: '⚡', color: 'amber', sort_order: 20,
    summary_template: 'Presupuesto Eléctrico - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 15 días. Instalación debe ser realizada por electricista certificado.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Materiales Eléctricos' },
      { displayType: 'product', description: 'Cable eléctrico (rollo)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Interruptores/enchufes', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Tablero eléctrico', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Protecciones automáticas', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Instalación debe ser realizada por electricista autorizado SEC. Seleccione los productos del catálogo.' },
    ],
  },
  // CONSTRUCCIÓN
  {
    name: 'Presupuesto Construcción General',
    description: 'Materiales de construcción: cemento, fierro, ladrillos, áridos',
    category: 'construccion', icon: '🏗️', color: 'green', sort_order: 30,
    summary_template: 'Presupuesto Construcción - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 7 días por volatilidad de precios. Despacho según disponibilidad.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Materiales de Construcción' },
      { displayType: 'product', description: 'Cemento (saco 25kg)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Arena (m3)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Ripio (m3)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Fierro construcción', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Ladrillos/Bloques', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Cantidades estimadas. Consultar disponibilidad de despacho. Seleccione los productos del catálogo.' },
    ],
  },
  {
    name: 'Set de Herramientas',
    description: 'Kit de herramientas manuales y eléctricas para obra',
    category: 'construccion', icon: '🔨', color: 'indigo', sort_order: 31,
    summary_template: 'Presupuesto Herramientas - TodoConstructor',
    notes_template: 'Precios incluyen IVA. Validez 15 días. Garantía según fabricante.',
    payment_terms: '0', currency: 'CLP',
    lines_template: [
      { displayType: 'section', sectionTitle: 'Kit de Herramientas' },
      { displayType: 'product', description: 'Herramienta eléctrica (taladro/atornillador)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Set de brocas', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Herramientas manuales', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'product', description: 'Elementos de seguridad (EPP)', quantity: 1, unitPrice: 0, discountPercent: 0 },
      { displayType: 'note', noteText: 'Garantía de herramientas eléctricas según fabricante. Seleccione los productos del catálogo.' },
    ],
  },
];

async function seedDefaultTemplates(): Promise<void> {
  try {
    const supabase = await getSupabaseServiceClient();
    const { error } = await supabase
      .from('budget_templates')
      .insert(DEFAULT_TEMPLATES);
    if (error) {
      console.error('Error seeding budget templates:', error);
    }
  } catch (err) {
    console.error('Error in seedDefaultTemplates:', err);
  }
}

function mapRowToTemplate(row: any): BudgetTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category,
    icon: row.icon || '📋',
    color: row.color || 'blue',
    isActive: row.is_active,
    sortOrder: row.sort_order || 0,
    summaryTemplate: row.summary_template || '',
    notesTemplate: row.notes_template || '',
    paymentTerms: row.payment_terms || '0',
    currency: row.currency || 'CLP',
    linesTemplate: row.lines_template || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBudgetTemplates(): Promise<{ success: boolean; templates: BudgetTemplate[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    let { data, error } = await supabase
      .from('budget_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) {
      console.error('Error fetching budget_templates:', error.message);
      throw error;
    }

    // Auto-seed si la tabla está vacía
    if (!data || data.length === 0) {
      await seedDefaultTemplates();

      const refetch = await supabase
        .from('budget_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (!refetch.error) {
        data = refetch.data;
      }
    }

    return { success: true, templates: (data || []).map(mapRowToTemplate) };
  } catch (error) {
    console.error('Error in getBudgetTemplates:', error);
    return { success: true, templates: [], error: String(error) };
  }
}

export async function getBudgetTemplateById(id: number): Promise<{ success: boolean; template?: BudgetTemplate; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('budget_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, template: mapRowToTemplate(data) };
  } catch (error) {
    console.error('Error fetching budget template:', error);
    return { success: false, error: String(error) };
  }
}

export async function createBudgetTemplate(input: BudgetTemplateCreateInput): Promise<{ success: boolean; template?: BudgetTemplate; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('budget_templates')
      .insert({
        name: input.name,
        description: input.description || '',
        category: input.category,
        icon: input.icon || '📋',
        color: input.color || 'blue',
        sort_order: input.sortOrder || 50,
        summary_template: input.summaryTemplate || '',
        notes_template: input.notesTemplate || '',
        payment_terms: input.paymentTerms || '0',
        currency: input.currency || 'CLP',
        lines_template: input.linesTemplate,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, template: mapRowToTemplate(data) };
  } catch (error) {
    console.error('Error creating budget template:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateBudgetTemplate(id: number, input: Partial<BudgetTemplateCreateInput>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient();
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
    if (input.summaryTemplate !== undefined) updateData.summary_template = input.summaryTemplate;
    if (input.notesTemplate !== undefined) updateData.notes_template = input.notesTemplate;
    if (input.paymentTerms !== undefined) updateData.payment_terms = input.paymentTerms;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.linesTemplate !== undefined) updateData.lines_template = input.linesTemplate;

    const { error } = await supabase
      .from('budget_templates')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating budget template:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteBudgetTemplate(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient();
    const { error } = await supabase
      .from('budget_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting budget template:', error);
    return { success: false, error: String(error) };
  }
}
