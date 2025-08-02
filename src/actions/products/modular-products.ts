'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// ═══════════════════════════════════════════════════════════════
// TIPOS DE DATOS
// ═══════════════════════════════════════════════════════════════

export interface ProductModular {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  per_person: boolean;
  is_active: boolean;
  sort_order: number;
  original_id?: number; // ID del producto original en la tabla Product
  sku?: string;
}

export interface PackageModular {
  id: number;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export interface PackageCalculation {
  package_code: string;
  room_code: string;
  adults: number;
  children_ages: number[];
  nights: number;
  additional_products?: string[];
}

export interface PriceResult {
  room_total: number;
  package_total: number;
  additional_total: number;
  grand_total: number;
  nights: number;
  daily_average: number;
  breakdown: Array<{
    code: string;
    name: string;
    category: string;
    total: number;
    adults_price: number;
    children_price: number;
    per_person: boolean;
    is_included: boolean;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// MAPEO DE CATEGORÍAS DE DB A CATEGORÍAS MODULARES
// ═══════════════════════════════════════════════════════════════

const CATEGORY_MAPPING = {
  // Categorías que mapean a alojamiento
  'alojamiento': ['Habitaciones', 'Alojamiento', 'Programas Alojamiento'],
  // Categorías que mapean a comida
  'comida': ['Alimentación', 'Restaurante', 'Comidas', 'Bebidas'],
  // Categorías que mapean a spa
  'spa': ['Spa', 'Tratamientos Spa', 'Masajes', 'Tratamientos Faciales', 'Circuitos Termales', 'Paquetes Spa'],
  // Categorías que mapean a entretenimiento
  'entretenimiento': ['Entretenimiento', 'Actividades', 'Recreación'],
  // Categorías que mapean a servicios
  'servicios': ['Servicios', 'Servicios Generales', 'Tecnología', 'Transporte']
};

function mapCategoryToModular(categoryName?: string): string {
  if (!categoryName) return 'servicios';
  const name = categoryName.toLowerCase();
  if (name.includes('alojamiento') || name.includes('habitacion') || name.includes('programa')) return 'alojamiento';
  if (name.includes('alimentacion') || name.includes('comida') || name.includes('bebida') || name.includes('restaurante')) return 'comida';
  if (name.includes('spa') || name.includes('masaje') || name.includes('tratamiento') || name.includes('termal')) return 'spa';
  if (name.includes('entretenimiento') || name.includes('actividad')) return 'entretenimiento';
  return 'servicios';
}

function generateProductCode(name: string, id: number): string {
  // Generar código único basado en el nombre y ID
  const cleanName = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  return `${cleanName}_${id}`;
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════

// FUNCIÓN DE PRUEBA TEMPORAL
export async function testProductsModular() {
  console.log('🧪 TEST: Función de prueba ejecutándose');
  
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('products_modular')
      .select('*');
      
    console.log('🧪 TEST: Resultado directo:', { data, error });
    
    return { data, error };
  } catch (err) {
    console.log('🧪 TEST: Error capturado:', err);
    return { data: null, error: err.message };
  }
}

export async function getProductsModular(category?: string) {
  console.log('🔍 INICIO getProductsModular - category:', category);
  
  try {
    console.log('⚙️ Obteniendo cliente Supabase...');
    
    // 🔥 VERSIÓN SUPER ROBUSTA - Manejo de errores mejorado
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('✅ Cliente Supabase obtenido');
    } catch (clientError: any) {
      console.error('❌ Error obteniendo cliente Supabase:', clientError);
      return { data: [], error: `Error de conexión: ${clientError.message || 'Cliente no disponible'}` };
    }

    // Verificar que el cliente esté disponible
    if (!supabase || typeof supabase.from !== 'function') {
      console.error('❌ Cliente Supabase no válido');
      return { data: [], error: 'Cliente Supabase no inicializado correctamente' };
    }

    // VERSIÓN ULTRA SIMPLE - Sin joins ni consultas complejas
    console.log('📊 Preparando consulta a products_modular...');
    
    let queryResult;
    try {
      queryResult = await Promise.race([
        supabase
          .from('products_modular')
          .select('*')
          .eq('is_active', true),
        // Timeout de 10 segundos para la consulta
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        )
      ]);
    } catch (queryError: any) {
      console.error('❌ Error en consulta con timeout:', queryError);
      return { data: [], error: `Error de consulta: ${queryError.message || 'Timeout'}` };
    }

    const { data: modularProducts, error } = queryResult as any;

    console.log('📝 Resultado consulta - data:', modularProducts, 'error:', error);

    if (error) {
      console.error('❌ Error en consulta Supabase:', error);
      return { data: [], error: `Error en base de datos: ${error.message}` };
    }

    if (!modularProducts || !Array.isArray(modularProducts)) {
      console.log('⚠️ No hay productos modulares o formato incorrecto');
      return { data: [], error: null };
    }

    console.log(`✅ Productos encontrados: ${modularProducts.length}`);

    // Filtrar por categoría si se especifica
    let filteredProducts = modularProducts;
    if (category) {
      filteredProducts = modularProducts.filter(p => p && p.category === category);
      console.log(`🔍 Filtrados por categoría '${category}': ${filteredProducts.length}`);
    }

    // Mapear a interface ProductModular con manejo de errores
    const products: ProductModular[] = [];
    for (const product of filteredProducts) {
      try {
        if (!product || typeof product !== 'object') {
          console.warn('⚠️ Producto inválido omitido:', product);
          continue;
        }
        
        console.log('🔄 Mapeando producto:', product.id, product.name);
        products.push({
          id: Number(product.id) || 0,
          code: String(product.code || ''),
          name: String(product.name || 'Producto sin nombre'),
          description: String(product.description || ''),
          price: Number(product.price) || 0,
          category: String(product.category || ''),
          per_person: Boolean(product.per_person),
          is_active: Boolean(product.is_active),
          sort_order: Number(product.sort_order) || 0,
          original_id: product.original_id ? Number(product.original_id) : undefined,
          sku: String(product.sku || '')
        });
      } catch (mapError: any) {
        console.error('❌ Error mapeando producto:', product, mapError);
        // Continuar con el siguiente producto
      }
    }

    console.log('✅ FINAL getProductsModular - productos procesados:', products.length);
    
    return { data: products, error: null };

  } catch (error) {
    console.error('💥 EXCEPCIÓN en getProductsModular:', error);
    console.error('💥 Stack trace:', error.stack);
    return { data: null, error: `Error inesperado: ${error.message}` };
  }
}

export async function getPackagesModular() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('packages_modular')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching packages:', error);
      return { data: null, error: 'Error al obtener paquetes' };
    }

    return { data, error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
}

