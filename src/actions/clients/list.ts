'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { ClientSearchParams, ClientListResponse, ClientStats } from '@/types/client';

export async function getClients(params: ClientSearchParams = {}) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const {
      page = 1,
      pageSize = 10,
      search = '',
      estado = '',
      tipoCliente = '',
      sectorEconomicoId,
      etiquetas = [],
      ordenarPor = 'nombrePrincipal',
      orden = 'asc'
    } = params;

    // Obtener IDs de clientes que tienen las etiquetas especificadas
    let clientIdsWithTags: number[] = [];
    if (etiquetas && etiquetas.length > 0) {
      console.log('🏷️ Filtrando por etiquetas:', etiquetas);
      const { data: tagAssignments, error: tagError } = await supabase
        .from('ClientTagAssignment')
        .select('clienteId')
        .in('etiquetaId', etiquetas);

      if (tagError) {
        console.error('Error getting tag assignments:', tagError);
      } else {
        clientIdsWithTags = tagAssignments?.map(ta => ta.clienteId) || [];
        console.log('📋 Clientes encontrados con etiquetas:', clientIdsWithTags);
      }
    }

    // Construir la consulta base
    let query = supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido,
        tipoCliente,
        rut,
        email,
        telefono,
        telefonoMovil,
        estado,
        ciudad,
        region,
        razonSocial,
        esClienteFrecuente,
        fechaCreacion,
        fechaUltimaCompra,
        totalCompras,
        rankingCliente,
        contactos:ClientContact(
          id,
          nombre,
          apellido,
          email,
          telefono,
          telefonoMovil,
          cargo,
          departamento,
          esContactoPrincipal
        ),
        etiquetas:ClientTagAssignment(
          id,
          etiqueta:ClientTag(
            id,
            nombre,
            color,
            icono
          )
        )
      `);

    // Aplicar filtros
    if (search) {
      query = query.or(`nombrePrincipal.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%,rut.ilike.%${search}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (tipoCliente) {
      query = query.eq('tipoCliente', tipoCliente);
    }

    if (sectorEconomicoId) {
      query = query.eq('sectorEconomicoId', sectorEconomicoId);
    }

    // Filtrar por etiquetas si se especifica
    if (etiquetas && etiquetas.length > 0) {
      if (clientIdsWithTags.length > 0) {
        query = query.in('id', clientIdsWithTags);
        console.log('🎯 Aplicando filtro de etiquetas para clientes:', clientIdsWithTags);
      } else {
        // Si no hay clientes con esas etiquetas, retornar resultado vacío
        console.log('⚠️ No se encontraron clientes con las etiquetas especificadas');
        return {
          success: true,
          data: {
            clients: [],
            pagination: {
              page,
              pageSize,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
    }

    // Aplicar ordenamiento
    if (ordenarPor === 'fechaCreacion') {
      query = query.order('fechaCreacion', { ascending: orden === 'asc' });
    } else if (ordenarPor === 'fechaUltimaCompra') {
      query = query.order('fechaUltimaCompra', { ascending: orden === 'asc' });
    } else if (ordenarPor === 'totalCompras') {
      query = query.order('totalCompras', { ascending: orden === 'asc' });
    } else {
      query = query.order('nombrePrincipal', { ascending: orden === 'asc' });
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Ejecutar la consulta con count
    
    // Primero ejecutamos sin paginación para obtener el count total
    let countQuery = supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });

    // Aplicar los mismos filtros que en la consulta principal
    if (search) {
      countQuery = countQuery.or(`nombrePrincipal.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%,rut.ilike.%${search}%`);
    }
    if (estado) {
      countQuery = countQuery.eq('estado', estado);
    }
    if (tipoCliente) {
      countQuery = countQuery.eq('tipoCliente', tipoCliente);
    }
    if (sectorEconomicoId) {
      countQuery = countQuery.eq('sectorEconomicoId', sectorEconomicoId);
    }
    if (etiquetas && etiquetas.length > 0 && clientIdsWithTags.length > 0) {
      countQuery = countQuery.in('id', clientIdsWithTags);
    }

    // Obtener el conteo total
    const { count, error: countError } = await countQuery;
    
    // Ejecutar la consulta principal con paginación
    const { data: clients, error } = await query;
    
    // Log solo si hay errores
    if (error || countError) {
      console.log('📊 getClients: Resultado consulta:', { clients: clients?.length || 0, error, count, countError });
    }

    if (error || countError) {
      console.error('❌ getClients: Error en consulta:', { error, countError });
      return {
        success: false,
        error: 'Error obteniendo clientes',
        data: {
          clients: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0
          }
        }
      };
    }

    // Obtener contactos y etiquetas para cada cliente
    const clientsWithDetails = await Promise.all(
      (clients || []).map(async (client) => {
        // Obtener contactos adicionales
        const { data: contactos } = await supabase
          .from('ClientContact')
          .select('*')
          .eq('clienteId', client.id)
          .eq('esContactoPrincipal', true);

        // Obtener etiquetas
        const { data: etiquetasData } = await supabase
          .from('ClientTagAssignment')
          .select(`
            id,
            etiqueta:ClientTag(
              id,
              nombre,
              color,
              icono
            )
          `)
          .eq('clienteId', client.id);

        return {
          ...client,
          contactos: contactos || [],
          etiquetas: etiquetasData || []
        };
      })
    );

    // Calcular información de paginación
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const result = {
      success: true,
      data: {
        clients: clientsWithDetails,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          totalCount: total
        }
      }
    };
    return result;

  } catch (error) {
    console.error('💥 getClients: ERROR CAPTURADO:', error);
    const result = {
      success: false,
      error: 'Error interno del servidor',
      data: {
        clients: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0
        }
      }
    };
    console.log('📤 getClients: DEVOLVIENDO RESULTADO DE ERROR:', result);
    return result;
  }
}

export async function getClientStats() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const [
      totalClients,
      activeClients,
      inactiveClients,
      empresaClients,
      personaClients,
      frecuenteClients
    ] = await Promise.all([
      supabase.from('Client').select('*', { count: 'exact', head: true }),
      supabase.from('Client').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabase.from('Client').select('*', { count: 'exact', head: true }).eq('estado', 'inactivo'),
      supabase.from('Client').select('*', { count: 'exact', head: true }).eq('tipoCliente', 'EMPRESA'),
      supabase.from('Client').select('*', { count: 'exact', head: true }).eq('tipoCliente', 'PERSONA'),
      supabase.from('Client').select('*', { count: 'exact', head: true }).eq('esClienteFrecuente', true)
    ]);

    const stats = {
      total: totalClients.count || 0,
      activos: activeClients.count || 0,
      inactivos: inactiveClients.count || 0,
      empresas: empresaClients.count || 0,
      personas: personaClients.count || 0,
      frecuentes: frecuenteClients.count || 0
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting client stats:', error);
    return {
      success: false,
      error: 'Error obteniendo estadísticas',
      data: {
        total: 0,
        activos: 0,
        inactivos: 0,
        empresas: 0,
        personas: 0,
        frecuentes: 0
      }
    };
  }
} 