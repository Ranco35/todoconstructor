'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Interfaces
export interface Room {
  id: number;
  number: string;
  type: string;
  capacity: number;
  max_capacity: number;
  child_capacity?: number;
  floor?: number;
  building?: string;
  view_type?: string;
  bed_config: BedConfig[];
  extra_bed_available: boolean;
  extra_bed_price: number;
  wifi: boolean;
  minibar: boolean;
  balcony: boolean;
  jacuzzi: boolean;
  amenities?: string;
  price_per_night: number;
  price_low_season?: number;
  price_mid_season?: number;
  price_high_season?: number;
  room_status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  is_active: boolean;
  created_at: string;
}

export interface BedConfig {
  type: 'individual' | 'matrimonial' | 'queen' | 'king' | 'sofa_cama';
  quantity: number;
}

export interface CreateRoomData {
  number: string;
  type: string;
  capacity: number;
  max_capacity: number;
  child_capacity: number;
  floor: number;
  building: string;
  view_type: string;
  bed_config: BedConfig[];
  extra_bed_available: boolean;
  extra_bed_price: number;
  wifi: boolean;
  minibar: boolean;
  balcony: boolean;
  jacuzzi: boolean;
  amenities: string;
  price_per_night: number;
  price_low_season: number;
  price_mid_season: number;
  price_high_season: number;
}

