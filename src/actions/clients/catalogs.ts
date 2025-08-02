'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { ClientType } from '@/types/client';

export async function getCountries() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: countries, error } = await supabase
      .from('Country')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: countries || [] };
  } catch (error) {
    console.error('Error fetching countries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener los países'
    };
  }
}

export async function getEconomicSectors() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: sectors, error } = await supabase
      .from('EconomicSector')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: sectors || [] };
  } catch (error) {
    console.error('Error fetching economic sectors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener los sectores económicos'
    };
  }
}

export async function getEconomicSectorSubsectors(sectorPadreId: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: subsectores, error } = await supabase
      .from('EconomicSector')
      .select('*')
      .eq('sectorPadreId', sectorPadreId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: subsectores || [] };
  } catch (error) {
    console.error('Error fetching economic sector subsectors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener los subsectores'
    };
  }
}

export async function getRelationshipTypes(tipoCliente?: ClientType) {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('RelationshipType')
      .select('*');

    if (tipoCliente) {
      query = query.eq('tipoCliente', tipoCliente);
    }

    const { data: relationshipTypes, error } = await query
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: relationshipTypes || [] };
  } catch (error) {
    console.error('Error fetching relationship types:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener los tipos de relación'
    };
  }
}

export async function createRelationshipType(data: {
  nombre: string;
  tipoCliente: ClientType;
  descripcion?: string;
}) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que el nombre sea único
    const { data: existingType } = await supabase
      .from('RelationshipType')
      .select('*')
      .eq('nombre', data.nombre)
      .single();

    if (existingType) {
      return {
        success: false,
        error: 'Ya existe un tipo de relación con ese nombre'
      };
    }

    const { data: relationshipType, error } = await supabase
      .from('RelationshipType')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: relationshipType };
  } catch (error) {
    console.error('Error creating relationship type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear el tipo de relación'
    };
  }
}

export async function updateRelationshipType(id: number, data: {
  nombre?: string;
  tipoCliente?: ClientType;
  descripcion?: string;
}) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que el tipo existe
    const { data: existingType, error: checkError } = await supabase
      .from('RelationshipType')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingType) {
      return {
        success: false,
        error: 'Tipo de relación no encontrado'
      };
    }

    // Verificar que el nombre sea único si se está cambiando
    if (data.nombre && data.nombre !== existingType.nombre) {
      const { data: duplicateType } = await supabase
        .from('RelationshipType')
        .select('*')
        .eq('nombre', data.nombre)
        .single();

      if (duplicateType) {
        return {
          success: false,
          error: 'Ya existe un tipo de relación con ese nombre'
        };
      }
    }

    const { data: relationshipType, error } = await supabase
      .from('RelationshipType')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: relationshipType };
  } catch (error) {
    console.error('Error updating relationship type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el tipo de relación'
    };
  }
}

export async function deleteRelationshipType(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    // Verificar que el tipo existe
    const { data: existingType, error: checkError } = await supabase
      .from('RelationshipType')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingType) {
      return {
        success: false,
        error: 'Tipo de relación no encontrado'
      };
    }

    // Verificar si hay contactos usando este tipo
    const { count: contactsWithType } = await supabase
      .from('ClientContact')
      .select('*', { count: 'exact', head: true })
      .eq('tipoRelacionId', id);

    if (contactsWithType && contactsWithType > 0) {
      return {
        success: false,
        error: `No se puede eliminar el tipo de relación porque ${contactsWithType} contacto(s) lo están usando`
      };
    }

    const { error } = await supabase
      .from('RelationshipType')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting relationship type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar el tipo de relación'
    };
  }
}

