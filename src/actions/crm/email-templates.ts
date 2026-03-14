'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CRMEmailTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body: string;
  category: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCRMEmailTemplates(): Promise<{ success: boolean; templates: CRMEmailTemplate[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('crm_email_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) throw error;
    return { success: true, templates: data || [] };
  } catch (error) {
    console.error('Error fetching CRM email templates:', error);
    return { success: true, templates: [], error: String(error) };
  }
}

export async function createCRMEmailTemplate(input: {
  name: string;
  subject: string;
  body: string;
  category: string;
}): Promise<{ success: boolean; template?: CRMEmailTemplate; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const slug = input.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const { data, error } = await supabase
      .from('crm_email_templates')
      .insert({
        name: input.name,
        slug: `custom_${slug}_${Date.now()}`,
        subject: input.subject,
        body: input.body,
        category: input.category,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, template: data };
  } catch (error) {
    console.error('Error creating CRM email template:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateCRMEmailTemplate(input: {
  id: number;
  name?: string;
  subject?: string;
  body?: string;
  category?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const updateData: Record<string, string> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.subject !== undefined) updateData.subject = input.subject;
    if (input.body !== undefined) updateData.body = input.body;
    if (input.category !== undefined) updateData.category = input.category;

    const { error } = await supabase
      .from('crm_email_templates')
      .update(updateData)
      .eq('id', input.id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating CRM email template:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCRMEmailTemplate(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    // Soft-delete: mark as inactive
    const { error } = await supabase
      .from('crm_email_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting CRM email template:', error);
    return { success: false, error: String(error) };
  }
}
