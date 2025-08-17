import { useState, useEffect } from 'react';
import { getRooms, deleteRoom, Room } from '@/actions/configuration/room-actions';
import RoomTable from '@/components/rooms/RoomTable';
import { Plus, Search, Bed } from 'lucide-react';
import Link from 'next/link';
import RoomsClient from './RoomsClient';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  // Cargar habitaciones en el server
  const result = await getRooms(1, 20, '');
  const rooms = result.success ? result.data : [];
  const totalPages = result.success ? result.totalPages : 0;

  // Verificar si hay productos de habitaciones sin categoría 'Sistema Reservas'
  const supabase = await getSupabaseServerClient();
  const { data: habitacionesSinCategoria } = await supabase
    .from('Product')
    .select('id, sku, name')
    .like('sku', 'HAB-%')
    .or('categoryid.is.null,categoryid.neq.(SELECT id FROM "Category" WHERE name = \'Sistema Reservas\')');

  return (
    <div>
      {/* Alerta visual si hay habitaciones sin categoría */}
      {habitacionesSinCategoria && habitacionesSinCategoria.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <b>⚠️ Atención:</b> Hay habitaciones creadas por el sistema que <b>no tienen la categoría protegida "Sistema Reservas"</b>.<br />
          Esto puede causar problemas en la gestión y reservas.<br />
          <b>Habitaciones afectadas:</b> {habitacionesSinCategoria.map(h => h.name).join(', ')}<br />
          <b>Solución recomendada:</b> Ejecuta el siguiente script en Supabase SQL Editor:<br />
          <pre className="bg-gray-200 p-2 rounded mt-2 text-xs overflow-x-auto">{`UPDATE "Product"
SET categoryid = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas')
WHERE sku LIKE 'HAB-%';`}</pre>
          Si la categoría no existe, créala primero:<br />
          <pre className="bg-gray-200 p-2 rounded mt-2 text-xs overflow-x-auto">{`INSERT INTO "Category" (name, description, "createdAt", "updatedAt")
VALUES ('Sistema Reservas', 'Categoría protegida para productos de habitaciones del sistema de reservas', NOW(), NOW());`}</pre>
        </div>
      )}
      <RoomsClient
        initialRooms={rooms}
        initialTotalPages={totalPages}
        initialPage={1}
        initialSearch={''}
      />
    </div>
  );
} 