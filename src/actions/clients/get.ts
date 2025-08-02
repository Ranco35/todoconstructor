'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function getClient(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        contactos:ClientContact(
          id,
          nombre,
          apellido,
          email,
          telefono,
          telefonoMovil,
          cargo,
          departamento,
          tipoRelacionId,
          relacion,
          esContactoPrincipal,
          notas,
          fechaCreacion
        ),
        etiquetas:ClientTagAssignment(
          id,
          tag:ClientTag(
            id,
            nombre,
            color
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting client:', error);
      return { success: false, error: 'Cliente no encontrado' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Error in getClient:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getClientByRut(rut: string) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        contactos:ClientContact(
          id,
          nombre,
          apellido,
          email,
          telefono,
          telefonoMovil,
          cargo,
          departamento,
          tipoRelacionId,
          relacion,
          esContactoPrincipal,
          notas,
          fechaCreacion
        ),
        etiquetas:ClientTagAssignment(
          id,
          tag:ClientTag(
            id,
            nombre,
            color
          )
        )
      `)
      .eq('rut', rut)
      .single();

    if (error) {
      console.error('Error getting client by RUT:', error);
      return { success: false, error: 'Cliente no encontrado' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Error in getClientByRut:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function searchClients(term: string) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Normalizar término de búsqueda (trim, toLowerCase para consistencia)
    const normalizedTerm = term?.trim().toLowerCase() || '';
    
    // Si no hay término de búsqueda, mostrar algunos clientes
    if (!normalizedTerm || normalizedTerm.length < 1) {
      const { data: clients, error } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
        .order('nombrePrincipal', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error getting all clients:', error);
        return { success: false, error: 'Error obteniendo clientes', data: [] };
      }

      return { success: true, data: clients || [] };
    }
    
    // Si el término contiene espacio, buscar ambos términos en nombre y apellido (AND)
    if (normalizedTerm.includes(' ')) {
      const [first, ...rest] = normalizedTerm.split(' ');
      const second = rest.join(' ');
      const { data: activeClients, error: activeError } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
        .eq('estado', 'activo')
        .filter('nombrePrincipal', 'ilike', `%${first}%`)
        .filter('apellido', 'ilike', `%${second}%`)
        .order('nombrePrincipal', { ascending: true })
        .limit(10);

      if (!activeError && activeClients && activeClients.length > 0) {
        return { success: true, data: activeClients };
      }
      // Si no hay en activos, buscar en todos
      const { data: allClients, error: allError } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
        .filter('nombrePrincipal', 'ilike', `%${first}%`)
        .filter('apellido', 'ilike', `%${second}%`)
        .order('nombrePrincipal', { ascending: true })
        .limit(10);
      if (allError) {
        console.error('Error searching all clients (AND):', allError);
        return { success: false, error: 'Error buscando clientes', data: [] };
      }
      return { success: true, data: allClients || [] };
    }
    // Primero buscar solo en clientes activos (usando ilike para case-insensitive)
    const { data: activeClients, error: activeError } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
      .eq('estado', 'activo')
      .or(`nombrePrincipal.ilike.%${normalizedTerm}%,apellido.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%,rut.ilike.%${normalizedTerm}%,razonSocial.ilike.%${normalizedTerm}%`)
      .order('nombrePrincipal', { ascending: true })
      .limit(10);

    // Si no encontramos en activos, buscar en todos
    if (!activeError && (!activeClients || activeClients.length === 0)) {
      console.log(`No se encontraron clientes activos con término "${normalizedTerm}", buscando en todos...`);
      
      const { data: allClients, error: allError } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
        .or(`nombrePrincipal.ilike.%${normalizedTerm}%,apellido.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%,rut.ilike.%${normalizedTerm}%,razonSocial.ilike.%${normalizedTerm}%`)
        .order('nombrePrincipal', { ascending: true })
        .limit(10);

      if (allError) {
        console.error('Error searching all clients:', allError);
        return { success: false, error: 'Error buscando clientes', data: [] };
      }

      return { success: true, data: allClients || [] };
    }

    if (activeError) {
      console.error('Error searching clients:', activeError);
      return { success: false, error: 'Error buscando clientes', data: [] };
    }

    console.log(`Encontrados ${activeClients?.length || 0} clientes activos con término "${normalizedTerm}" (original: "${term}")`);
    return { success: true, data: activeClients || [] };
  } catch (error) {
    console.error('Error in searchClients:', error);
    return { success: false, error: 'Error interno del servidor', data: [] };
  }
} 