export async function getPackagesWithProducts() {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener paquetes
    const { data: packages, error: packagesError } = await supabase
      .from('packages_modular')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return { data: null, error: 'Error al obtener paquetes' };
    }

    // Obtener vinculaciones usando package_products_modular
    const { data: linkages, error: linkagesError } = await supabase
      .from('package_products_modular')
      .select(`
        package_id,
        product_id,
        is_included
      `)
      .eq('is_included', true);

    if (linkagesError) {
      console.error('Error fetching linkages:', linkagesError);
      return { data: null, error: 'Error al obtener vinculaciones' };
    }

    // Agrupar vinculaciones por paquete
    const linkagesByPackage = (linkages || []).reduce((acc, linkage) => {
      if (!acc[linkage.package_id]) {
        acc[linkage.package_id] = [];
      }
      acc[linkage.package_id].push(linkage.product_id);
      return acc;
    }, {} as Record<number, number[]>);

    // Para cada paquete, obtener los códigos de productos vinculados
    const packagesWithProducts = await Promise.all(
      (packages || []).map(async (pkg) => {
        const productIds = linkagesByPackage[pkg.id] || [];
        const productCodes: string[] = [];

        if (productIds.length > 0) {
          // Buscar directamente en products_modular por ID
          const { data: modularProducts } = await supabase
            .from('products_modular')
            .select('code, id')
            .in('id', productIds);

          if (modularProducts && modularProducts.length > 0) {
            productCodes.push(...modularProducts.map(p => p.code));
          }
        }

        return {
          ...pkg,
          products: productCodes
        };
      })
    );

    return packagesWithProducts;

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
}

export async function getPackageProducts(packageCode: string) {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('package_products_modular')
      .select(`
        *,
        products_modular(*),
        packages_modular(*)
      `)
      .eq('packages_modular.code', packageCode)
      .eq('packages_modular.is_active', true)
      .eq('products_modular.is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching package products:', error);
      return { data: null, error: 'Error al obtener productos del paquete' };
    }

    return { data, error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
}

