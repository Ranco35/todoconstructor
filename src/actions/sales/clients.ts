'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface SalesClient {
  id: number;
  nombrePrincipal: string;
  apellido: string;
  email: string;
  rut?: string;
  telefono?: string;
  telefonoMovil?: string;
  razonSocial?: string;
  tipoCliente?: string;
  estado?: string;
}

export async function getSalesClient(id: number): Promise<{ success: boolean; data?: SalesClient; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido,
        email,
        rut,
        telefono,
        telefonoMovil,
        razonSocial,
        tipoCliente,
        estado
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo cliente para ventas:', error);
      return { success: false, error: 'Cliente no encontrado' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Error en getSalesClient:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function searchSalesClients(term: string): Promise<{ success: boolean; data?: SalesClient[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const normalizedTerm = term?.trim().toLowerCase() || '';
    
    if (!normalizedTerm || normalizedTerm.length < 1) {
      const { data: clients, error } = await supabase
        .from('Client')
        .select(`
          id,
          nombrePrincipal,
          apellido,
          email,
          rut,
          telefono,
          telefonoMovil,
          razonSocial,
          tipoCliente,
          estado
        `)
        .eq('estado', 'activo')
        .order('nombrePrincipal', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error obteniendo clientes para ventas:', error);
        return { success: false, error: 'Error obteniendo clientes', data: [] };
      }

      return { success: true, data: clients || [] };
    }
    
    const { data: clients, error } = await supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido,
        email,
        rut,
        telefono,
        telefonoMovil,
        razonSocial,
        tipoCliente,
        estado
      `)
      .eq('estado', 'activo')
      .or(`nombrePrincipal.ilike.%${normalizedTerm}%,apellido.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%,rut.ilike.%${normalizedTerm}%,razonSocial.ilike.%${normalizedTerm}%`)
      .order('nombrePrincipal', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error buscando clientes para ventas:', error);
      return { success: false, error: 'Error buscando clientes', data: [] };
    }

    return { success: true, data: clients || [] };
  } catch (error) {
    console.error('Error en searchSalesClients:', error);
    return { success: false, error: 'Error interno del servidor', data: [] };
  }
}

export async function getSalesClientsByIds(ids: number[]): Promise<{ success: boolean; data?: SalesClient[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: clients, error } = await supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido,
        email,
        rut,
        telefono,
        telefonoMovil,
        razonSocial,
        tipoCliente,
        estado
      `)
      .in('id', ids)
      .order('nombrePrincipal', { ascending: true });

    if (error) {
      console.error('Error obteniendo clientes por IDs:', error);
      return { success: false, error: 'Error obteniendo clientes' };
    }

    return { success: true, data: clients || [] };
  } catch (error) {
    console.error('Error en getSalesClientsByIds:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 