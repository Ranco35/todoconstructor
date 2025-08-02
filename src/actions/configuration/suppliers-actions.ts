'use server'
import { getSupabaseClient } from '@/lib/supabase-server';

export interface SupplierData {
  id?: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  companyType?: string | null;
  rank?: string | null; // Deprecated - use supplierRank
  supplierRank?: string | null;
  paymentTerm?: string | null;
  creditLimit?: number | null;
  isActive?: boolean;
  active?: boolean;
  notes?: string | null;
  costCenterId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getSuppliers({
  page = 1,
  pageSize = 10,
  rank,
  isActive,
  tags,
  search
}: {
  page?: number;
  pageSize?: number;
  rank?: string;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await getSupabaseClient();
  
  // Si hay filtro por etiquetas, necesitamos hacer una consulta diferente
  if (tags && tags.length > 0) {
    // Obtener IDs de proveedores que tienen las etiquetas especificadas
    const { data: supplierIds, error: tagError } = await supabase
      .from('SupplierTagAssignment')
      .select('supplierId')
      .in('etiquetaId', tags.map(Number));
    
    if (tagError) {
      console.error('Error filtering by tags:', tagError);
      return { data: [], total: 0, totalPages: 0, currentPage: page };
    }
    
    const uniqueSupplierIds = [...new Set(supplierIds?.map(item => item.supplierId) || [])];
    
    if (uniqueSupplierIds.length === 0) {
      return { data: [], total: 0, totalPages: 0, currentPage: page };
    }
    
    let query = supabase
      .from('Supplier')
      .select(`
        *,
        Cost_Center:Cost_Center(id, name, code),
        etiquetas:SupplierTagAssignment(
          id,
          etiquetaId,
          etiqueta:SupplierTag(
            id,
            nombre,
            color,
            icono,
            activo
          )
        )
      `)
      .in('id', uniqueSupplierIds)
      .order('name', { ascending: true });

    // Aplicar otros filtros
    if (rank) {
      query = query.eq('rank', rank);
    }
    
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive);
    }

    // Aplicar filtro de búsqueda
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `taxId.ilike.%${search}%,` +
        `city.ilike.%${search}%,` +
        `category.ilike.%${search}%`
      );
    }

    // Consulta para datos paginados
    const dataResult = await query.range(from, to);

    // Consulta para total con filtros
    let countQuery = supabase
      .from('Supplier')
      .select('*', { count: 'exact', head: true })
      .in('id', uniqueSupplierIds);

    if (rank) {
      countQuery = countQuery.eq('rank', rank);
    }
    
    if (isActive !== undefined) {
      countQuery = countQuery.eq('isActive', isActive);
    }

    // Aplicar filtro de búsqueda al conteo
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `taxId.ilike.%${search}%,` +
        `city.ilike.%${search}%,` +
        `category.ilike.%${search}%`
      );
    }

    const totalResult = await countQuery;

    const data = dataResult.data || [];
    const total = totalResult.count || 0;

    return {
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    }
  }

  // Consulta normal sin filtro por etiquetas
  let query = supabase
    .from('Supplier')
    .select(`
      *,
      Cost_Center:Cost_Center(id, name, code),
      etiquetas:SupplierTagAssignment(
        id,
        etiquetaId,
        etiqueta:SupplierTag(
          id,
          nombre,
          color,
          icono,
          activo
        )
      )
    `)
    .order('name', { ascending: true });

  // Aplicar filtros
  if (rank) {
    query = query.eq('rank', rank);
  }
  
  if (isActive !== undefined) {
    query = query.eq('isActive', isActive);
  }

  // Aplicar filtro de búsqueda
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,` +
      `email.ilike.%${search}%,` +
      `taxId.ilike.%${search}%,` +
      `city.ilike.%${search}%,` +
      `category.ilike.%${search}%`
    );
  }

  // Consulta para datos paginados
  const dataResult = await query.range(from, to);

  // Consulta para total con filtros
  let countQuery = supabase
    .from('Supplier')
    .select('*', { count: 'exact', head: true });

  if (rank) {
    countQuery = countQuery.eq('rank', rank);
  }
  
  if (isActive !== undefined) {
    countQuery = countQuery.eq('isActive', isActive);
  }

  // Aplicar filtro de búsqueda al conteo
  if (search) {
    countQuery = countQuery.or(
      `name.ilike.%${search}%,` +
      `email.ilike.%${search}%,` +
      `taxId.ilike.%${search}%,` +
      `city.ilike.%${search}%,` +
      `category.ilike.%${search}%`
    );
  }

  const totalResult = await countQuery;

  const data = dataResult.data || [];
  const total = totalResult.count || 0;

  return {
    data,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  }
}

export async function getPartTimeSuppliers() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('Supplier')
    .select(`
      id,
      name,
      email,
      phone,
      taxId,
      supplierRank,
      category,
      isActive,
      notes,
      companyType
    `)
    .eq('category', 'Part-Time')
    .eq('isActive', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error getting part-time suppliers:', error);
    return [];
  }

  return data || [];
}

export async function getSupplierById(id: number): Promise<SupplierData | null> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('Supplier')
    .select(`
      *,
      Cost_Center:Cost_Center(id, name, code),
      etiquetas:SupplierTagAssignment(
        id,
        etiquetaId,
        etiqueta:SupplierTag(
          id,
          nombre,
          color,
          activo
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting supplier by ID:', error);
    return null;
  }

  return data;
}

export async function createSupplier(data: Partial<SupplierData>) {
  const supabase = await getSupabaseClient();
  const { data: supplier, error } = await supabase
    .from('Supplier')
    .insert({
      name: data.name!,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      postalCode: data.postalCode || null,
      taxId: data.taxId || null,
      companyType: data.companyType || null,
      rank: data.rank || null,
      paymentTerm: data.paymentTerm || null,
      creditLimit: data.creditLimit || null,
      isActive: data.isActive ?? true,
      active: data.active ?? true,
      notes: data.notes || null,
      costCenterId: data.costCenterId || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    throw new Error(`Error creando proveedor: ${error.message}`);
  }

  return supplier;
}

export async function updateSupplier(id: number, data: Partial<SupplierData>) {
  const supabase = await getSupabaseClient();
  const { data: supplier, error } = await supabase
    .from('Supplier')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      taxId: data.taxId,
      companyType: data.companyType,
      supplierRank: data.supplierRank || data.rank, // Support both for compatibility
      paymentTerm: data.paymentTerm,
      creditLimit: data.creditLimit,
      isActive: data.isActive,
      active: data.active,
      notes: data.notes,
      costCenterId: data.costCenterId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier:', error);
    throw new Error(`Error actualizando proveedor: ${error.message}`);
  }

  return supplier;
}

export async function deleteSupplier(id: number) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from('Supplier')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier:', error);
    throw new Error(`Error eliminando proveedor: ${error.message}`);
  }

  return { success: true };
}

export async function deleteSupplierAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  return await deleteSupplier(id);
}

export async function getSuppliersForPayment() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('Supplier')
    .select(`
      id,
      name,
      taxId,
      supplierRank,
      isActive
    `)
    .eq('isActive', true)
    .in('supplierRank', ['PART_TIME', 'REGULAR', 'PREMIUM'])
    .order('name', { ascending: true });

  if (error) {
    console.error('Error getting suppliers for payment:', error);
    return [];
  }

  return data || [];
}