export async function calculatePackagePriceModular(calculation: PackageCalculation): Promise<{
  data: PriceResult | null;
  error: string | null;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .rpc('calculate_package_price_modular', {
        p_package_code: calculation.package_code,
        p_room_code: calculation.room_code,
        p_adults: calculation.adults,
        p_children_ages: calculation.children_ages,
        p_nights: calculation.nights,
        p_additional_products: calculation.additional_products || []
      });

    if (error) {
      console.error('Error calculating package price:', error);
      return { data: null, error: 'Error al calcular precio del paquete' };
    }

    return { data, error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
}

export async function createModularReservation(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();

    // Extraer datos del formulario
    const reservationData = {
      guest_name: formData.get('guest_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      check_in: formData.get('check_in') as string,
      check_out: formData.get('check_out') as string,
      adults: parseInt(formData.get('adults') as string),
      children: parseInt(formData.get('children') as string) || 0,
      children_ages: JSON.parse(formData.get('children_ages') as string || '[]'),
      package_code: formData.get('package_code') as string,
      room_code: formData.get('room_code') as string,
      additional_products: JSON.parse(formData.get('additional_products') as string || '[]'),
      client_id: formData.get('client_id') ? parseInt(formData.get('client_id') as string) : null,
      comments: formData.get('comments') as string,
      // Descuento
      discount_type: (formData.get('discount_type') as string) || 'none',
      discount_value: parseFloat(formData.get('discount_value') as string) || 0,
      discount_amount: parseFloat(formData.get('discount_amount') as string) || 0,
      discount_reason: (formData.get('discount_reason') as string) || '',
      // Recargo (surcharge)
      surcharge_type: (formData.get('surcharge_type') as string) || 'none',
      surcharge_value: parseFloat(formData.get('surcharge_value') as string) || 0,
      surcharge_amount: parseFloat(formData.get('surcharge_amount') as string) || 0,
      surcharge_reason: (formData.get('surcharge_reason') as string) || '',
      // NUEVO: Múltiples habitaciones
      selected_rooms: JSON.parse(formData.get('selected_rooms') as string || '[]')
    };

    console.log('🔍 Datos de reserva recibidos:', {
      guest_name: reservationData.guest_name,
      email: reservationData.email,
      check_in: reservationData.check_in,
      check_out: reservationData.check_out,
      client_id: reservationData.client_id,
      room_code: reservationData.room_code,
      package_code: reservationData.package_code
    });

    // Validaciones básicas
    if (!reservationData.guest_name || !reservationData.email || !reservationData.check_in || !reservationData.check_out) {
      return { success: false, error: 'Campos obligatorios faltantes' };
    }

    // Validación obligatoria del cliente principal
    if (!reservationData.client_id) {
      return { success: false, error: 'Debe seleccionar un cliente principal para la reserva' };
    }

    // Verificar que el cliente existe
    const { data: clientExists, error: clientError } = await supabase
      .from('Client')
              .select('id, nombrePrincipal, rut')
      .eq('id', reservationData.client_id)
      .single();

    if (clientError || !clientExists) {
      return { success: false, error: 'El cliente seleccionado no existe en la base de datos' };
    }

    // Calcular número de noches
    const checkInDate = new Date(reservationData.check_in);
    const checkOutDate = new Date(reservationData.check_out);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return { success: false, error: 'Las fechas de check-out deben ser posteriores al check-in' };
    }

    // Determinar habitaciones a procesar
    const roomsToProcess = reservationData.selected_rooms.length > 0 
      ? reservationData.selected_rooms 
      : [{ code: reservationData.room_code, number: reservationData.room_code.replace('habitacion_', ''), price: 0 }];

    console.log('🏨 Habitaciones a procesar:', roomsToProcess);

    // Calcular precio total - si hay múltiples habitaciones, sumar todos los precios
    let totalGrandTotal = 0;
    let allPricingData: any[] = [];
    
    for (const room of roomsToProcess) {
      const roomCode = room.code || room.number;
      
      // NUEVO: Usar pasajeros específicos de la habitación si están disponibles
      const roomAdults = room.adults ?? reservationData.adults;
      const roomChildrenAges = room.children_ages ?? reservationData.children_ages;
      
      console.log(`🏨 Procesando habitación ${roomCode}:`, {
        adults: roomAdults,
        children: roomChildrenAges.length,
        children_ages: roomChildrenAges
      });
      
      const { data: pricing, error: pricingError } = await calculatePackagePriceModular({
        package_code: reservationData.package_code,
        room_code: roomCode,
        adults: roomAdults,
        children_ages: roomChildrenAges,
        nights,
        additional_products: reservationData.additional_products
      });

      if (pricingError || !pricing) {
        console.error('Error en cálculo de precios para habitación:', roomCode, pricingError);
        return { success: false, error: pricingError || 'Error al calcular precios' };
      }

      totalGrandTotal += pricing.grand_total;
      allPricingData.push({ 
        room: room, 
        pricing: pricing,
        adults: roomAdults,
        children_ages: roomChildrenAges
      });
    }

    // Usar el pricing de la primera habitación como base (para compatibilidad)
    const basePricing = allPricingData[0]?.pricing;

    // Log de depuración: breakdown generado
    if (basePricing) {
      console.log('🧩 BREAKDOWN generado por calculatePackagePriceModular:', JSON.stringify(basePricing.breakdown, null, 2));
      console.log('🏨 Total combinado de habitaciones:', totalGrandTotal);
    }

    if (!basePricing) {
      console.error('Error: No se pudo calcular pricing para ninguna habitación');
      return { success: false, error: 'Error al calcular precios' };
    }

    // Calcular total final con descuento y recargo usando el total combinado
    let finalTotal = totalGrandTotal;
    let discountAmount = 0;
    let surchargeAmount = 0;
    
    // Calcular descuento - CORREGIDO para ser consistente
    if (reservationData.discount_type === 'percentage' && reservationData.discount_value > 0) {
      discountAmount = Math.round(totalGrandTotal * (reservationData.discount_value / 100));
    } else if (reservationData.discount_type === 'fixed_amount' && reservationData.discount_value > 0) {
      discountAmount = Math.min(reservationData.discount_value, totalGrandTotal);
    }
    
    // Calcular recargo - CORREGIDO para ser consistente
    if (reservationData.surcharge_type === 'percentage' && reservationData.surcharge_value > 0) {
      surchargeAmount = Math.round(totalGrandTotal * (reservationData.surcharge_value / 100));
    } else if (reservationData.surcharge_type === 'fixed_amount' && reservationData.surcharge_value > 0) {
      surchargeAmount = reservationData.surcharge_value;
    }
    
    // Aplicar descuento y recargo al total - CORREGIDO
    finalTotal = totalGrandTotal - discountAmount + surchargeAmount;

    // 🔍 LOGGING PARA DEBUG
    console.log('🧮 CÁLCULO DE DESCUENTOS:', {
      grand_total: totalGrandTotal,
      discount_type: reservationData.discount_type,
      discount_value: reservationData.discount_value,
      discount_amount: discountAmount,
      surcharge_type: reservationData.surcharge_type,
      surcharge_value: reservationData.surcharge_value,
      surcharge_amount: surchargeAmount,
      final_total: finalTotal,
      rooms_count: roomsToProcess.length
    });

    // Obtener ID del paquete
    const { data: packageData, error: packageError } = await supabase
      .from('packages_modular')
      .select('id')
      .eq('code', reservationData.package_code)
      .single();

    if (packageError || !packageData) {
      console.error('Error buscando paquete:', {
        packageError,
        packageData,
        package_code: reservationData.package_code
      });
      return { success: false, error: 'Paquete no encontrado' };
    }

    // Obtener IDs de todas las habitaciones
    const roomCodes = roomsToProcess.map(room => room.code || room.number);
    const { data: roomProducts, error: roomsError } = await supabase
      .from('products_modular')
      .select('id, code')
      .in('code', roomCodes)
      .eq('category', 'alojamiento');

    if (roomsError || !roomProducts || roomProducts.length === 0) {
      console.error('Error buscando habitaciones:', {
        roomsError,
        roomProducts,
        room_codes: roomCodes
      });
      return { success: false, error: 'Habitaciones no encontradas en productos modulares' };
    }

    console.log('🏨 Productos de habitación encontrados:', roomProducts);

    // Obtener el room_id real de la tabla rooms usando el room_code
    const { data: realRoom, error: realRoomError } = await supabase
      .from('rooms')
      .select('id, number')
      .eq('number', reservationData.room_code)
      .single();

    // Si no encuentra por nombre exacto, buscar por código similar o usar fallback
    let actualRoomId = realRoom?.id;
    if (!actualRoomId) {
      console.log(`⚠️ No se encontró habitación con nombre: ${reservationData.room_code}`);
      
                   // Mapear códigos del sistema modular a números de habitación reales
      let roomNumber = '';
      if (reservationData.room_code.startsWith('habitacion_')) {
        // Extraer el número/nombre de la habitación del código modular
        roomNumber = reservationData.room_code.replace('habitacion_', '');
        console.log(`✅ Extrayendo ${reservationData.room_code} → ${roomNumber}`);
        
        // Buscar por el número real de habitación
        const { data: mappedRoom } = await supabase
          .from('rooms')
          .select('id')
          .eq('number', roomNumber)
          .single();
        
        actualRoomId = mappedRoom?.id;
        console.log(`✅ Mapeado ${reservationData.room_code} → ${roomNumber} → ID: ${actualRoomId}`);
      }
      
      if (!actualRoomId) {
        // Como último fallback, usar la primera habitación disponible
        const { data: firstRoom } = await supabase
          .from('rooms')
          .select('id')
          .eq('status', 'available')
          .limit(1)
          .single();
        
        actualRoomId = firstRoom?.id || 1; // Usar room ID 1 como fallback final
      }
      
      console.log(`✅ Usando room_id: ${actualRoomId} para código: ${reservationData.room_code}`);
    }

    // Crear la reserva principal
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        guest_name: reservationData.guest_name,
        guest_email: reservationData.email,
        guest_phone: reservationData.phone,
        check_in: reservationData.check_in,
        check_out: reservationData.check_out,
        guests: reservationData.adults + reservationData.children, // Total de huéspedes
        room_id: actualRoomId, // Usar el room_id real, no el del producto modular
        client_id: reservationData.client_id, // Agregar el client_id
        client_type: 'individual',
        billing_name: clientExists.nombrePrincipal,
        billing_rut: clientExists.rut || 'N/A',
        billing_address: 'N/A', // Se puede mejorar con dirección del cliente
        authorized_by: 'Sistema',
        status: 'pending',
        total_amount: finalTotal, // Usar el total con descuento
        payment_status: 'no_payment',
        payment_method: 'pending',
        // Guardar info de descuento
        discount_type: reservationData.discount_type,
        discount_value: reservationData.discount_value,
        discount_amount: discountAmount,
        discount_reason: reservationData.discount_reason,
        // Guardar info de recargo
        surcharge_type: reservationData.surcharge_type,
        surcharge_value: reservationData.surcharge_value,
        surcharge_amount: surchargeAmount,
        surcharge_reason: reservationData.surcharge_reason
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      console.error('Reservation data:', {
        guest_name: reservationData.guest_name,
        check_in: reservationData.check_in,
        check_out: reservationData.check_out,
        actualRoomId,
        client_id: reservationData.client_id,
        total_amount: finalTotal
      });
      return { success: false, error: `Error al crear la reserva: ${reservationError.message}` };
    }

    // 🔒 OBTENER Y CONGELAR INFORMACIÓN DE TEMPORADA
    const { getSeasonForDate } = await import('@/actions/configuration/season-actions');
    const seasonResult = await getSeasonForDate(reservationData.check_in);
    const seasonInfo = seasonResult.success ? seasonResult.data : null;

    // Crear registros modulares - uno por cada habitación
    const modularReservationsData = [];
    
    for (let i = 0; i < allPricingData.length; i++) {
      const { room, pricing, adults, children_ages } = allPricingData[i];
      const roomCode = room.code || room.number;
      
      // NUEVO: Usar la información específica de pasajeros de cada habitación
      const roomAdults = adults;
      const roomChildrenAges = children_ages;
      const roomChildren = roomChildrenAges.length;
      
      // Buscar el product_modular_id para esta habitación
      const roomProduct = roomProducts.find(rp => rp.code === roomCode);
      if (!roomProduct) {
        console.error(`No se encontró producto modular para habitación: ${roomCode}`);
        // Si falla, eliminar la reserva principal
        await supabase.from('reservations').delete().eq('id', reservation.id);
        return { success: false, error: `Habitación ${roomCode} no encontrada en productos modulares` };
      }

      // Distribuir descuentos y recargos proporcionalmente entre habitaciones
      const roomGrandTotal = pricing.grand_total;
      const roomProportion = roomGrandTotal / totalGrandTotal;
      const roomDiscountAmount = Math.round(discountAmount * roomProportion);
      const roomSurchargeAmount = Math.round(surchargeAmount * roomProportion);
      const roomFinalTotal = roomGrandTotal - roomDiscountAmount + roomSurchargeAmount;

      modularReservationsData.push({
        reservation_id: reservation.id,
        adults: roomAdults, // NUEVO: Pasajeros específicos de esta habitación
        children: roomChildren, // NUEVO: Cantidad de niños específica
        children_ages: roomChildrenAges, // NUEVO: Edades específicas
        package_modular_id: packageData.id,
        room_code: roomCode,
        package_code: reservationData.package_code,
        additional_products: reservationData.additional_products,
        pricing_breakdown: pricing.breakdown,
        room_total: pricing.room_total || roomGrandTotal,
        package_total: pricing.package_total || 0,
        additional_total: pricing.additional_total || 0,
        grand_total: roomGrandTotal,
        nights: nights,
        daily_average: roomGrandTotal / nights,
        client_id: reservationData.client_id,
        comments: `${reservationData.comments} - Habitación ${room.number || roomCode} (${roomAdults} adultos, ${roomChildren} niños)`,
        status: 'active',
        // 🔒 INFORMACIÓN DE TEMPORADA CONGELADA
        season_name: seasonInfo?.name || null,
        season_type: seasonInfo?.season_type || null,
        seasonal_multiplier: seasonInfo?.discount_percentage || 0,
        base_price: roomGrandTotal,
        final_price: roomFinalTotal,
        // Guardar info de descuento (distribuido)
        discount_type: reservationData.discount_type,
        discount_value: reservationData.discount_value,
        discount_amount: roomDiscountAmount,
        discount_reason: reservationData.discount_reason,
        // Guardar info de recargo (distribuido)
        surcharge_type: reservationData.surcharge_type,
        surcharge_value: reservationData.surcharge_value,
        surcharge_amount: roomSurchargeAmount,
        surcharge_reason: reservationData.surcharge_reason
      });
    }

    console.log('🏨 Creando registros modulares para habitaciones:', modularReservationsData.length);
    
    // Insertar todos los registros modulares
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .insert(modularReservationsData)
      .select();

    if (modularError) {
      console.error('Error creating modular reservations:', modularError);
      console.error('Datos modular_reservations:', modularReservationsData);
      // Si falla la creación del registro modular, eliminamos la reserva principal
      await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation.id);
      return { success: false, error: `Error al crear los datos modulares: ${modularError.message}` };
    }

    console.log('✅ Registros modulares creados exitosamente:', modularReservations.length);

    // Guardar productos de la reserva en reservation_products
    if (basePricing && basePricing.breakdown && Array.isArray(basePricing.breakdown)) {
      // Obtener todos los productos modulares para mapear code -> id
      const { data: allProducts, error: allProductsError } = await supabase
        .from('products_modular')
        .select('id, code');
      if (allProductsError) {
        console.error('Error obteniendo productos modulares para mapping:', allProductsError);
      }
      // VALIDACIÓN: asegurar que todos los códigos del breakdown existen en products_modular
      const missingCodes = basePricing.breakdown
        .map(item => item.code)
        .filter(code => !allProducts?.some(p => p.code === code));
      if (missingCodes.length > 0) {
        return {
          success: false,
          error: `Faltan productos modulares en la base de datos: ${missingCodes.join(', ')}. Corrige la configuración antes de crear la reserva.`
        };
      }
      console.log('🟢 Breakdown para guardar en reservation_products:', basePricing.breakdown);
      console.log('🟢 Productos encontrados para mapping:', allProducts);
      const productsData = basePricing.breakdown.map(item => {
        const modularProduct = allProducts?.find(p => p.code === item.code);
        return {
          reservation_id: reservation.id,
          product_type: 'modular_product',
          modular_product_id: modularProduct?.id || null,
          product_id: null, // No usar para productos modulares
          quantity: 1, // Si tienes cantidad real, cámbiala aquí
          unit_price: item.total, // Si tienes unitario, cámbialo aquí
          total_price: item.total
        };
      }).filter(p => p.modular_product_id !== null);
      console.log('🟢 Datos a insertar en reservation_products:', productsData);
      if (productsData.length > 0) {
        const { error: productsError } = await supabase
          .from('reservation_products')
          .insert(productsData);
        if (productsError) {
          console.error('❌ Error al guardar productos de la reserva:', productsError);
        } else {
          console.log('✅ Productos insertados correctamente en reservation_products');
        }
      } else {
        console.warn('⚠️ No hay productos válidos para insertar en reservation_products');
      }
    }

    // Sincronizar el total final en reservations
    await supabase
      .from('reservations')
      .update({ total_amount: finalTotal })
      .eq('id', reservation.id);

    console.log('✅ Reserva modular creada exitosamente:', {
      reservation_id: reservation.id,
      modular_reservations_count: modularReservations.length,
      client_id: reservationData.client_id,
      total_amount: finalTotal
    });

    revalidatePath('/dashboard/reservations');
    return { 
      success: true, 
      data: {
        reservation,
        modularReservations,
        pricing: basePricing
      }
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Error inesperado al crear la reserva' };
  }
}