// Función para inicializar datos por defecto
export async function initializeDefaultData() {
  try {
    const supabase = await getSupabaseServerClient();
    // Inicializar países
    const countries = [
      { codigo: 'CL', nombre: 'Chile', nombreCompleto: 'República de Chile' },
      { codigo: 'AR', nombre: 'Argentina', nombreCompleto: 'República Argentina' },
      { codigo: 'PE', nombre: 'Perú', nombreCompleto: 'República del Perú' },
      { codigo: 'BO', nombre: 'Bolivia', nombreCompleto: 'Estado Plurinacional de Bolivia' },
      { codigo: 'CO', nombre: 'Colombia', nombreCompleto: 'República de Colombia' },
      { codigo: 'EC', nombre: 'Ecuador', nombreCompleto: 'República del Ecuador' },
      { codigo: 'US', nombre: 'Estados Unidos', nombreCompleto: 'Estados Unidos de América' },
      { codigo: 'BR', nombre: 'Brasil', nombreCompleto: 'República Federativa del Brasil' }
    ];

    for (const country of countries) {
      const { error } = await supabase
        .from('Country')
        .upsert(country, { onConflict: 'codigo' });

      if (error) {
        console.error('Error upserting country:', error);
      }
    }

    // Inicializar sectores económicos
    const sectors = [
      { codigo: 'A', nombre: 'Agricultura, ganadería, silvicultura y pesca', descripcion: 'Actividades primarias del sector agropecuario' },
      { codigo: 'B', nombre: 'Explotación de minas y canteras', descripcion: 'Extracción de recursos minerales' },
      { codigo: 'C', nombre: 'Industrias manufactureras', descripcion: 'Transformación de materias primas' },
      { codigo: 'F', nombre: 'Construcción', descripcion: 'Actividades de construcción y obras civiles' },
      { codigo: 'G', nombre: 'Comercio al por mayor y al por menor', descripcion: 'Actividades comerciales' },
      { codigo: 'H', nombre: 'Transporte y almacenamiento', descripcion: 'Servicios de transporte y logística' },
      { codigo: 'I', nombre: 'Alojamiento y servicios de comida', descripcion: 'Hoteles, restaurantes y servicios turísticos' },
      { codigo: 'J', nombre: 'Información y comunicaciones', descripcion: 'Tecnología, telecomunicaciones y medios' },
      { codigo: 'K', nombre: 'Actividades financieras y de seguros', descripcion: 'Servicios financieros y bancarios' },
      { codigo: 'L', nombre: 'Actividades inmobiliarias', descripcion: 'Compra, venta y arriendo de propiedades' },
      { codigo: 'M', nombre: 'Actividades profesionales, científicas y técnicas', descripcion: 'Servicios profesionales especializados' },
      { codigo: 'N', nombre: 'Actividades de servicios administrativos', descripcion: 'Servicios de apoyo empresarial' },
      { codigo: 'P', nombre: 'Educación', descripcion: 'Servicios educativos' },
      { codigo: 'Q', nombre: 'Actividades de atención de la salud humana', descripcion: 'Servicios de salud y medicina' },
      { codigo: 'S', nombre: 'Otras actividades de servicios', descripcion: 'Servicios diversos' }
    ];

    for (const sector of sectors) {
      const { error } = await supabase
        .from('EconomicSector')
        .upsert(sector, { onConflict: 'codigo' });

      if (error) {
        console.error('Error upserting sector:', error);
      }
    }

    // Inicializar tipos de relación para empresas
    const empresaRelations = [
      { nombre: 'Gerente General', tipoCliente: 'empresa', descripcion: 'Máximo ejecutivo de la empresa' },
      { nombre: 'Gerente Comercial', tipoCliente: 'empresa', descripcion: 'Responsable del área comercial' },
      { nombre: 'Gerente Financiero', tipoCliente: 'empresa', descripcion: 'Responsable del área financiera' },
      { nombre: 'Jefe de Compras', tipoCliente: 'empresa', descripcion: 'Encargado de las compras' },
      { nombre: 'Asistente', tipoCliente: 'empresa', descripcion: 'Asistente administrativo' },
      { nombre: 'Contador', tipoCliente: 'empresa', descripcion: 'Profesional contable' }
    ];

    // Inicializar tipos de relación para personas
    const personaRelations = [
      { nombre: 'Esposa', tipoCliente: 'persona', descripcion: 'Cónyuge femenino' },
      { nombre: 'Marido', tipoCliente: 'persona', descripcion: 'Cónyuge masculino' },
      { nombre: 'Hijo/a', tipoCliente: 'persona', descripcion: 'Descendiente directo' },
      { nombre: 'Padre', tipoCliente: 'persona', descripcion: 'Progenitor masculino' },
      { nombre: 'Madre', tipoCliente: 'persona', descripcion: 'Progenitor femenino' },
      { nombre: 'Hermano/a', tipoCliente: 'persona', descripcion: 'Hermano o hermana' },
      { nombre: 'Socio', tipoCliente: 'persona', descripcion: 'Socio de negocio' }
    ];

    const allRelations = [...empresaRelations, ...personaRelations];

    for (const relation of allRelations) {
      const { error } = await supabase
        .from('RelationshipType')
        .upsert(relation, { onConflict: 'nombre' });

      if (error) {
        console.error('Error upserting relationship type:', error);
      }
    }

    // Inicializar etiquetas del sistema con iconos modernos
    const systemTags = [
      { 
        nombre: 'Cliente Frecuente', 
        color: '#FFD700', 
        descripcion: 'Cliente con alta frecuencia de compras', 
        tipoAplicacion: 'todos', 
        icono: 'star',
        orden: 1, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Adulto Mayor', 
        color: '#9333EA', 
        descripcion: 'Clientes de la tercera edad', 
        tipoAplicacion: 'persona', 
        icono: 'user',
        orden: 2, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Autocuidado', 
        color: '#059669', 
        descripcion: 'Clientes enfocados en bienestar y autocuidado', 
        tipoAplicacion: 'todos', 
        icono: 'star',
        orden: 3, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Zona Norte', 
        color: '#4A90E2', 
        descripcion: 'Cliente ubicado en zona norte', 
        tipoAplicacion: 'todos', 
        icono: 'map-pin',
        orden: 4, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Zona Centro', 
        color: '#7B68EE', 
        descripcion: 'Cliente ubicado en zona centro', 
        tipoAplicacion: 'todos', 
        icono: 'building',
        orden: 5, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Zona Sur', 
        color: '#DC143C', 
        descripcion: 'Cliente ubicado en zona sur', 
        tipoAplicacion: 'todos', 
        icono: 'trees',
        orden: 6, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Prospecto', 
        color: '#6B7280', 
        descripcion: 'Cliente potencial en evaluación', 
        tipoAplicacion: 'todos', 
        icono: 'target',
        orden: 7, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Corporativo', 
        color: '#1F2937', 
        descripcion: 'Cliente corporativo', 
        tipoAplicacion: 'empresa', 
        icono: 'factory',
        orden: 8, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'PYME', 
        color: '#10B981', 
        descripcion: 'Pequeña y mediana empresa', 
        tipoAplicacion: 'empresa', 
        icono: 'bar-chart-3',
        orden: 9, 
        esSistema: true, 
        activo: true 
      },
      { 
        nombre: 'Referido', 
        color: '#8B5CF6', 
        descripcion: 'Cliente que llegó por referencia', 
        tipoAplicacion: 'todos', 
        icono: 'gift',
        orden: 10, 
        esSistema: true, 
        activo: true 
      }
    ];

    for (const tag of systemTags) {
      const { error } = await supabase
        .from('ClientTag')
        .upsert(tag, { onConflict: 'nombre' });

      if (error) {
        console.error('Error upserting tag:', error);
      }
    }

    return { success: true, message: 'Datos por defecto inicializados correctamente' };
  } catch (error) {
    console.error('Error initializing default data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al inicializar datos por defecto'
    };
  }
}

// Función para obtener etiquetas de clientes
export async function getClientTags(tipoAplicacion?: string) {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('ClientTag')
      .select('*')
      .eq('activo', true);

    if (tipoAplicacion && tipoAplicacion !== 'todos') {
      query = query.or(`tipoAplicacion.eq.${tipoAplicacion},tipoAplicacion.eq.todos`);
    }

    const { data: tags, error } = await query
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: tags || [] };
  } catch (error) {
    console.error('Error fetching client tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener las etiquetas de clientes'
    };
  }
} 