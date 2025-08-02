'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function deleteClient(id: number) {
  try {
    console.log('🗑️ deleteClient: Iniciando eliminación de cliente ID:', id);
    const supabase = await getSupabaseServerClient();
    console.log('🔍 deleteClient: Cliente Supabase obtenido');
    
    // Verificar si el cliente existe
    console.log('🔍 deleteClient: Verificando existencia del cliente...');
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      console.error('❌ deleteClient: Cliente no encontrado:', clientError);
      return {
        success: false,
        error: '❌ Cliente no encontrado'
      };
    }

    console.log('✅ deleteClient: Cliente encontrado:', client.nombrePrincipal || client.razonSocial || `ID: ${client.id}`);

    // Verificar si tiene ventas asociadas (product_sales_tracking)
    console.log('🔍 deleteClient: Verificando ventas asociadas...');
    const { data: sales, error: salesError } = await supabase
      .from('product_sales_tracking')
      .select('id')
      .not('customer_info', 'is', null)
      .contains('customer_info', { client_id: id });

    if (salesError) {
      console.error('❌ deleteClient: Error verificando ventas:', salesError);
      // No bloqueamos la eliminación por error en ventas, continuamos
      console.log('⚠️ deleteClient: Continuando sin verificar ventas...');
    }

    // Verificar si tiene reservas por email (reservations)
    console.log('🔍 deleteClient: Verificando reservas por email...');
    const { data: reservationsByEmail, error: reservationsEmailError } = await supabase
      .from('reservations')
      .select('id')
      .eq('guest_email', client.email);

    if (reservationsEmailError) {
      console.error('❌ deleteClient: Error verificando reservas por email:', reservationsEmailError);
      return {
        success: false,
        error: '❌ Error al verificar reservas asociadas'
      };
    }

    // Verificar si tiene reservas modulares (modular_reservations) - opcional
    console.log('🔍 deleteClient: Verificando reservas modulares...');
    let reservationsAsClient = [];
    try {
      const { data, error: reservationsClientError } = await supabase
        .from('modular_reservations')
        .select('id')
        .eq('client_id', id);

      if (reservationsClientError) {
        console.log('⚠️ deleteClient: Tabla modular_reservations no accesible, continuando...');
      } else {
        reservationsAsClient = data || [];
      }
    } catch (error) {
      console.log('⚠️ deleteClient: Error accediendo a modular_reservations (tabla puede no existir), continuando...');
    }

    console.log('📊 deleteClient: Resultado verificaciones:', { 
      sales: sales?.length || 0, 
      reservationsByEmail: reservationsByEmail?.length || 0,
      reservationsAsClient: reservationsAsClient?.length || 0
    });

    // Verificar si tiene ventas (opcional, no bloquea)
    if (sales && sales.length > 0) {
      console.warn('⚠️ deleteClient: Cliente tiene ventas asociadas:', sales.length, 'ventas - pero continuando...');
    }

    // Verificar si tiene reservas
    if ((reservationsByEmail && reservationsByEmail.length > 0) || 
        (reservationsAsClient && reservationsAsClient.length > 0)) {
      console.error('❌ deleteClient: Cliente tiene reservas asociadas:', {
        reservationsByEmail: reservationsByEmail?.length || 0,
        reservationsModular: reservationsAsClient?.length || 0
      });
      
      const totalReservas = (reservationsByEmail?.length || 0) + (reservationsAsClient?.length || 0);
      return {
        success: false,
        error: `❌ No se puede eliminar el cliente porque tiene ${totalReservas} reserva(s) asociada(s). Primero debe eliminar las reservas.`
      };
    }

    console.log('✅ deleteClient: Cliente sin dependencias, procediendo a eliminar...');
    
    // Eliminar el cliente (esto también eliminará contactos y etiquetas por CASCADE)
    const { error: deleteError } = await supabase
      .from('Client')
      .delete()
      .eq('id', id);

    console.log('📊 deleteClient: Resultado eliminación:', { deleteError });

    if (deleteError) {
      console.error('❌ deleteClient: Error al eliminar:', deleteError);
      return {
        success: false,
        error: '❌ Error al eliminar el cliente de la base de datos'
      };
    }

    console.log('✅ deleteClient: Cliente eliminado exitosamente');
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('💥 deleteClient: Error general:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar el cliente' 
    };
  }
}

export async function softDeleteClient(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: client, error } = await supabase
      .from('Client')
      .update({ estado: 'inactivo' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true, data: client };
  } catch (error) {
    console.error('Error soft deleting client:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al desactivar el cliente' 
    };
  }
}

export async function deleteClientContact(contactId: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('ClientContact')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client contact:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar el contacto' 
    };
  }
}

export async function removeClientTag(clienteId: number, etiquetaId: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('ClientTagAssignment')
      .delete()
      .eq('clienteId', clienteId)
      .eq('etiquetaId', etiquetaId);

    if (error) throw error;

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error removing client tag:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al quitar la etiqueta' 
    };
  }
} 