export async function getAgeMultipliers() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('age_pricing_modular')
      .select('*')
      .order('min_age', { ascending: true });

    if (error) {
      console.error('Error fetching age multipliers:', error);
      return { data: null, error: 'Error al obtener multiplicadores de edad' };
    }

    return { data, error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
}

// ═══════════════════════════════════════════════════════════════
// CRUD DE PRODUCTOS MODULARES (HÍBRIDOS)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// VINCULACIÓN DE PRODUCTOS REALES AL SISTEMA MODULAR
// ═══════════════════════════════════════════════════════════════

export async function linkRealProductToModular(productId: number, modularCategory: string) {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Verificar que el producto real existe
    const { data: realProduct, error: productError } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        description,
        saleprice,
        sku,
        Category:categoryid(name)
      `)
      .eq('id', productId)
      .single();

    if (productError || !realProduct) {
      return { success: false, error: 'El producto no existe en la base de datos principal' };
    }

    // 2. Verificar que no esté ya vinculado
    const { data: existingLink } = await supabase
      .from('products_modular')
      .select('id')
      .eq('original_id', productId)
      .single();

    if (existingLink) {
      return { success: false, error: 'Este producto ya está vinculado al sistema modular' };
    }

    // 3. Crear la vinculación en products_modular
    const code = generateProductCode(realProduct.name, realProduct.id);
    
    const { data: modularProduct, error: linkError } = await supabase
      .from('products_modular')
      .insert({
        code,
        name: realProduct.name,
        description: realProduct.description || '',
        price: Number(realProduct.saleprice || 0),
        category: modularCategory,
        per_person: modularCategory !== 'alojamiento', // Alojamiento no es por persona
        is_active: true,
        sort_order: 0,
        original_id: productId, // SIEMPRE vincular a producto real
        sku: realProduct.sku
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error linking product to modular:', linkError);
      return { success: false, error: 'Error al vincular producto al sistema modular' };
    }

    revalidatePath('/dashboard/admin/productos-modulares');
    return { success: true, data: modularProduct };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Función heredada mantenida para compatibilidad pero redirigida
export async function createProductModular(product: Omit<ProductModular, 'id'>) {
  // SOLO permitir si tiene original_id (producto real)
  if (!product.original_id) {
    return { 
      success: false, 
      error: 'Ya no se permiten productos modulares independientes. Debes vincular un producto existente de la base de datos principal.' 
    };
  }

  return await linkRealProductToModular(product.original_id, product.category);
}

export async function updateProductModular(id: number, product: Partial<ProductModular>) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verificar que el producto modular existe y tiene original_id
    const { data: modularProduct, error: checkError } = await supabase
      .from('products_modular')
      .select('id, original_id')
      .eq('id', id)
      .single();

    if (checkError || !modularProduct) {
      return { success: false, error: 'El producto modular no existe' };
    }

    if (!modularProduct.original_id) {
      return { success: false, error: 'Solo se pueden actualizar productos vinculados a productos reales' };
    }

    // Actualizar en la tabla modular (configuración específica del sistema modular)
    const modularUpdate: any = {};
    if (product.category !== undefined) modularUpdate.category = product.category;
    if (product.per_person !== undefined) modularUpdate.per_person = product.per_person;
    if (product.is_active !== undefined) modularUpdate.is_active = product.is_active;
    if (product.sort_order !== undefined) modularUpdate.sort_order = product.sort_order;

    // TAMBIÉN actualizar el producto real para mantener sincronización
    const realProductUpdate: any = {};
    if (product.name !== undefined) {
      realProductUpdate.name = product.name;
      modularUpdate.name = product.name;
    }
    if (product.description !== undefined) {
      realProductUpdate.description = product.description;
      modularUpdate.description = product.description;
    }
    if (product.price !== undefined) {
      realProductUpdate.saleprice = product.price;
      modularUpdate.price = product.price;
    }

    // Actualizar producto real si hay cambios
    if (Object.keys(realProductUpdate).length > 0) {
      const { error: realUpdateError } = await supabase
        .from('Product')
        .update(realProductUpdate)
        .eq('id', modularProduct.original_id);

      if (realUpdateError) {
        console.error('Error updating real product:', realUpdateError);
        return { success: false, error: 'Error al actualizar el producto real' };
      }
    }

    // Actualizar producto modular
    const { data: updatedProduct, error: modularUpdateError } = await supabase
      .from('products_modular')
      .update(modularUpdate)
      .eq('id', id)
      .select()
      .single();

    if (modularUpdateError) {
      console.error('Error updating modular product:', modularUpdateError);
      return { success: false, error: 'Error al actualizar producto modular' };
    }

    revalidatePath('/dashboard/admin/productos-modulares');
    revalidatePath('/dashboard/configuration/products'); // También revalidar productos generales
    
    return { success: true, data: updatedProduct };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function deleteProductModular(id: number) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verificar que el producto modular existe
    const { data: modularProduct, error: checkError } = await supabase
      .from('products_modular')
      .select('id, original_id, name')
      .eq('id', id)
      .single();

    if (checkError || !modularProduct) {
      return { success: false, error: 'El producto modular no existe' };
    }

    // Verificar si está en uso en algún paquete
    const { data: packageUsage, error: usageError } = await supabase
      .from('product_package_linkage')
      .select('id')
      .eq('product_id', modularProduct.original_id);

    if (usageError) {
      console.error('Error checking package usage:', usageError);
      return { success: false, error: 'Error al verificar uso en paquetes' };
    }

    if (packageUsage && packageUsage.length > 0) {
      return { 
        success: false, 
        error: `No se puede desvincular "${modularProduct.name}" porque está incluido en ${packageUsage.length} paquete(s). Primero remuévelo de todos los paquetes.` 
      };
    }

    // SOLO eliminar la vinculación en products_modular, NO el producto real
    const { error: deleteError } = await supabase
      .from('products_modular')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error unlinking modular product:', deleteError);
      return { success: false, error: 'Error al desvincular producto del sistema modular' };
    }

    revalidatePath('/dashboard/admin/productos-modulares');
    
    return { 
      success: true, 
      message: `Producto "${modularProduct.name}" desvinculado del sistema modular. El producto original permanece en la base de datos principal.` 
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE PAQUETES - FUNCIONES CORREGIDAS
// ═══════════════════════════════════════════════════════════════

export async function updatePackageProducts(packageId: number, productCodes: string[]) {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener productos modulares por códigos
    const { data: modularProducts, error: productsError } = await supabase
      .from('products_modular')
      .select('id, code, original_id')
      .in('code', productCodes);

    if (productsError) {
      console.error('Error fetching modular products:', productsError);
      return { success: false, error: 'Error al obtener productos modulares' };
    }

    // Usar la tabla correcta: package_products_modular
    // Eliminar vinculaciones existentes para este paquete
    await supabase
      .from('package_products_modular')
      .delete()
      .eq('package_id', packageId);

    // Agregar nuevas vinculaciones usando el ID del producto modular
    if (modularProducts && modularProducts.length > 0) {
      const packageLinkages = modularProducts.map((product, index) => ({
          package_id: packageId,
        product_id: product.id, // Usar el ID del producto modular
        is_included: true,
        sort_order: index + 1
        }));

      if (packageLinkages.length > 0) {
        const { error: insertError } = await supabase
          .from('package_products_modular')
          .insert(packageLinkages);

        if (insertError) {
          console.error('Error inserting package linkages:', insertError);
          return { success: false, error: 'Error al asociar productos al paquete' };
        }
      }
    }

    revalidatePath('/dashboard/admin/productos-modulares');
    return { success: true };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE MAPEO Y UTILIDADES
// ═══════════════════════════════════════════════════════════════

// 🏷️ Función para obtener o crear categoría según tipo modular
async function getCategoryIdForModular(modularCategory: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  
  // Mapeo de categorías modulares a nombres de categorías reales
  const categoryMapping = {
    'alojamiento': ['Programas Alojamiento', 'Alojamiento', 'Habitaciones'],
    'comida': ['Alimentación', 'Restaurante', 'Comidas', 'Bebidas'],
    'spa': ['Spa', 'Tratamientos Spa', 'Masajes', 'Circuitos Termales'],
    'entretenimiento': ['Entretenimiento', 'Actividades', 'Recreación'],
    'servicios': ['Servicios Generales', 'Servicios', 'Tecnología', 'Transporte']
  };

  const possibleNames = categoryMapping[modularCategory] || categoryMapping['servicios'];
  
  // Buscar si existe alguna de las categorías
  for (const categoryName of possibleNames) {
    const { data: existingCategory } = await supabase
      .from('Category')
      .select('id')
      .eq('name', categoryName)
      .single();
    
    if (existingCategory) {
      return existingCategory.id;
    }
  }

  // Si no existe, crear la categoría principal
  const mainCategoryName = possibleNames[0];
  const { data: newCategory, error } = await supabase
    .from('Category')
    .insert({ 
      name: mainCategoryName,
      description: `Categoría para productos de ${modularCategory}`
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating category:', error);
    // Fallback: usar una categoría genérica existente o crear "Servicios Generales"
    const { data: fallbackCategory } = await supabase
      .from('Category')
      .select('id')
      .limit(1)
      .single();
    
    if (fallbackCategory) {
      return fallbackCategory.id;
    }
    
    // Si no hay ninguna categoría, lanzar error
    throw new Error('No se pudo obtener o crear una categoría');
  }

  return newCategory.id;
} 

// ═══════════════════════════════════════════════════════════════
// BÚSQUEDA DE PRODUCTOS REALES PARA VINCULAR
// ═══════════════════════════════════════════════════════════════

export async function searchExistingProducts(searchTerm: string, category?: string) {
  try {
    const supabase = await getSupabaseServerClient();

    // Buscar productos reales que NO estén ya vinculados al sistema modular
    let query = supabase
      .from('Product')
      .select(`
        id,
        name,
        description,
        saleprice,
        sku,
        Category:categoryid(name)
      `)
      .not('saleprice', 'is', null)
      .gte('saleprice', 0);

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, sku.ilike.%${searchTerm}%`);
    }

    const { data: products, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error searching products:', error);
      return { data: null, error: 'Error al buscar productos' };
    }

    // Obtener IDs de productos ya vinculados
    const { data: linkedProducts } = await supabase
      .from('products_modular')
      .select('original_id')
      .not('original_id', 'is', null);

    const linkedIds = new Set((linkedProducts || []).map(p => p.original_id));

    // Filtrar productos que NO estén ya vinculados
    const availableProducts = (products || []).filter(product => {
      const modularCategory = mapCategoryToModular(product.Category?.name);
      const categoryMatches = !category || modularCategory === category;
      const notLinked = !linkedIds.has(product.id);
      
      return categoryMatches && notLinked;
    });

    // Convertir a formato de búsqueda
    const searchResults = availableProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.saleprice || 0),
      sku: product.sku,
      category: product.Category?.name,
      modularCategory: mapCategoryToModular(product.Category?.name)
    }));

    return { data: searchResults, error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: 'Error inesperado' };
  }
} 

