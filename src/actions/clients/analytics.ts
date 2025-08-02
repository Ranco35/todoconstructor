'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function getClientTagAnalytics() {
  try {
    const supabase = await getSupabaseServerClient();
    // Obtener estadísticas por etiqueta
    const { data: tagStats, error } = await (await getSupabaseServiceClient()).rpc('get_client_tag_analytics');
    
    if (error) {
      console.error('Error en RPC, usando query manual:', error);
      
      // Fallback: usar queries manuales
      const { data: etiquetas, error: tagsError } = await supabaseServer
        .from('ClientTag')
        .select(`
          id,
          nombre,
          color,
          icono,
          descripcion,
          activo
        `)
        .eq('activo', true)
        .order('nombre');

      if (tagsError) throw tagsError;

      // Para cada etiqueta, contar clientes asignados
      const analyticsData = await Promise.all(
        etiquetas.map(async (etiqueta) => {
          const { count, error: countError } = await supabaseServer
            .from('ClientTagAssignment')
            .select('*', { count: 'exact', head: true })
            .eq('etiquetaId', etiqueta.id);

          if (countError) {
            console.error('Error contando clientes para etiqueta', etiqueta.id, countError);
            return {
              ...etiqueta,
              totalClientes: 0,
              clientesActivos: 0,
              clientesInactivos: 0,
              valorPromedio: 0,
              ultimaActividad: null
            };
          }

          // Obtener clientes con más detalles
          const { data: assignments, error: assignError } = await supabaseServer
            .from('ClientTagAssignment')
            .select(`
              clienteId,
              cliente:Client!inner(
                id,
                nombrePrincipal,
                tipoCliente,
                estado,
                fechaCreacion,
                totalCompras
              )
            `)
            .eq('etiquetaId', etiqueta.id);

          if (assignError) {
            console.error('Error obteniendo assignments:', assignError);
          }

          const clientes = assignments || [];
          const clientesActivos = clientes.filter(a => a.cliente.estado === 'activo').length;
          const clientesInactivos = clientes.filter(a => a.cliente.estado === 'inactivo').length;
          
          // Calcular valor promedio basado en totalCompras
          const totalCompras = clientes.reduce((sum, a) => sum + (a.cliente.totalCompras || 0), 0);
          const valorPromedio = clientes.length > 0 ? totalCompras / clientes.length : 0;

          // Última actividad (fecha más reciente de creación o modificación)
          const fechas = clientes.map(a => new Date(a.cliente.fechaCreacion)).filter(Boolean);
          const ultimaActividad = fechas.length > 0 ? new Date(Math.max(...fechas.map(f => f.getTime()))) : null;

          return {
            ...etiqueta,
            totalClientes: count || 0,
            clientesActivos,
            clientesInactivos,
            valorPromedio,
            valorTotal: totalCompras,
            ultimaActividad: ultimaActividad?.toISOString() || null
          };
        })
      );

      return { success: true, data: analyticsData };
    }

    return { success: true, data: tagStats || [] };
  } catch (error) {
    console.error('Error obteniendo analytics de etiquetas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener analytics'
    };
  }
}

export async function getClientsByTag(tagId: number, page = 1, pageSize = 50) {
  try {
    const supabase = await getSupabaseServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: assignments, error, count } = await supabaseServer
      .from('ClientTagAssignment')
      .select(`
        id,
        fechaAsignacion,
        cliente:Client!inner(
          id,
          nombrePrincipal,
          apellido,
          razonSocial,
          tipoCliente,
          email,
          telefono,
          estado,
          totalCompras,
          fechaCreacion,
          ciudad,
          region
        )
      `, { count: 'exact' })
      .eq('etiquetaId', tagId)
      .order('fechaAsignacion', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: {
        clients: assignments?.map(a => a.cliente) || [],
        pagination: {
          page,
          pageSize,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }
    };
  } catch (error) {
    console.error('Error obteniendo clientes por etiqueta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener clientes'
    };
  }
}

