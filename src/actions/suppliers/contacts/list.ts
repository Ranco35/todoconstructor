'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Función helper para verificar si una tabla existe
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

export interface ContactFilters {
  search?: string;
  type?: 'PRINCIPAL' | 'SECUNDARIO' | 'EMERGENCIA';
  isPrimary?: boolean;
  active?: boolean;
  position?: string;
}

export interface ContactListParams {
  supplierId: number;
  page?: number;
  limit?: number;
  filters?: ContactFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getSupplierContacts({
  supplierId,
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'name',
  sortOrder = 'asc'
}: ContactListParams) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      console.log('ℹ️ Tabla SupplierContact no existe, retornando datos vacíos...');
      return {
        contacts: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        stats: {
          total: 0,
          byType: {},
          active: 0,
          inactive: 0,
          primary: 0
        }
      };
    }

    // Verificar que el proveedor existe
    const { data: supplier, error: supplierError } = await supabase
      .from('Supplier')
      .select('id')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      throw new Error('Proveedor no encontrado');
    }

    // Construir consulta base
    let query = supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id,
          name,
          businessName,
          reference,
          companyType
        )
      `)
      .eq('supplierId', supplierId);

    // Aplicar filtros
    if (filters.search) {
      const searchTerm = filters.search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.isPrimary !== undefined) {
      query = query.eq('isPrimary', filters.isPrimary);
    }

    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters.position) {
      query = query.ilike('position', `%${filters.position}%`);
    }

    // Calcular rango para paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Aplicar ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Obtener contactos con paginación
    const { data: contacts, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' });

    if (error) {
      throw new Error(`Error obteniendo contactos: ${error.message}`);
    }

    // Obtener conteo total si no se proporcionó
    let total = count || 0;
    if (!count) {
      const { count: totalCount } = await supabase
        .from('SupplierContact')
        .select('*', { count: 'exact', head: true })
        .eq('supplierId', supplierId);
      total = totalCount || 0;
    }

    // Calcular estadísticas - necesitamos hacer consultas separadas
    const { data: allContacts } = await supabase
      .from('SupplierContact')
      .select('type, active, isPrimary')
      .eq('supplierId', supplierId);

    const stats = allContacts ? {
      total: allContacts.length,
      byType: allContacts.reduce((acc, contact) => {
        acc[contact.type] = (acc[contact.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      active: allContacts.filter(c => c.active).length,
      inactive: allContacts.filter(c => !c.active).length,
      primary: allContacts.filter(c => c.isPrimary).length
    } : {
      total: 0,
      byType: {},
      active: 0,
      inactive: 0,
      primary: 0
    };

    const totalPages = Math.ceil(total / limit);

    return {
      contacts: contacts || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats
    };

  } catch (error) {
    console.error('Error getting supplier contacts:', error);
    throw error;
  }
}

export async function getSupplierContact(contactId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      console.log('ℹ️ Tabla SupplierContact no existe, contacto no encontrado...');
      throw new Error('Contacto no encontrado');
    }

    const { data: contact, error } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id,
          name,
          businessName,
          reference,
          companyType
        )
      `)
      .eq('id', contactId)
      .single();

    if (error || !contact) {
      throw new Error('Contacto no encontrado');
    }

    return contact;

  } catch (error) {
    console.error('Error getting supplier contact:', error);
    throw error;
  }
}

export async function getPrimaryContact(supplierId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      console.log('ℹ️ Tabla SupplierContact no existe, retornando null...');
      return null;
    }

    const { data: contact, error } = await supabase
      .from('SupplierContact')
      .select('*')
      .eq('supplierId', supplierId)
      .eq('isPrimary', true)
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error obteniendo contacto principal: ${error.message}`);
    }

    return contact;

  } catch (error) {
    console.error('Error getting primary contact:', error);
    throw error;
  }
}

export async function getActiveContacts(supplierId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      console.log('ℹ️ Tabla SupplierContact no existe, retornando array vacío...');
      return [];
    }

    const { data: contacts, error } = await supabase
      .from('SupplierContact')
      .select('*')
      .eq('supplierId', supplierId)
      .eq('active', true)
      .order('isPrimary', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo contactos activos: ${error.message}`);
    }

    return contacts || [];

  } catch (error) {
    console.error('Error getting active contacts:', error);
    throw error;
  }
}

export async function searchContacts(query: string, supplierId?: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      console.log('ℹ️ Tabla SupplierContact no existe, retornando array vacío...');
      return [];
    }

    let searchQuery = supabase
      .from('SupplierContact')
      .select('id, name, position, email, phone, type, isPrimary, active')
      .or(`name.ilike.%${query}%,position.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('active', true)
      .order('name');

    if (supplierId) {
      searchQuery = searchQuery.eq('supplierId', supplierId);
    }

    const { data: contacts, error } = await searchQuery.limit(10);

    if (error) {
      throw new Error(`Error buscando contactos: ${error.message}`);
    }

    return contacts || [];

  } catch (error) {
    console.error('Error searching contacts:', error);
    return [];
  }
} 