/**
 * Sincroniza el precio de todos los productos modulares vinculados a un producto real,
 * calculando el precio final con IVA incluido (saleprice * (1 + vat/100))
 * y actualizando el campo price en products_modular.
 * Solo afecta productos modulares cuyo original_id apunte a un producto real.
 */
export async function syncModularProductsWithRealPrice() {
  const supabase = await getSupabaseServerClient();
  let updatedCount = 0;
  let skippedCount = 0;
  let errors: string[] = [];

  // 1. Obtener todos los productos modulares con original_id
  const { data: modularProducts, error: modularError } = await supabase
    .from('products_modular')
    .select('id, original_id, price')
    .not('original_id', 'is', null);

  if (modularError) {
    return { success: false, error: 'Error al obtener productos modulares', details: modularError.message };
  }

  if (!modularProducts || modularProducts.length === 0) {
    return { success: true, updatedCount: 0, skippedCount: 0, errors: [], message: 'No hay productos modulares vinculados a productos reales.' };
  }

  // 2. Para cada producto modular, buscar el producto real y usar el campo final_price_with_vat
  for (const modular of modularProducts) {
    const { data: realProduct, error: realError } = await supabase
      .from('Product')
      .select('id, final_price_with_vat')
      .eq('id', modular.original_id)
      .single();

    if (realError || !realProduct) {
      skippedCount++;
      errors.push(`No se encontró producto real para modular ID ${modular.id}`);
      continue;
    }

    if (realProduct.final_price_with_vat == null) {
      skippedCount++;
      errors.push(`Producto real ID ${realProduct.id} no tiene final_price_with_vat calculado.`);
      continue;
    }

    const finalPrice = Math.round(Number(realProduct.final_price_with_vat));
    if (modular.price !== finalPrice) {
      const { error: updateError } = await supabase
        .from('products_modular')
        .update({ price: finalPrice })
        .eq('id', modular.id);
      if (updateError) {
        errors.push(`Error actualizando modular ID ${modular.id}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }
  }

  return {
    success: true,
    updatedCount,
    skippedCount,
    errors,
    message: `Sincronización completada: ${updatedCount} actualizados, ${skippedCount} omitidos.`
  };
} 

export async function updateModularReservation(reservationId: number, formData: FormData): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Extraer datos del formulario
    const guestName = formData.get('guest_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const checkIn = formData.get('check_in') as string;
    const checkOut = formData.get('check_out') as string;
    const adults = parseInt(formData.get('adults') as string) || 2;
    const children = parseInt(formData.get('children') as string) || 0;
    const childrenAgesStr = formData.get('children_ages') as string;
    const packageCode = formData.get('package_code') as string;
    const rawRoomCode = formData.get('room_code') as string;
    const roomCode = rawRoomCode && rawRoomCode.startsWith('habitacion_') ? rawRoomCode.replace('habitacion_', '') : rawRoomCode;
    const additionalProductsStr = formData.get('additional_products') as string;
    const comments = formData.get('comments') as string;
    const clientId = formData.get('client_id') as string;

    // Validaciones básicas
    if (!guestName || !email || !checkIn || !checkOut) {
      return { success: false, error: "Faltan datos obligatorios" };
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return { success: false, error: "La fecha de check-out debe ser posterior al check-in" };
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Parsear arrays
    const childrenAges = childrenAgesStr ? JSON.parse(childrenAgesStr) : [];
    const additionalProducts = additionalProductsStr ? JSON.parse(additionalProductsStr) : [];

    // 🔒 VERIFICAR SI DEBE MANTENER PRECIOS CONGELADOS O RECALCULAR
    let finalPricing;
    let seasonInfo = null;
    
    // Si es una edición de datos básicos (no cambios de fecha/habitación/paquete), mantener precios congelados
    const { data: existingReservation } = await supabase
      .from('modular_reservations')
      .select('check_in, package_code, room_code, season_name, season_type, seasonal_multiplier, base_price, final_price, pricing_breakdown, discount_type, discount_value, discount_amount, surcharge_type, surcharge_value, surcharge_amount')
      .eq('id', reservationId)
      .single();

    const isSignificantChange = existingReservation && (
      existingReservation.check_in !== checkIn ||
      existingReservation.package_code !== packageCode ||
      existingReservation.room_code !== roomCode
    );

    if (!isSignificantChange && existingReservation) {
      // 🔒 MANTENER PRECIOS CONGELADOS pero respetar descuentos existentes
      finalPricing = {
        grand_total: existingReservation.final_price,
        breakdown: existingReservation.pricing_breakdown
      };
      seasonInfo = {
        name: existingReservation.season_name,
        season_type: existingReservation.season_type,
        discount_percentage: existingReservation.seasonal_multiplier
      };
    } else {
      // 🆕 RECALCULAR PRECIOS (cambio significativo)
      const pricingResult = await calculatePackagePriceModular({
        package_code: packageCode,
        room_code: roomCode,
        adults,
        children_ages: childrenAges,
        nights,
        additional_products: additionalProducts
      });

      if (!pricingResult.success || !pricingResult.data) {
        return { success: false, error: "Error al calcular precios" };
      }

      finalPricing = pricingResult.data;

      // Obtener información de temporada NUEVA
      const { getSeasonForDate } = await import('@/actions/configuration/season-actions');
      const seasonResult = await getSeasonForDate(checkIn);
      seasonInfo = seasonResult.success ? seasonResult.data : null;
    }

    // 🧮 CALCULAR DESCUENTOS Y RECARGOS SI EXISTEN
    let finalTotal = finalPricing.grand_total;
    let discountAmount = 0;
    let surchargeAmount = 0;

    // Obtener descuentos del formulario
    const discountType = formData.get('discount_type') as string;
    const discountValue = parseFloat(formData.get('discount_value') as string) || 0;
    const surchargeType = formData.get('surcharge_type') as string;
    const surchargeValue = parseFloat(formData.get('surcharge_value') as string) || 0;

    // Calcular descuento
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = Math.round(finalPricing.grand_total * (discountValue / 100));
    } else if (discountType === 'fixed_amount' && discountValue > 0) {
      discountAmount = Math.min(discountValue, finalPricing.grand_total);
    }

    // Calcular recargo
    if (surchargeType === 'percentage' && surchargeValue > 0) {
      surchargeAmount = Math.round(finalPricing.grand_total * (surchargeValue / 100));
    } else if (surchargeType === 'fixed_amount' && surchargeValue > 0) {
      surchargeAmount = surchargeValue;
    }

    // Aplicar descuento y recargo al total
    finalTotal = finalPricing.grand_total - discountAmount + surchargeAmount;

    // 🔍 LOGGING PARA DEBUG
    console.log('🧮 EDICIÓN - CÁLCULO DE DESCUENTOS:', {
      grand_total: finalPricing.grand_total,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      surcharge_type: surchargeType,
      surcharge_value: surchargeValue,
      surcharge_amount: surchargeAmount,
      final_total: finalTotal
    });

    // Actualizar en la base de datos
    const { data: updatedReservation, error: updateError } = await supabase
      .from('modular_reservations')
      .update({
        guest_name: guestName,
        guest_email: email,
        guest_phone: phone,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        children_ages: childrenAges,
        package_code: packageCode,
        room_code: roomCode,
        additional_products: additionalProducts,
        comments,
        client_id: clientId ? parseInt(clientId) : null,
        nights,
        // 🔒 USAR PRECIOS FINALES (congelados o recalculados)
        base_price: finalPricing.base_total || finalPricing.grand_total,
        seasonal_multiplier: seasonInfo?.discount_percentage || 0,
        final_price: finalTotal, // Actualizar el precio final con descuentos
        season_name: seasonInfo?.name || null,
        season_type: seasonInfo?.season_type || null,
        pricing_breakdown: finalPricing.breakdown,
        // 🧮 GUARDAR INFORMACIÓN DE DESCUENTOS Y RECARGOS
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        discount_reason: formData.get('discount_reason') as string || '',
        surcharge_type: surchargeType,
        surcharge_value: surchargeValue,
        surcharge_amount: surchargeAmount,
        surcharge_reason: formData.get('surcharge_reason') as string || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating modular reservation:', updateError);
      return { success: false, error: `Error al actualizar reserva: ${updateError.message}` };
    }

    // VALIDACIÓN: asegurar que todos los códigos del breakdown existen en products_modular
    if (finalPricing.breakdown && Array.isArray(finalPricing.breakdown)) {
      const { data: allProducts, error: allProductsError } = await supabase
        .from('products_modular')
        .select('id, code');
      if (allProductsError) {
        console.error('Error obteniendo productos modulares para mapping (edición):', allProductsError);
      }
      const missingCodes = finalPricing.breakdown
        .map(item => item.code)
        .filter(code => !allProducts?.some(p => p.code === code));
      if (missingCodes.length > 0) {
        return {
          success: false,
          error: `Faltan productos modulares en la base de datos: ${missingCodes.join(', ')}. Corrige la configuración antes de editar la reserva.`
        };
      }
    }

    // Sincronizar el total final en reservations tras edición
    if (updatedReservation && updatedReservation.reservation_id && updatedReservation.final_price) {
      await supabase
        .from('reservations')
        .update({ total_amount: updatedReservation.final_price })
        .eq('id', updatedReservation.reservation_id);
    }

    return { 
      success: true, 
      data: { 
        reservation: updatedReservation,
        pricing: finalPricing
      }
    };

  } catch (error) {
    console.error('Error in updateModularReservation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido al actualizar reserva" 
    };
  }
} 