export async function getTagPerformanceMetrics() {
  try {
    const supabase = await getSupabaseServerClient();
    // Obtener métricas de performance por etiqueta
    const { data: metrics, error } = await supabaseServer
      .from('ClientTag')
      .select(`
        id,
        nombre,
        color,
        assignments:ClientTagAssignment(
          cliente:Client(
            id,
            totalCompras,
            fechaCreacion,
            estado,
            tipoCliente
          )
        )
      `)
      .eq('activo', true);

    if (error) throw error;

    const performanceData = metrics?.map(tag => {
      const clientes = tag.assignments?.map(a => a.cliente) || [];
      const totalVentas = clientes.reduce((sum, c) => sum + (c.totalCompras || 0), 0);
      const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
      const clientesEmpresas = clientes.filter(c => c.tipoCliente === 'empresa').length;
      
      // Calcular crecimiento trimestral (simulado basado en datos reales)
      const fechasCreacion = clientes.map(c => new Date(c.fechaCreacion)).sort((a, b) => a.getTime() - b.getTime());
      const clientesQ1 = fechasCreacion.filter(f => f.getMonth() < 3).length;
      const clientesQ2 = fechasCreacion.filter(f => f.getMonth() >= 3 && f.getMonth() < 6).length;

      return {
        etiqueta: tag.nombre,
        color: tag.color,
        totalClientes: clientes.length,
        clientesActivos,
        clientesEmpresas,
        totalVentas,
        ventasPromedio: clientes.length > 0 ? totalVentas / clientes.length : 0,
        crecimientoQ1: clientesQ1,
        crecimientoQ2: clientesQ2,
        tendencia: clientesQ2 > clientesQ1 ? 'creciente' : clientesQ2 < clientesQ1 ? 'decreciente' : 'estable'
      };
    }) || [];

    return { success: true, data: performanceData };
  } catch (error) {
    console.error('Error obteniendo métricas de performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener métricas'
    };
  }
}

export async function getClientDistributionByRegion() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: distribution, error } = await supabaseServer
      .from('Client')
      .select(`
        region,
        tipoCliente,
        estado,
        totalCompras,
        etiquetas:ClientTagAssignment(
          etiqueta:ClientTag(
            id,
            nombre,
            color
          )
        )
      `)
      .not('region', 'is', null);

    if (error) throw error;

    // Agrupar por región
    const regionData = distribution?.reduce((acc, client) => {
      const region = client.region || 'Sin región';
      if (!acc[region]) {
        acc[region] = {
          region,
          totalClientes: 0,
          empresas: 0,
          personas: 0,
          activos: 0,
          totalVentas: 0,
          etiquetas: new Set()
        };
      }

      acc[region].totalClientes++;
      if (client.tipoCliente === 'empresa') acc[region].empresas++;
      if (client.tipoCliente === 'persona') acc[region].personas++;
      if (client.estado === 'activo') acc[region].activos++;
      acc[region].totalVentas += client.totalCompras || 0;

      // Agregar etiquetas únicas
      client.etiquetas?.forEach(e => {
        if (e.etiqueta) {
          acc[region].etiquetas.add(e.etiqueta.nombre);
        }
      });

      return acc;
    }, {} as Record<string, any>) || {};

    // Convertir Sets a arrays y calcular métricas adicionales
    const regionAnalytics = Object.values(regionData).map((region: any) => ({
      ...region,
      etiquetas: Array.from(region.etiquetas),
      ventasPromedio: region.totalClientes > 0 ? region.totalVentas / region.totalClientes : 0,
      porcentajeEmpresas: region.totalClientes > 0 ? (region.empresas / region.totalClientes) * 100 : 0
    }));

    return { success: true, data: regionAnalytics };
  } catch (error) {
    console.error('Error obteniendo distribución por región:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener distribución'
    };
  }
} 