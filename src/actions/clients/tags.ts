'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { TagApplicationType } from '@/types/client';

export async function getClientTags(tipoAplicacion?: TagApplicationType) {
  try {
    console.log('🔍 getClientTags: Iniciando consulta...');
    const supabase = await getSupabaseServerClient();
    console.log('🔍 getClientTags: Cliente Supabase obtenido');
    
    let query = supabase
      .from('ClientTag')
      .select('*')
      .eq('activo', true);

    if (tipoAplicacion && tipoAplicacion !== 'todos') {
      query = query.eq('tipoAplicacion', tipoAplicacion);
    }

    console.log('🔍 getClientTags: Ejecutando consulta...');
    const { data: tags, error } = await query
      .order('esSistema', { ascending: false })
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });

    console.log('🔍 getClientTags: Resultado consulta:', { tags: tags?.length, error });

    if (error) {
      console.error('❌ getClientTags: Error en consulta:', error);
      throw error;
    }

    console.log('✅ getClientTags: Consulta exitosa, devolviendo datos');
    return { success: true, data: tags || [] };
  } catch (error) {
    console.error('💥 getClientTags: Error general:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener las etiquetas'
    };
  }
}

export async function createClientTag(data: {
  nombre: string;
  color: string;
  icono?: string;
  descripcion?: string;
  tipoAplicacion: TagApplicationType;
  orden?: number;
  activo?: boolean;
  esSistema?: boolean;
}) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que el nombre sea único
    const { data: existingTag } = await supabase
      .from('ClientTag')
      .select('*')
      .eq('nombre', data.nombre)
      .single();

    if (existingTag) {
      return {
        success: false,
        error: 'Ya existe una etiqueta con ese nombre'
      };
    }

    const { data: tag, error } = await supabase
      .from('ClientTag')
      .insert({
        ...data,
        orden: data.orden || 0,
        activo: data.activo !== undefined ? data.activo : true,
        esSistema: data.esSistema !== undefined ? data.esSistema : false
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: tag };
  } catch (error) {
    console.error('Error creating client tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la etiqueta'
    };
  }
}

export async function updateClientTag(id: number, data: {
  nombre?: string;
  color?: string;
  icono?: string;
  descripcion?: string;
  tipoAplicacion?: TagApplicationType;
  orden?: number;
  activo?: boolean;
  esSistema?: boolean;
}) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que la etiqueta existe
    const { data: existingTag, error: checkError } = await supabase
      .from('ClientTag')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTag) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    // Verificar que el nombre sea único si se está cambiando
    if (data.nombre && data.nombre !== existingTag.nombre) {
      const { data: duplicateTag } = await supabase
        .from('ClientTag')
        .select('*')
        .eq('nombre', data.nombre)
        .single();

      if (duplicateTag) {
        return {
          success: false,
          error: 'Ya existe una etiqueta con ese nombre'
        };
      }
    }

    const { data: tag, error } = await supabase
      .from('ClientTag')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: tag };
  } catch (error) {
    console.error('Error updating client tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar la etiqueta'
    };
  }
}

export async function deleteClientTag(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que la etiqueta existe
    const { data: existingTag, error: checkError } = await supabase
      .from('ClientTag')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTag) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    // Verificar si hay clientes usando esta etiqueta
    const { count: clientsWithTag } = await supabase
      .from('ClientTagAssignment')
      .select('*', { count: 'exact', head: true })
      .eq('etiquetaId', id);

    if (clientsWithTag && clientsWithTag > 0) {
      return {
        success: false,
        error: `No se puede eliminar la etiqueta porque ${clientsWithTag} cliente(s) la están usando`
      };
    }

    const { error } = await supabase
      .from('ClientTag')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar la etiqueta'
    };
  }
}

export async function assignClientTag(clienteId: number, etiquetaId: number, userId?: number) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que el cliente y la etiqueta existen
    const [clientResult, tagResult] = await Promise.all([
      (await getSupabaseServerClient()).from('Client').select('*').eq('id', clienteId).single(),
      (await getSupabaseServerClient()).from('ClientTag').select('*').eq('id', etiquetaId).single()
    ]);

    if (clientResult.error || !clientResult.data) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      };
    }

    if (tagResult.error || !tagResult.data) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    const client = clientResult.data;
    const tag = tagResult.data;

    // Verificar que la etiqueta sea aplicable al tipo de cliente
    if (tag.tipoAplicacion !== 'todos' && tag.tipoAplicacion !== client.tipoCliente) {
      return {
        success: false,
        error: `La etiqueta "${tag.nombre}" no es aplicable a clientes de tipo "${client.tipoCliente}"`
      };
    }

    // Verificar que no esté ya asignada
    const { data: existingAssignment } = await supabase
      .from('ClientTagAssignment')
      .select('*')
      .eq('clienteId', clienteId)
      .eq('etiquetaId', etiquetaId)
      .single();

    if (existingAssignment) {
      return {
        success: false,
        error: 'El cliente ya tiene esta etiqueta asignada'
      };
    }

    const { data: assignment, error } = await supabase
      .from('ClientTagAssignment')
      .insert({
        clienteId,
        etiquetaId,
        asignadoPor: userId
      })
      .select(`
        *,
        etiqueta:ClientTag(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: assignment };
  } catch (error) {
    console.error('Error assigning client tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar la etiqueta'
    };
  }
}

export async function assignTagsToMultipleClients(clienteIds: number[], etiquetaId: number, userId?: number) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que la etiqueta existe
    const { data: tag, error: tagError } = await supabase
      .from('ClientTag')
      .select('*')
      .eq('id', etiquetaId)
      .single();

    if (tagError || !tag) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    // Obtener los clientes para validar el tipo
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('*')
      .in('id', clienteIds);

    if (clientsError) throw clientsError;

    if (!clients || clients.length !== clienteIds.length) {
      return {
        success: false,
        error: 'Algunos clientes no fueron encontrados'
      };
    }

    // Verificar que la etiqueta sea aplicable a todos los clientes
    if (tag.tipoAplicacion !== 'todos') {
      const incompatibleClients = clients.filter(client => client.tipoCliente !== tag.tipoAplicacion);
      if (incompatibleClients.length > 0) {
        return {
          success: false,
          error: `La etiqueta "${tag.nombre}" no es aplicable a ${incompatibleClients.length} cliente(s)`
        };
      }
    }

    // Verificar asignaciones existentes para evitar duplicados
    const { data: existingAssignments } = await supabase
      .from('ClientTagAssignment')
      .select('clienteId')
      .in('clienteId', clienteIds)
      .eq('etiquetaId', etiquetaId);

    const existingClientIds = existingAssignments?.map(a => a.clienteId) || [];
    const newClientIds = clienteIds.filter(id => !existingClientIds.includes(id));

    if (newClientIds.length === 0) {
      return {
        success: true,
        data: {
          assigned: 0,
          total: clienteIds.length,
          message: 'Todos los clientes ya tenían esta etiqueta asignada'
        }
      };
    }

    // Crear las asignaciones solo para clientes que no la tienen
    const assignmentsData = newClientIds.map(clienteId => ({
      clienteId,
      etiquetaId,
      asignadoPor: userId
    }));

    const { error: insertError } = await supabase
      .from('ClientTagAssignment')
      .insert(assignmentsData);

    if (insertError) throw insertError;

    revalidatePath('/dashboard/customers');
    return { 
      success: true, 
      data: { 
        assigned: newClientIds.length,
        total: clienteIds.length,
        existing: existingClientIds.length
      }
    };
  } catch (error) {
    console.error('Error assigning tags to multiple clients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar etiquetas'
    };
  }
} 