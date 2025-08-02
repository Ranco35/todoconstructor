'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupplierSearchParams, SupplierListResponse, SupplierStats } from '@/types/supplier';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function getSuppliers(params: SupplierSearchParams = {}): Promise<SupplierListResponse> {
  const supabase = await getSupabaseClient();
  
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      countryCode,
      supplierRank,
      active,
      category,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Primero obtener conteo total
    let countQuery = supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true });

    // Aplicar mismos filtros para el conteo
    if (search && search.trim().length >= 2) {
      const searchTerm = search.trim();
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,vat.ilike.%${searchTerm}%,taxId.ilike.%${searchTerm}%`);
    }

    if (countryCode) {
      countQuery = countQuery.eq('country', countryCode);
    }

    if (supplierRank) {
      countQuery = countQuery.eq('supplierRank', supplierRank);
    }

    if (active !== undefined) {
      countQuery = countQuery.eq('active', active);
    }

    if (category) {
      countQuery = countQuery.eq('companyType', category);
    }

    // Obtener conteo
    const { count: totalCount } = await countQuery;

    // Construir consulta para datos básicos (sin relaciones por ahora)
    let dataQuery = supabase
      .from('Supplier')
      .select('*');

    // Aplicar filtros a consulta de datos
    if (search && search.trim().length >= 2) {
      const searchTerm = search.trim();
      dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,vat.ilike.%${searchTerm}%,taxId.ilike.%${searchTerm}%`);
    }

    if (countryCode) {
      dataQuery = dataQuery.eq('country', countryCode);
    }

    if (supplierRank) {
      dataQuery = dataQuery.eq('supplierRank', supplierRank);
    }

    if (active !== undefined) {
      dataQuery = dataQuery.eq('active', active);
    }

    if (category) {
      dataQuery = dataQuery.eq('companyType', category);
    }

    // Aplicar ordenamiento y paginación
    const { data: suppliers, error } = await dataQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      console.error('Error en consulta de proveedores:', error);
      throw new Error(`Error obteniendo proveedores: ${error.message}`);
    }

    // Calcular estadísticas
    const stats = await getSupplierStats();

    const totalPages = Math.ceil((totalCount || 0) / pageSize);

    return {
      data: suppliers || [],
      totalCount: totalCount || 0,
      currentPage: page,
      totalPages,
      stats,
    };

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw new Error('Error al obtener la lista de proveedores');
  }
}

export async function getSupplierStats(): Promise<SupplierStats> {
  const supabase = await getSupabaseClient();
  
  try {
    // Total de proveedores
    const { count: total } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true });

    // Proveedores activos
    const { count: active } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Proveedores inactivos
    const { count: inactive } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('active', false);

    // Obtener estadísticas por ranking
    const { count: basicoCount } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('supplierRank', 'BASICO');

    const { count: regularCount } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('supplierRank', 'REGULAR');

    const { count: buenoCount } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('supplierRank', 'BUENO');

    const { count: excelenteCount } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .eq('supplierRank', 'EXCELENTE');

    // Por país - necesitamos hacer una consulta para obtener todos y agrupar
    const { data: allSuppliers } = await supabase
      .from('Supplier')
      .select('country');

    const countryStats = allSuppliers ? 
      Object.entries(
        allSuppliers.reduce((acc, supplier) => {
          const country = supplier.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([countryCode, count]) => ({
        countryCode,
        countryName: getCountryName(countryCode),
        count,
      })) : [];

    // Top proveedores por crédito
    const { data: topSuppliers } = await supabase
      .from('Supplier')
      .select('id, name, supplierRank, creditLimit')
      .order('creditLimit', { ascending: false })
      .limit(10);

    const rankStats = {
      basico: basicoCount || 0,
      regular: regularCount || 0,
              bueno: buenoCount || 0,
        excelente: excelenteCount || 0,
    };

    return {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      byRank: rankStats,
      byCountry: countryStats,
      topSuppliers: topSuppliers || [],
    };

  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byRank: { basico: 0, regular: 0, bueno: 0, excelente: 0 },
      byCountry: [],
      topSuppliers: [],
    };
  }
}

