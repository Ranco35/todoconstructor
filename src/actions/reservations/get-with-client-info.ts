'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createCompositeReservationId, calculateFinalAmount } from '@/utils/reservationUtils';

export interface ReservationWithClientInfo {
  // 🎯 NUEVO: ID COMPUESTO PRINCIPAL - Elimina confusión entre IDs
  compositeId: string;           // Formato: "R{reservationId}-M{modularId}"
  
  // 📊 IDs INDIVIDUALES (para compatibilidad y referencia)
  id: number;                    // ID principal (reservation_id) 
  modularId?: number;            // ID modular (para debugging/referencia)
  
  // 👤 DATOS DE CLIENTE Y RESERVA
  client_id: number;
  client_full_name: string;
  package_name: string;
  room_code: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  paid_amount: number;
  total_amount: number;
  created_at: string;
  room?: {
    number: string;
    type: string;
  };
  reservation_products?: Array<{
    id: number;
    reservation_id: number;
    product_id?: number;
    modular_product_id?: number;
    product_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    modular_product_name?: string;
    modular_product_description?: string;
    modular_product_category?: string;
    product?: {
      name: string;
      type: string;
    } | null;
  }>;
  
  // 🆕 NUEVOS CAMPOS PARA MÚLTIPLES HABITACIONES
  modular_reservations?: Array<{
    id: number;
    client_id: number;
    room_code: string;
    status: string;
    grand_total: number;
    final_price?: number;
    created_at: string;
    reservation_id: number;
    package_modular_id: number;
  }>;
  room_count?: number;           // Número de habitaciones
  guest_name?: string;           // Nombre del huésped
  guest_email?: string;          // Email del huésped  
  guest_phone?: string;          // Teléfono del huésped
  package_modular_name?: string; // Nombre del paquete modular
}

// ✅ FUNCIÓN BASE COMÚN - Elimina duplicación y garantiza consistencia
async function processReservationWithClientInfo(
  modularReservation: any,
  reservation: any | null,
  client: any | null,
  packageData: any | null,
  modularReservations?: any[],
  enrichedProducts?: any[]
): Promise<ReservationWithClientInfo> {
  
  // 💰 LÓGICA UNIFICADA DE CÁLCULO - Una sola fuente de verdad
  let finalTotalAmount = 0;
  
  if (reservation) {
    // ✅ USAR SIEMPRE total_amount de la reserva principal (es el campo oficial)
    finalTotalAmount = reservation.total_amount || 0;
    console.log(`[DEBUG] processReservationWithClientInfo - Using official total_amount for reservation ${modularReservation.reservation_id}: ${finalTotalAmount}`);
  } else {
    // 🔄 FALLBACK: Solo si no hay reserva principal, usar datos modulares
    if (modularReservations && modularReservations.length > 0) {
      finalTotalAmount = modularReservations.reduce((sum, modular) => {
        return sum + ((modular.final_price ?? modular.grand_total) || 0);
      }, 0);
    } else {
      finalTotalAmount = (modularReservation.final_price ?? modularReservation.grand_total) || 0;
    }
    console.log(`[DEBUG] processReservationWithClientInfo - Fallback to modular totals: ${finalTotalAmount}`);
  }

  // 🏠 LÓGICA UNIFICADA DE HABITACIONES
  let roomText = modularReservation.room_code;
  let roomCount = 1;
  
  if (modularReservations && modularReservations.length > 1) {
    const roomCodes = modularReservations.map(m => m.room_code).filter(Boolean);
    roomText = `${roomCodes.length} habitaciones: ${roomCodes.join(', ')}`;
    roomCount = roomCodes.length;
  }

  // 👤 LÓGICA UNIFICADA DE CLIENTE
  const clientFullName = client ? 
    `${client.nombrePrincipal || ''} ${client.apellido || ''}`.trim() : 
    'Cliente no encontrado';

  // 📦 LÓGICA UNIFICADA DE PAQUETE
  const packageName = packageData?.name || 'Sin Programa';

  // ✅ RETORNO UNIFICADO - Mismo formato garantizado
  return {
    // 🎯 ID COMPUESTO PRINCIPAL
    compositeId: createCompositeReservationId(modularReservation.reservation_id, modularReservation.id),
    
    // 📊 IDs INDIVIDUALES
    id: modularReservation.reservation_id,
    modularId: modularReservation.id,
    
    // 👤 DATOS DE CLIENTE Y RESERVA
    client_id: modularReservation.client_id,
    client_full_name: clientFullName,
    package_name: packageName,
    room_code: roomText,
    check_in: reservation?.check_in || '',
    check_out: reservation?.check_out || '',
    status: modularReservation.status,
    payment_status: reservation?.payment_status || 'no_payment',
    paid_amount: reservation?.paid_amount || 0,
    total_amount: finalTotalAmount, // 💰 Valor calculado de forma consistente
    created_at: modularReservation.created_at,
    room: undefined,
    
    // 🆕 DATOS ADICIONALES (solo para función ById)
    reservation_products: enrichedProducts,
    modular_reservations: modularReservations,
    room_count: roomCount,
    guest_name: clientFullName,
    guest_email: '',
    guest_phone: '',
    package_modular_name: packageName
  };
}

