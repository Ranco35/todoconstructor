'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { ReservationFilters, RoomFilters, SpaProductFilters } from '@/types/reservation';

export async function getReservations(filters?: ReservationFilters) {
  try {
    let query = (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.client_type) {
        query = query.eq('client_type', filters.client_type);
      }
      if (filters.check_in_from) {
        query = query.gte('check_in', filters.check_in_from);
      }
      if (filters.check_in_to) {
        query = query.lte('check_in', filters.check_in_to);
      }
      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id);
      }
      if (filters.company_id) {
        query = query.eq('company_id', filters.company_id);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener reservas: ${error.message}`);
    }

    // Enriquecer los datos de productos si es necesario
    if (data && data.length > 0) {
      const enrichedData = await Promise.all(
        data.map(async (reservation) => {
          if (reservation.reservation_products && reservation.reservation_products.length > 0) {
            const enrichedProducts = await Promise.all(
              reservation.reservation_products.map(async (product) => {
                if (product.product_type === 'spa_product' && product.product_id) {
                  // Obtener datos del producto spa
                  const { data: spaProduct } = await (await getSupabaseServerClient())
                    .from('spa_products')
                    .select('*')
                    .eq('id', product.product_id)
                    .single();
                  return { ...product, product_details: spaProduct };
                } else if (product.product_type === 'modular_product' && product.modular_product_id) {
                  // Obtener datos del producto modular
                  const { data: modularProduct } = await (await getSupabaseServerClient())
                    .from('products_modular')
                    .select('*')
                    .eq('id', product.modular_product_id)
                    .single();
                  return {
                    ...product,
                    modular_product_name: modularProduct?.name || null,
                    modular_product_description: modularProduct?.description || null,
                    modular_product_sku: modularProduct?.sku || null,
                    modular_product_category: modularProduct?.category || null,
                    product_details: modularProduct
                  };
                }
                return product;
              })
            );
            return {
              ...reservation,
              reservation_products: enrichedProducts
            };
          }
          return reservation;
        })
      );
      return enrichedData;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

// 🎯 NUEVA FUNCIÓN - Obtener reserva usando vista normalizada
export async function getReservationByIdNormalized(id: number, tipo: 'principal' | 'modular' = 'principal') {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Usar función SQL personalizada para obtener datos normalizados
    const { data: normalizedData, error: normalizedError } = await supabase
      .rpc('get_reserva_normalizada_by_id', { p_id: id, p_tipo: tipo });

    if (normalizedError) {
      console.error('Error getting normalized reservation:', normalizedError);
      throw new Error(`Error al obtener reserva normalizada: ${normalizedError.message}`);
    }

    if (!normalizedData || normalizedData.length === 0) {
      throw new Error('Reserva no encontrada');
    }

    const reservation = normalizedData[0];
    
    // Obtener datos adicionales (productos, pagos, etc.)
    const reservationId = reservation.reserva_id;
    
    const [productsResult, paymentsResult] = await Promise.all([
      supabase.from('reservation_products').select('*').eq('reservation_id', reservationId),
      supabase.from('reservation_payments').select('*').eq('reservation_id', reservationId)
    ]);

    // Mapear a formato esperado por el frontend
    return {
      id: reservation.reserva_id,
      id_reserva_modular: reservation.reserva_modular_id,
      estado_consistencia: reservation.estado_consistencia,
      guest_name: reservation.huesped_nombre,
      room_code: reservation.habitacion,
      package_code: reservation.paquete,
      status: reservation.estado,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      total_amount: reservation.monto_total,
      client_id: reservation.cliente_completo?.split(' ')[0], // Extraer ID si está en el nombre
      reservation_products: productsResult.data || [],
      payments: paymentsResult.data || []
    };
    
  } catch (error) {
    console.error('Error fetching normalized reservation:', error);
    return null;
  }
}

export async function getReservationById(id: number) {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*),
        reservation_payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener la reserva: ${error.message}`);
    }

    // Enriquecer los datos de productos y paquete si es necesario
    if (data) {
      // Enriquecer productos
      if (data.reservation_products && data.reservation_products.length > 0) {
      const enrichedProducts = await Promise.all(
        data.reservation_products.map(async (product) => {
          if (product.product_type === 'spa_product' && product.product_id) {
            // Obtener datos del producto spa
            const { data: spaProduct } = await (await getSupabaseServerClient())
              .from('spa_products')
              .select('*')
              .eq('id', product.product_id)
              .single();
            return { ...product, product_details: spaProduct };
          } else if (product.product_type === 'modular_product' && product.modular_product_id) {
            // Obtener datos del producto modular
            const { data: modularProduct } = await (await getSupabaseServerClient())
              .from('products_modular')
              .select('*')
              .eq('id', product.modular_product_id)
              .single();
            return {
              ...product,
              modular_product_name: modularProduct?.name || null,
              modular_product_description: modularProduct?.description || null,
              modular_product_sku: modularProduct?.sku || null,
              modular_product_category: modularProduct?.category || null,
              product_details: modularProduct
            };
          }
          return product;
        })
      );
        data.reservation_products = enrichedProducts;
      }

      // Enriquecer datos del paquete modular (modular_reservation es un array)
      if (data.modular_reservation && data.modular_reservation.length > 0) {
        const modularRes = data.modular_reservation[0]; // Tomar el primer elemento del array
        console.log('🔍 Buscando paquete ID:', modularRes.package_modular_id);
        
        if (modularRes.package_modular_id) {
          const { data: packageData, error: packageError } = await (await getSupabaseServerClient())
            .from('packages_modular')
            .select('*')
            .eq('id', modularRes.package_modular_id)
            .single();
          
          console.log('📦 Datos del paquete:', packageData);
          console.log('❌ Error del paquete:', packageError);
          
          if (packageData) {
            // Agregar datos del paquete al primer elemento del array
            data.modular_reservation[0].package_details = packageData;
            data.modular_reservation[0].package_name = packageData.name;
            console.log('✅ Nombre del paquete asignado:', packageData.name);
          }
        }
      } else {
        console.log('⚠️ No hay modular_reservation o está vacío');
        console.log('modular_reservation:', data.modular_reservation);
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }
}

// Alias for backward compatibility
export const getReservation = getReservationById;

export async function getRooms(filters?: RoomFilters) {
  try {
    let query = (await getSupabaseServerClient())
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('number');

    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.floor) {
        query = query.eq('floor', filters.floor);
      }
      if (filters.capacity) {
        query = query.eq('capacity', filters.capacity);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener habitaciones: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

export async function getSpaProducts(filters?: SpaProductFilters) {
  try {
    let query = (await getSupabaseServerClient())
      .from('spa_products')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener productos del spa: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching spa products:', error);
    return [];
  }
}

export async function getCompanies() {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
} 