// Obtener todas las habitaciones
export async function getRooms(page = 1, pageSize = 20, search = '') {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .order('number');

    if (search) {
      query = query.or(`number.ilike.%${search}%,type.ilike.%${search}%,building.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`Error al obtener habitaciones: ${error.message}`);
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      count: 0,
      totalPages: 0
    };
  }
}

// Obtener habitación por ID
export async function getRoomById(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener habitación: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Crear habitación
export async function createRoom(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();
    const bedConfigString = formData.get('bed_config') as string;
    let bedConfig: BedConfig[] = [];
    
    try {
      bedConfig = JSON.parse(bedConfigString);
    } catch {
      bedConfig = [{ type: 'matrimonial', quantity: 1 }];
    }

    const roomData = {
      number: formData.get('number') as string,
      type: formData.get('type') as string,
      capacity: parseInt(formData.get('capacity') as string),
      max_capacity: parseInt(formData.get('max_capacity') as string),
      child_capacity: parseInt(formData.get('child_capacity') as string) || 0,
      floor: parseInt(formData.get('floor') as string) || 1,
      building: formData.get('building') as string || 'Modulo 1',
      view_type: formData.get('view_type') as string || 'interior',
      bed_config: bedConfig,
      extra_bed_available: formData.get('extra_bed_available') === 'true',
      extra_bed_price: parseFloat(formData.get('extra_bed_price') as string) || 0,
      wifi: formData.get('wifi') === 'true',
      minibar: formData.get('minibar') === 'true',
      balcony: formData.get('balcony') === 'true',
      jacuzzi: formData.get('jacuzzi') === 'true',
      amenities: formData.get('amenities') as string || '',
      price_per_night: parseFloat(formData.get('price_per_night') as string),
      price_low_season: parseFloat(formData.get('price_low_season') as string) || 0,
      price_mid_season: parseFloat(formData.get('price_mid_season') as string) || 0,
      price_high_season: parseFloat(formData.get('price_high_season') as string) || 0,
      room_status: 'available' as const,
      is_active: true
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear habitación: ${error.message}`);
    }

    // Crear producto real automáticamente para la nueva habitación
    await createProductForRoom(data);

    // Revalidar caché para que se actualicen los precios en reservas
    revalidatePath('/dashboard/configuration/rooms');
    revalidatePath('/dashboard/reservations');

    // Sincronizar precios con productos modulares
    await syncRoomPricesWithModular();

    return { success: true, data };
  } catch (error) {
    console.error('Error creating room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Actualizar habitación
export async function updateRoom(id: number, formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();
    const bedConfigString = formData.get('bed_config') as string;
    let bedConfig: BedConfig[] = [];
    
    try {
      bedConfig = JSON.parse(bedConfigString);
    } catch {
      bedConfig = [{ type: 'matrimonial', quantity: 1 }];
    }

    const roomData = {
      number: formData.get('number') as string,
      type: formData.get('type') as string,
      capacity: parseInt(formData.get('capacity') as string),
      max_capacity: parseInt(formData.get('max_capacity') as string),
      child_capacity: parseInt(formData.get('child_capacity') as string) || 0,
      floor: parseInt(formData.get('floor') as string) || 1,
      building: formData.get('building') as string || 'Modulo 1',
      view_type: formData.get('view_type') as string || 'interior',
      bed_config: bedConfig,
      extra_bed_available: formData.get('extra_bed_available') === 'true',
      extra_bed_price: parseFloat(formData.get('extra_bed_price') as string) || 0,
      wifi: formData.get('wifi') === 'true',
      minibar: formData.get('minibar') === 'true',
      balcony: formData.get('balcony') === 'true',
      jacuzzi: formData.get('jacuzzi') === 'true',
      amenities: formData.get('amenities') as string || '',
      price_per_night: parseFloat(formData.get('price_per_night') as string),
      price_low_season: parseFloat(formData.get('price_low_season') as string) || 0,
      price_mid_season: parseFloat(formData.get('price_mid_season') as string) || 0,
      price_high_season: parseFloat(formData.get('price_high_season') as string) || 0,
      room_status: formData.get('room_status') as string || 'available'
    };

    const { data, error } = await supabase
      .from('rooms')
      .update(roomData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar habitación: ${error.message}`);
    }

    // Actualizar producto real si existe
    await updateProductForRoom(data);

    // Revalidar caché para que se actualicen los precios en reservas
    revalidatePath('/dashboard/configuration/rooms');
    revalidatePath('/dashboard/reservations');

    // Sincronizar precios con productos modulares
    await syncRoomPricesWithModular();

    return { success: true, data };
  } catch (error) {
    console.error('Error updating room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Eliminar producto real para una habitación
export async function deleteProductForRoom(roomNumber: string) {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Generar SKU para la habitación
    const roomNumberClean = roomNumber.toString().replace(/\s+/g, ''); // Eliminar espacios
    const sku = `HAB-${roomNumberClean.padStart(3, '0')}`;
    
    // Buscar el producto existente
    const { data: existingProduct, error: findError } = await supabase
      .from('Product')
      .select('id, name')
      .eq('sku', sku)
      .single();
    
    if (findError || !existingProduct) {
      console.log(`⚠️ No existe producto para eliminar para habitación ${roomNumber}`);
      return { success: true, message: 'No existe producto para eliminar' };
    }
    
    // Verificar si el producto está siendo usado en reservas o productos modulares
    const { data: modularUsage, error: modularError } = await supabase
      .from('products_modular')
      .select('id')
      .eq('original_id', existingProduct.id)
      .limit(1);
    
    if (modularError) {
      console.error(`❌ Error verificando uso en productos modulares:`, modularError.message);
    }
    
    if (modularUsage && modularUsage.length > 0) {
      console.log(`⚠️ Producto ${sku} está siendo usado en productos modulares, no se puede eliminar`);
      return { success: false, error: 'Producto está siendo usado en productos modulares' };
    }
    
    // Eliminar el producto real
    const { error: deleteError } = await supabase
      .from('Product')
      .delete()
      .eq('id', existingProduct.id);
    
    if (deleteError) {
      console.error(`❌ Error al eliminar producto para habitación ${roomNumber}:`, deleteError.message);
      return { success: false, error: deleteError.message };
    }
    
    console.log(`✅ Producto eliminado para habitación ${roomNumber} (SKU: ${sku})`);
    return { success: true, message: 'Producto eliminado correctamente', sku };
    
  } catch (error) {
    console.error(`❌ Error en deleteProductForRoom:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Eliminar habitación
export async function deleteRoom(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Primero obtener información de la habitación para eliminar el producto
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('number')
      .eq('id', id)
      .single();
    
    if (roomError) {
      throw new Error('Error al obtener información de la habitación');
    }
    
    // Verificar si hay reservas asociadas
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', id)
      .limit(1);

    if (reservationsError) {
      throw new Error('Error al verificar reservas asociadas');
    }

    if (reservations && reservations.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar la habitación porque tiene reservas asociadas'
      };
    }

    // Eliminar la habitación
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar habitación: ${error.message}`);
    }

    // Eliminar producto real automáticamente
    await deleteProductForRoom(roomData.number);

    // Revalidar caché para que se actualicen los precios en reservas
    revalidatePath('/dashboard/configuration/rooms');
    revalidatePath('/dashboard/reservations');

    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Cambiar estado de habitación
export async function updateRoomStatus(id: number, status: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('rooms')
      .update({ room_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }

    // Revalidar caché para que se actualicen los precios en reservas
    revalidatePath('/dashboard/configuration/rooms');
    revalidatePath('/dashboard/reservations');

    return { success: true, data };
  } catch (error) {
    console.error('Error updating room status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 

// Actualizar producto real para una habitación existente
export async function updateProductForRoom(roomData: any) {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Generar SKU para la habitación
    const roomNumber = roomData.number.toString().replace(/\s+/g, ''); // Eliminar espacios
    const sku = `HAB-${roomNumber.padStart(3, '0')}`;
    
    // Buscar el producto existente
    const { data: existingProduct, error: findError } = await supabase
      .from('Product')
      .select('id')
      .eq('sku', sku)
      .single();
    
    if (findError || !existingProduct) {
      console.log(`⚠️ No existe producto para habitación ${roomData.number}, creando uno nuevo...`);
      return await createProductForRoom(roomData);
    }
    
    // Crear nombre descriptivo actualizado
    const roomName = `Habitación ${roomData.number} - ${roomData.type}`;
    
    // Crear descripción basada en características actualizadas
    const amenities = [];
    if (roomData.wifi) amenities.push('WiFi');
    if (roomData.minibar) amenities.push('Minibar');
    if (roomData.balcony) amenities.push('Balcón');
    if (roomData.jacuzzi) amenities.push('Jacuzzi');
    
    const description = `Habitación ${roomData.type} con capacidad para ${roomData.capacity} personas${amenities.length > 0 ? `, incluye: ${amenities.join(', ')}` : ''}`;
    
    // Obtener ID de la categoría "Sistema Reservas"
    const { data: systemCategory, error: categoryError } = await supabase
      .from('"Category"')
      .select('id')
      .eq('name', 'Sistema Reservas')
      .single();
    
    if (categoryError || !systemCategory) {
      console.error(`❌ Error obteniendo categoría "Sistema Reservas":`, categoryError?.message);
    }
    
    // Actualizar el producto real
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update({
        name: roomName,
        description: description,
        unit_price: roomData.price_per_night,
        unit_price_with_vat: roomData.price_per_night * 1.19, // IVA 19%
        category_id: systemCategory?.id || null
      })
      .eq('id', existingProduct.id)
      .select()
      .single();
    
    if (updateError) {
      console.error(`❌ Error al actualizar producto para habitación ${roomData.number}:`, updateError.message);
      return { success: false, error: updateError.message };
    }
    
    console.log(`✅ Producto actualizado para habitación ${roomData.number} (SKU: ${sku})`);
    return { success: true, data: updatedProduct, sku };
    
  } catch (error) {
    console.error(`❌ Error en updateProductForRoom:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Crear producto real automáticamente para una habitación
export async function createProductForRoom(roomData: any) {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Generar SKU único para la habitación
    const roomNumber = roomData.number.toString().replace(/\s+/g, ''); // Eliminar espacios
    const sku = `HAB-${roomNumber.padStart(3, '0')}`;
    
    // Crear nombre descriptivo
    const roomName = `Habitación ${roomData.number} - ${roomData.type}`;
    
    // Crear descripción basada en características
    const amenities = [];
    if (roomData.wifi) amenities.push('WiFi');
    if (roomData.minibar) amenities.push('Minibar');
    if (roomData.balcony) amenities.push('Balcón');
    if (roomData.jacuzzi) amenities.push('Jacuzzi');
    
    const description = `Habitación ${roomData.type} con capacidad para ${roomData.capacity} personas${amenities.length > 0 ? `, incluye: ${amenities.join(', ')}` : ''}`;
    
    // Verificar si ya existe un producto con este SKU
    const { data: existingProduct } = await supabase
      .from('Product')
      .select('id')
      .eq('sku', sku)
      .single();
    
    if (existingProduct) {
      console.log(`✅ Producto ya existe para habitación ${roomData.number} (SKU: ${sku})`);
      return { success: true, message: 'Producto ya existe', sku };
    }
    
    // Obtener ID de la categoría "Sistema Reservas"
    const { data: systemCategory, error: categoryError } = await supabase
      .from('"Category"')
      .select('id')
      .eq('name', 'Sistema Reservas')
      .single();
    
    if (categoryError || !systemCategory) {
      console.error(`❌ Error obteniendo categoría "Sistema Reservas":`, categoryError?.message);
      // Si no existe la categoría, crear el producto sin categoría por ahora
      console.log(`⚠️ Categoría "Sistema Reservas" no encontrada, creando producto sin categoría`);
    }
    
    // Crear el producto real
    const { data: newProduct, error: productError } = await supabase
      .from('Product')
      .insert([{
        sku: sku,
        name: roomName,
        description: description,
        type: 'SERVICIO',
        unit_price: roomData.price_per_night,
        unit_price_with_vat: roomData.price_per_night * 1.19, // IVA 19%
        vat: 19,
        vat_included: true,
        category_id: systemCategory?.id || null
      }])
      .select()
      .single();
    
    if (productError) {
      console.error(`❌ Error al crear producto para habitación ${roomData.number}:`, productError.message);
      return { success: false, error: productError.message };
    }
    
    console.log(`✅ Producto creado automáticamente para habitación ${roomData.number} (SKU: ${sku})`);
    return { success: true, data: newProduct, sku };
    
  } catch (error) {
    console.error(`❌ Error en createProductForRoom:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Sincronizar precios de habitaciones con productos modulares (solo si hay producto real)
export async function syncRoomPricesWithModular() {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener todas las habitaciones activas
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, number, type, price_per_night, is_active')
      .eq('is_active', true);

    if (roomsError) {
      console.error('❌ Error al obtener habitaciones:', roomsError.message);
      return { success: false, message: 'Error al obtener habitaciones', error: roomsError.message };
    }

    if (!rooms || rooms.length === 0) {
      return { success: true, message: 'No hay habitaciones activas para sincronizar', updatedCount: 0, createdCount: 0, skippedCount: 0, skippedRooms: [] };
    }

    let updatedCount = 0;
    let createdCount = 0;
    let skippedRooms: string[] = [];

    for (const room of rooms) {
      try {
        // Buscar producto real asociado a la habitación (por SKU o nombre)
        const roomNumberClean = room.number.toString().replace(/\s+/g, ''); // Eliminar espacios
        const { data: realProducts, error: realProductError } = await supabase
          .from('Product')
          .select('id')
          .or(`sku.eq.HAB-${roomNumberClean.padStart(3, '0')},name.ilike.%${room.number}%`)
          .limit(1);

        if (realProductError) {
          console.error(`❌ Error consultando producto real para habitación ${room.number}:`, realProductError.message);
          skippedRooms.push(room.number);
          continue;
        }

        if (!realProducts || realProducts.length === 0) {
          console.warn(`⚠️ No existe producto real para habitación ${room.number}, omitiendo...`);
          skippedRooms.push(room.number);
          continue;
        }

        const realProductId = realProducts[0].id;

        // Obtener el precio final con IVA del producto real
        const { data: realProduct, error: realError } = await supabase
          .from('Product')
          .select('id, final_price_with_vat')
          .eq('id', realProductId)
          .single();

        if (realError || !realProduct) {
          console.warn(`⚠️ Error obteniendo precio final para habitación ${room.number}:`, realError?.message);
          skippedRooms.push(room.number);
          continue;
        }

        if (realProduct.final_price_with_vat == null) {
          console.warn(`⚠️ Precio final es null para habitación ${room.number}`);
          skippedRooms.push(room.number);
          continue;
        }

        // Buscar producto modular para la habitación
        const { data: modularProduct, error: modularProductError } = await supabase
          .from('products_modular')
          .select('id, price')
          .eq('code', `habitacion_${room.number}`)
          .single();

        if (modularProductError || !modularProduct) {
          console.warn(`⚠️ No existe producto modular para habitación ${room.number}:`, modularProductError?.message);
          skippedRooms.push(room.number);
          continue;
        }

        const finalPrice = Number(realProduct.final_price_with_vat);
        // Solo actualizar si el precio es diferente
        if (modularProduct.price !== finalPrice) {
          const { error: updateError } = await supabase
            .from('products_modular')
            .update({ price: finalPrice })
            .eq('id', modularProduct.id);
          
          if (updateError) {
            console.error(`❌ Error actualizando precio modular para habitación ${room.number}:`, updateError.message);
            skippedRooms.push(room.number);
          } else {
            updatedCount++;
            console.log(`✅ Precio actualizado para habitación ${room.number}: ${modularProduct.price} → ${finalPrice}`);
          }
        }
      } catch (roomError) {
        console.error(`❌ Error procesando habitación ${room.number}:`, roomError);
        skippedRooms.push(room.number);
      }
    }

    return {
      success: true,
      message: `Sincronización completada: ${createdCount} creados, ${updatedCount} actualizados, ${skippedRooms.length} omitidos`,
      updatedCount,
      createdCount,
      skippedCount: skippedRooms.length,
      skippedRooms
    };
  } catch (error) {
    console.error('❌ Error en syncRoomPricesWithModular:', error);
    return {
      success: false,
      message: 'Error general en sincronización',
      error: error instanceof Error ? error.message : 'Error desconocido',
      updatedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      skippedRooms: []
    };
  }
} 