function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
    'CL': 'Chile',
    'AR': 'Argentina',
    'BR': 'Brasil',
    'PE': 'Perú',
    'CO': 'Colombia',
    'MX': 'México',
    'ES': 'España',
    'US': 'Estados Unidos',
    'CA': 'Canadá',
    'Unknown': 'Desconocido',
  };

  return countries[countryCode] || countryCode;
}

export async function getSupplierById(id: number) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data: supplier, error } = await supabase
      .from('Supplier')
      .select(`
        *,
        CreatedByUser (
          id,
          name,
          email
        ),
        ModifiedByUser (
          id,
          name,
          email
        ),
        Product (
          id,
          name,
          sku,
          price
        ),
        SupplierContact (
          id,
          name,
          type,
          email,
          phone,
          isPrimary,
          active
        ),
        SupplierBank (
          id,
          bankName,
          accountNumber,
          accountType,
          isPrimary
        ),
        SupplierTax (
          id,
          taxName,
          taxRate,
          isActive
        ),
        etiquetas:SupplierTagAssignment (
          id,
          etiquetaId,
          etiqueta:SupplierTag (
            id,
            nombre,
            color,
            descripcion,
            tipoAplicacion
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error obteniendo proveedor: ${error.message}`);
    }

    return supplier;

  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    throw error;
  }
}

export async function searchSuppliersByName(searchTerm: string, limit: number = 500) {
  const supabase = await getSupabaseClient();
  
  try {
    let query = supabase
      .from('Supplier')
      .select('id, name, displayName, email, phone, city, supplierRank, companyType, taxId')
      .eq('active', true)
      .order('name');

    // Si hay término de búsqueda, aplicar filtro
    if (searchTerm && searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim().toLowerCase();
      query = query.or(`name.ilike.%${searchLower}%,displayName.ilike.%${searchLower}%,email.ilike.%${searchLower}%,city.ilike.%${searchLower}%`);
    }

    const { data: suppliers, error } = await query.limit(limit);

    if (error) {
      console.error('Error buscando proveedores:', error);
      throw new Error(`Error buscando proveedores: ${error.message}`);
    }

    console.log(`[searchSuppliersByName] Buscando con término: "${searchTerm}", límite: ${limit}`);
    console.log(`[searchSuppliersByName] Proveedores encontrados: ${suppliers?.length || 0}`);
    
    // Verificar si Kunstmann está en los resultados
    if (suppliers) {
      const kunstmann = suppliers.find(s => 
        s.name?.toLowerCase().includes('kunstmann') || 
        s.name?.toLowerCase().includes('kun')
      );
      if (kunstmann) {
        console.log(`[searchSuppliersByName] Kunstmann encontrado: ${kunstmann.name}`);
      } else {
        console.log(`[searchSuppliersByName] Kunstmann NO encontrado en ${suppliers.length} proveedores`);
      }
    }

    return suppliers || [];

  } catch (error) {
    console.error('Error searching suppliers:', error);
    return [];
  }
}

// Función para obtener TODOS los proveedores activos (sin límite)
export async function getAllActiveSuppliers() {
  const supabase = await getSupabaseClient();
  
  try {
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, name, displayName, email, phone, city, supplierRank, companyType, taxId')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error obteniendo todos los proveedores:', error);
      throw new Error(`Error obteniendo proveedores: ${error.message}`);
    }

    console.log(`[getAllActiveSuppliers] Total de proveedores activos: ${suppliers?.length || 0}`);
    
    // Verificar Kunstmann específicamente
    if (suppliers) {
      const kunstmann = suppliers.find(s => 
        s.name?.toLowerCase().includes('kunstmann') || 
        s.name?.toLowerCase().includes('kun')
      );
      if (kunstmann) {
        console.log(`[getAllActiveSuppliers] Kunstmann encontrado: ${kunstmann.name} (ID: ${kunstmann.id})`);
      } else {
        console.log(`[getAllActiveSuppliers] Kunstmann NO encontrado en ${suppliers.length} proveedores`);
        
        // Mostrar algunos proveedores para debug
        console.log(`[getAllActiveSuppliers] Primeros 5 proveedores:`, suppliers.slice(0, 5).map(s => s.name));
      }
    }

    return suppliers || [];

  } catch (error) {
    console.error('Error getting all active suppliers:', error);
    return [];
  }
} 