export async function getReservationsWithClientInfo(): Promise<ReservationWithClientInfo[]> {
  try {
    console.log('[DEBUG] Starting getReservationsWithClientInfo...');
    const supabase = await getSupabaseServerClient();
    
    console.log('[DEBUG] Executing queries for both modular and traditional reservations...');
    
    // 1️⃣ Obtener reservas modulares (múltiples habitaciones)
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        client_id,
        room_code,
        status,
        grand_total,
        final_price,
        created_at,
        reservation_id,
        package_modular_id
      `)
      .order('created_at', { ascending: false });

    if (modularError) {
      console.error('Error fetching modular reservations:', modularError);
    }

    console.log('[DEBUG] Modular reservations data:', modularReservations);

    // 2️⃣ Obtener TODAS las reservas principales (incluye tradicionales)
    const { data: allMainReservations, error: allMainError } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        guest_name,
        check_in,
        check_out,
        status,
        payment_status,
        paid_amount,
        total_amount,
        created_at,
        room_id,
        discount_type,
        discount_value,
        discount_amount,
        surcharge_type,
        surcharge_value,
        surcharge_amount,
        room:rooms(number, type)
      `)
      .order('created_at', { ascending: false });

    if (allMainError) {
      console.error('Error fetching all main reservations:', allMainError);
      return [];
    }

    console.log('[DEBUG] All main reservations found:', allMainReservations?.length || 0);

    // 3️⃣ Crear mapas para organizar los datos
    const reservationsMap = new Map();
    allMainReservations?.forEach(r => {
      reservationsMap.set(r.id, r);
    });

    // 4️⃣ Identificar reservas tradicionales (sin entries modulares)
    const modularReservationIds = modularReservations?.map(mr => mr.reservation_id) || [];
    const traditionalReservations = allMainReservations?.filter(r => 
      !modularReservationIds.includes(r.id)
    ) || [];

    console.log('[DEBUG] Traditional reservations found:', traditionalReservations.length);
    console.log('[DEBUG] Modular reservation IDs:', modularReservationIds);
    console.log('[DEBUG] Traditional reservations include reservation 117?', 
      traditionalReservations.some(r => r.id === 117));

    // 5️⃣ Obtener información de clientes (tanto modulares como tradicionales)
    const modularClientIds = modularReservations?.map(mr => mr.client_id).filter(id => id) || [];
    const traditionalClientIds = traditionalReservations.map(r => r.client_id).filter(id => id);
    const allClientIds = [...new Set([...modularClientIds, ...traditionalClientIds])];
    
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido
      `)
      .in('id', allClientIds);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Crear un mapa de clientes por ID
    const clientsMap = new Map();
    clients?.forEach(c => {
      clientsMap.set(c.id, c);
    });

    // 6️⃣ Obtener información de paquetes (solo para reservas modulares)
    const packageIds = modularReservations?.map(mr => mr.package_modular_id).filter(id => id) || [];
    console.log('[DEBUG] Package IDs to fetch:', packageIds);
    
    const { data: packages, error: packagesError } = await supabase
      .from('packages_modular')
      .select(`
        id,
        name
      `)
      .in('id', packageIds);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    }

    console.log('[DEBUG] Packages data:', packages);

    // Crear un mapa de paquetes por ID
    const packagesMap = new Map();
    packages?.forEach(p => {
      packagesMap.set(p.id, p);
    });

    console.log('[DEBUG] Packages map:', Object.fromEntries(packagesMap));

    // 7️⃣ PROCESAR RESERVAS MODULARES
    const modularReservationsWithClientInfo: ReservationWithClientInfo[] = modularReservations ? await Promise.all(
      modularReservations.map(async (mr) => {
        const reservation = reservationsMap.get(mr.reservation_id);
        const client = clientsMap.get(mr.client_id);
        const packageData = packagesMap.get(mr.package_modular_id);

        console.log(`[DEBUG] Modular Reservation ${mr.id}: package_modular_id=${mr.package_modular_id}, packageData=`, packageData);

        // ✅ USAR FUNCIÓN BASE COMÚN
        return await processReservationWithClientInfo(
          mr,
          reservation,
          client,
          packageData
        );
      })
    ) : [];

    // 8️⃣ PROCESAR RESERVAS TRADICIONALES (como reserva 117)
    const traditionalReservationsWithClientInfo: ReservationWithClientInfo[] = await Promise.all(
      traditionalReservations.map(async (r) => {
        const client = clientsMap.get(r.client_id);
        
        console.log(`[DEBUG] Traditional Reservation ${r.id}: guest_name=${r.guest_name}, status=${r.status}`);

        // Crear un pseudo-modular record para usar la función base común
        const pseudoModular = {
          id: r.id, // Usar mismo ID para identificar como tradicional
          reservation_id: r.id,
          client_id: r.client_id,
          room_code: r.room?.number ? `habitacion_${r.room.number}` : 'Habitación no especificada',
          status: r.status,
          grand_total: r.total_amount,
          final_price: r.total_amount,
          created_at: r.created_at,
          package_modular_id: null
        };

        // ✅ USAR FUNCIÓN BASE COMÚN
        return await processReservationWithClientInfo(
          pseudoModular,
          r, // La reserva principal ES la misma
          client,
          { name: 'Reserva Tradicional' } // Paquete por defecto
        );
      })
    );

    // 9️⃣ COMBINAR AMBOS TIPOS DE RESERVAS
    const allReservationsWithClientInfo = [
      ...modularReservationsWithClientInfo,
      ...traditionalReservationsWithClientInfo
    ];

    console.log('[DEBUG] Final mapped reservations:');
    console.log(`[DEBUG] - Modular: ${modularReservationsWithClientInfo.length}`);
    console.log(`[DEBUG] - Traditional: ${traditionalReservationsWithClientInfo.length}`);
    console.log(`[DEBUG] - Total: ${allReservationsWithClientInfo.length}`);
    console.log(`[DEBUG] - Includes reservation 117?: ${allReservationsWithClientInfo.some(r => r.id === 117)}`);

    // 🏨 MÚLTIPLES HABITACIONES: NO eliminar duplicados porque cada habitación debe aparecer
    // Cada registro modular representa una habitación diferente y debe mostrarse en el calendario
    // Los compositeId únicos (R{id}-M{modularId}) evitan confusión entre registros
    
    console.log('[DEBUG] Supporting both modular and traditional reservations');

    return allReservationsWithClientInfo;
  } catch (error) {
    console.error('Error in getReservationsWithClientInfo:', error);
    return [];
  }
}

export async function getReservationWithClientInfoById(id: number): Promise<ReservationWithClientInfo | null> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener TODAS las reservas modulares para esta reserva - 🎯 MÚLTIPLES HABITACIONES
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        client_id,
        room_code,
        status,
        grand_total,
        final_price,
        created_at,
        reservation_id,
        package_modular_id
      `)
      .eq('reservation_id', id);

    if (modularError || !modularReservations || modularReservations.length === 0) {
      console.error('Error fetching modular reservations:', modularError);
      return null;
    }

    // Tomar la primera reserva modular como referencia principal
    const primaryModularReservation = modularReservations[0];

    // Obtener la reserva principal con campos de descuento
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        payment_status,
        paid_amount,
        total_amount,
        discount_type,
        discount_value,
        discount_amount,
        surcharge_type,
        surcharge_value,
        surcharge_amount
      `)
      .eq('id', primaryModularReservation.reservation_id)
      .single();

    if (reservationError) {
      console.error('Error fetching reservation:', reservationError);
    }

    // Obtener productos de la reserva
    const { data: reservationProducts, error: productsError } = await supabase
      .from('reservation_products')
      .select(`
        id,
        reservation_id,
        product_id,
        modular_product_id,
        product_type,
        quantity,
        unit_price,
        total_price
      `)
      .eq('reservation_id', primaryModularReservation.reservation_id);

    if (productsError) {
      console.error('Error fetching reservation products:', productsError);
    }

    // Enriquecer productos con información de productos modulares
    const enrichedProducts = await Promise.all(
      (reservationProducts || []).map(async (product) => {
        if (product.product_type === 'modular_product' && product.modular_product_id) {
          // Obtener datos del producto modular
          const { data: modularProduct } = await supabase
            .from('products_modular')
            .select('name, description, category')
            .eq('id', product.modular_product_id)
            .single();
          
          return {
            ...product,
            modular_product_name: modularProduct?.name || null,
            modular_product_description: modularProduct?.description || null,
            modular_product_category: modularProduct?.category || null,
            product: {
              name: modularProduct?.name || 'Producto Modular',
              type: modularProduct?.category === 'alojamiento' ? 'HOSPEDAJE' : 'SERVICIO'
            }
          };
        } else if (product.product_id) {
          // Obtener datos del producto spa
          const { data: spaProduct } = await supabase
            .from('spa_products')
            .select('name, description, type')
            .eq('id', product.product_id)
            .single();
          
          return {
            ...product,
            product: spaProduct ? {
              name: spaProduct.name || 'Producto Spa',
              type: spaProduct.type || 'SERVICIO'
            } : null
          };
        }
        return product;
      })
    );

    // Obtener información del cliente
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select(`
        id,
        nombrePrincipal,
        apellido
      `)
      .eq('id', primaryModularReservation.client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
    }

    // Obtener información del paquete
    const { data: packageData, error: packageError } = await supabase
      .from('packages_modular')
      .select(`
        id,
        name
      `)
      .eq('id', primaryModularReservation.package_modular_id)
      .single();

    if (packageError) {
      console.error('Error fetching package:', packageError);
    }

    // ✅ USAR FUNCIÓN BASE COMÚN - Elimina duplicación
    return await processReservationWithClientInfo(
      primaryModularReservation,
      reservation,
      client,
      packageData,
      modularReservations,
      enrichedProducts
    );
    
  } catch (error) {
    console.error('Error in getReservationWithClientInfoById:', error);
    return null;
  }
} 