'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { CreateClientFormData } from '@/types/client';

export async function createClient(data: CreateClientFormData) {
  try {
    console.log('=== INICIO createClient ===');
    console.log('Data recibida:', JSON.stringify(data, null, 2));
    
    const { contactos, etiquetas, ...clientData } = data;

    console.log('Client data después de destructuring:', JSON.stringify(clientData, null, 2));
    console.log('Contactos:', JSON.stringify(contactos, null, 2));
    console.log('Etiquetas:', JSON.stringify(etiquetas, null, 2));

    // Limpiar campos de fecha vacíos
    if (clientData.fechaNacimiento === '') {
      clientData.fechaNacimiento = null;
      console.log('fechaNacimiento limpiada a null');
    }

    // Validaciones de campos requeridos según tipo de cliente
    if (clientData.tipoCliente === 'PERSONA') {
      if (!clientData.nombrePrincipal?.trim()) {
        console.log('Error: nombrePrincipal vacío para persona');
        return {
          success: false,
          error: 'El nombre principal es obligatorio para personas'
        };
      }
      if (!clientData.apellido?.trim()) {
        console.log('Error: apellido vacío para persona');
        return {
          success: false,
          error: 'El apellido es obligatorio para personas'
        };
      }
    } else if (clientData.tipoCliente === 'EMPRESA') {
      // Para empresas, requiere razón social O nombre principal
      if (!clientData.razonSocial?.trim() && !clientData.nombrePrincipal?.trim()) {
        console.log('Error: ni razonSocial ni nombrePrincipal para empresa');
        return {
          success: false,
          error: 'La razón social o el nombre principal es obligatorio para empresas'
        };
      }
      // Si no hay nombrePrincipal pero sí razonSocial, usar razonSocial como nombrePrincipal
      if (!clientData.nombrePrincipal?.trim() && clientData.razonSocial?.trim()) {
        clientData.nombrePrincipal = clientData.razonSocial;
        console.log('Usando razonSocial como nombrePrincipal:', clientData.nombrePrincipal);
      }
    }

    console.log('Validaciones básicas pasadas');

    // Obtener cliente de Supabase
    const supabase = await getSupabaseServerClient();

    // Validar RUT único si se proporciona
    if (clientData.rut?.trim()) {
      console.log('Validando RUT único:', clientData.rut);
      const { data: existingClients, error: rutError } = await supabase
        .from('Client')
        .select('id, rut, nombrePrincipal, razonSocial')
        .eq('rut', clientData.rut.trim());
      
      console.log('Resultado validación RUT:', { existingClients, rutError });
      
      if (rutError) {
        console.error('Error consultando RUT:', rutError);
        return {
          success: false,
          error: 'Error al validar RUT en base de datos'
        };
      }
      
      if (existingClients && existingClients.length > 0) {
        const existingClient = existingClients[0];
        const clientName = existingClient.razonSocial || existingClient.nombrePrincipal;
        console.log('Error: RUT ya existe para cliente:', clientName);
        return {
          success: false,
          error: `Ya existe un cliente con RUT ${clientData.rut}: ${clientName}`
        };
      }
    }

    // Validar email único si se proporciona
    if (clientData.email?.trim()) {
      console.log('Validando email único:', clientData.email);
      const { data: existingClients, error: emailError } = await supabase
        .from('Client')
        .select('id, email, nombrePrincipal, razonSocial')
        .eq('email', clientData.email.trim().toLowerCase());
      
      console.log('Resultado validación email:', { existingClients, emailError });
      
      if (emailError) {
        console.error('Error consultando email:', emailError);
        return {
          success: false,
          error: 'Error al validar email en base de datos'
        };
      }
      
      if (existingClients && existingClients.length > 0) {
        const existingClient = existingClients[0];
        const clientName = existingClient.razonSocial || existingClient.nombrePrincipal;
        console.log('Error: Email ya existe para cliente:', clientName);
        return {
          success: false,
          error: `Ya existe un cliente con email ${clientData.email}: ${clientName}`
        };
      }
    }

    console.log('Validaciones de unicidad pasadas');

    // Preparar datos para inserción - normalizar campos
    const insertData = {
      ...clientData,
      rut: (clientData.rut?.trim() && clientData.rut.trim() !== '') ? clientData.rut.trim() : null,
      email: clientData.email?.trim().toLowerCase() || null,
      nombrePrincipal: clientData.nombrePrincipal?.trim(),
      razonSocial: clientData.razonSocial?.trim() || null,
      apellido: clientData.tipoCliente === 'EMPRESA' ? null : (clientData.apellido?.trim() || null),
      estado: 'activo',
      esClienteFrecuente: false,
      totalCompras: 0,
      rankingCliente: 1,
      recibirNewsletter: clientData.recibirNewsletter || true,
      aceptaMarketing: clientData.aceptaMarketing || false,
      idioma: clientData.idioma || 'es'
    };

    console.log('Datos preparados para inserción:', JSON.stringify(insertData, null, 2));

    // Crear el cliente directamente (sin test de conexión previo)
    console.log('Intentando insertar cliente en BD...');
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(insertData)
      .select()
      .single();

    console.log('Resultado inserción cliente:', { client, clientError });

    if (clientError) {
      console.error('Error insertando cliente:', clientError);
      console.error('Código de error:', clientError.code);
      console.error('Detalles del error:', clientError.details);
      console.error('Hint del error:', clientError.hint);
      
      // Retornar error detallado
      return {
        success: false,
        error: `Error en base de datos: ${clientError.message} (Código: ${clientError.code})`
      };
    }

    if (!client) {
      console.error('Cliente insertado pero no se devolvió data');
      throw new Error('No se pudo crear el cliente');
    }

    console.log('Cliente creado exitosamente con ID:', client.id);

    // Verificar que realmente se insertó
    console.log('=== VERIFICANDO INSERCIÓN ===');
    const { data: verificacion, error: verifyError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', client.id)
      .single();
    
    console.log('Verificación - Cliente encontrado:', verificacion ? 'SÍ' : 'NO');
    console.log('Verificación - Error:', verifyError);

    // Crear contactos si existen
    if (contactos && contactos.length > 0) {
      console.log('Creando contactos...');
      const contactosValidos = contactos.filter(c => c.nombre?.trim());
      console.log('Contactos válidos:', contactosValidos.length);
      
      if (contactosValidos.length > 0) {
        const contactosData = contactosValidos.map(contacto => ({
          ...contacto,
          clienteId: client.id,
          esContactoPrincipal: contacto.esContactoPrincipal || false
        }));

        console.log('Datos de contactos para insertar:', JSON.stringify(contactosData, null, 2));

        const { error: contactosError } = await supabase
          .from('ClientContact')
          .insert(contactosData);

        if (contactosError) {
          console.error('Error creating contacts:', contactosError);
        } else {
          console.log('Contactos creados exitosamente');
        }
      }
    }

    // Crear etiquetas si existen
    if (etiquetas && etiquetas.length > 0) {
      console.log('Creando etiquetas...');
      const etiquetasData = etiquetas.map(etiquetaId => ({
        clienteId: client.id,
        etiquetaId: etiquetaId
      }));

      console.log('Datos de etiquetas para insertar:', JSON.stringify(etiquetasData, null, 2));

      const { error: etiquetasError } = await supabase
        .from('ClientTagAssignment')
        .insert(etiquetasData);

      if (etiquetasError) {
        console.error('Error creating tags:', etiquetasError);
      } else {
        console.log('Etiquetas creadas exitosamente');
      }
    }

    console.log('Revalidando path...');
    revalidatePath('/dashboard/customers');
    
    console.log('=== FIN createClient EXITOSO ===');
    return { success: true, data: client };
  } catch (error) {
    console.error('=== ERROR EN createClient ===');
    console.error('Error creating client:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error constructor:', error instanceof Error ? error.constructor.name : 'Unknown');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear el cliente'
    };
  }
} 