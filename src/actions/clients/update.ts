'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { UpdateClientFormData } from '@/types/client';

export async function updateClient(data: UpdateClientFormData) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id, contactos, etiquetas, ...clientData } = data;

    // Limpiar campos de fecha vacíos
    if (clientData.fechaNacimiento === '') {
      clientData.fechaNacimiento = null;
    }

    // Validaciones de campos requeridos basadas en el tipo de cliente
    if (clientData.tipoCliente === 'PERSONA') {
      // Para personas, el nombre principal es obligatorio
      if (!clientData.nombrePrincipal?.trim()) {
        return {
          success: false,
          error: 'El nombre principal es obligatorio para personas'
        };
      }
      
      // Para personas, el apellido es obligatorio
      if (!clientData.apellido?.trim()) {
        return {
          success: false,
          error: 'El apellido es obligatorio para personas'
        };
      }
    } else if (clientData.tipoCliente === 'EMPRESA') {
      // Para empresas, la razón social es obligatoria
      if (!clientData.razonSocial?.trim()) {
        return {
          success: false,
          error: 'La razón social es obligatoria para empresas'
        };
      }
      
      // Para empresas, el nombre principal es opcional
      // Si no se proporciona, usar la razón social como nombre principal
      if (!clientData.nombrePrincipal?.trim()) {
        clientData.nombrePrincipal = clientData.razonSocial;
      }
    }

    // Validar que el cliente existe
    const { data: existingClient, error: checkError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingClient) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      };
    }

    // Validar RUT único si se proporciona
    if (clientData.rut?.trim() && clientData.rut.trim() !== existingClient.rut) {
      const { data: duplicateRuts, error: rutError } = await supabase
        .from('Client')
        .select('id, rut, nombrePrincipal, razonSocial')
        .eq('rut', clientData.rut.trim());
      
      if (rutError) {
        return {
          success: false,
          error: 'Error al validar RUT en base de datos'
        };
      }
      
      if (duplicateRuts && duplicateRuts.length > 0) {
        const duplicateClient = duplicateRuts[0];
        const clientName = duplicateClient.razonSocial || duplicateClient.nombrePrincipal;
        return {
          success: false,
          error: `Ya existe un cliente con RUT ${clientData.rut}: ${clientName}`
        };
      }
    }

    // Validar email único si se proporciona
    if (clientData.email?.trim() && clientData.email.trim().toLowerCase() !== existingClient.email?.toLowerCase()) {
      const { data: duplicateEmails, error: emailError } = await supabase
        .from('Client')
        .select('id, email, nombrePrincipal, razonSocial')
        .eq('email', clientData.email.trim().toLowerCase());
      
      if (emailError) {
        return {
          success: false,
          error: 'Error al validar email en base de datos'
        };
      }
      
      if (duplicateEmails && duplicateEmails.length > 0) {
        const duplicateClient = duplicateEmails[0];
        const clientName = duplicateClient.razonSocial || duplicateClient.nombrePrincipal;
        return {
          success: false,
          error: `Ya existe un cliente con email ${clientData.email}: ${clientName}`
        };
      }
    }

    // Normalizar datos antes de actualizar
    const normalizedData = {
      ...clientData,
      rut: clientData.rut?.trim() || null,
      email: clientData.email?.trim().toLowerCase() || null,
      nombrePrincipal: clientData.nombrePrincipal?.trim(),
      razonSocial: clientData.razonSocial?.trim() || null,
      apellido: clientData.tipoCliente === 'EMPRESA' ? null : (clientData.apellido?.trim() || null),
    };

    // Limpiar variantes incorrectas de fechaModificacion
    delete normalizedData['fechamodificacion'];
    delete normalizedData['Fecha Modificacion'];
    delete normalizedData['Fecha Modificación'];
    delete normalizedData['fechamodificación'];

    // Filtro estricto de campos válidos para la tabla Client
    const allowedFields = [
      'nombrePrincipal', 'apellido', 'tipoCliente', 'rut', 'email', 'telefono', 'telefonoMovil',
      'calle', 'calle2', 'ciudad', 'codigoPostal', 'region', 'paisId', 'sitioWeb', 'idioma',
      'zonaHoraria', 'imagen', 'comentarios', 'razonSocial', 'giro', 'numeroEmpleados',
      'facturacionAnual', 'sectorEconomicoId', 'fechaNacimiento', 'genero', 'profesion', 'titulo',
      'origenCliente', 'recibirNewsletter', 'aceptaMarketing', 'estado', 'fechaCreacion',
      'fechaModificacion', 'fechaUltimaCompra', 'totalCompras', 'rankingCliente', 'esClienteFrecuente'
    ];
    const filteredData = Object.fromEntries(
      Object.entries(normalizedData).filter(([key]) => allowedFields.includes(key))
    );

    // Actualizar el cliente
    const { data: client, error: updateError } = await supabase
      .from('Client')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Actualizar contactos
    if (contactos.length > 0) {
      // Eliminar contactos existentes
      await supabase
        .from('ClientContact')
        .delete()
        .eq('clienteId', id);

      // Crear nuevos contactos
      const contactosData = contactos.map(contacto => ({
        ...contacto,
        clienteId: id,
        esContactoPrincipal: contacto.esContactoPrincipal || false
      }));

      const { error: contactosError } = await supabase
        .from('ClientContact')
        .insert(contactosData);

      if (contactosError) {
        console.error('Error updating contacts:', contactosError);
      }
    }

    // Actualizar etiquetas
    if (etiquetas.length > 0) {
      // Eliminar etiquetas existentes
      await supabase
        .from('ClientTagAssignment')
        .delete()
        .eq('clienteId', id);

      // Crear nuevas etiquetas
      const etiquetasData = etiquetas.map(etiquetaId => ({
        clienteId: id,
        etiquetaId: etiquetaId
      }));

      const { error: etiquetasError } = await supabase
        .from('ClientTagAssignment')
        .insert(etiquetasData);

      if (etiquetasError) {
        console.error('Error updating tags:', etiquetasError);
      }
    }

    revalidatePath('/dashboard/customers');
    return { success: true, data: client };
  } catch (error) {
    console.error('Error updating client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el cliente'
    };
  }
}

export async function updateClientStatus(id: number, estado: 'activo' | 'inactivo') {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: client, error } = await supabase
      .from('Client')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: client };
  } catch (error) {
    console.error('Error updating client status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el estado del cliente'
    };
  }
}

export async function updateClientFrequent(id: number, esClienteFrecuente: boolean) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: client, error } = await supabase
      .from('Client')
      .update({ esClienteFrecuente })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: client };
  } catch (error) {
    console.error('Error updating client frequent status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el estado frecuente del cliente'
    };
  }
}

export async function updateClientRanking(id: number, rankingCliente: number) {
  try {
    const supabase = await getSupabaseServerClient();
    if (rankingCliente < 0 || rankingCliente > 5) {
      return {
        success: false,
        error: 'El ranking debe estar entre 0 y 5'
      };
    }

    const { data: client, error } = await supabase
      .from('Client')
      .update({ rankingCliente })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: client };
  } catch (error) {
    console.error('Error updating client ranking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el ranking del cliente'
    };
  }
} 