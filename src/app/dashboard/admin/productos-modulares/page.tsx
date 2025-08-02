import { Suspense } from 'react';
import AdminModularPanel from '@/components/admin/AdminModularPanel';
import { syncRoomPricesWithModular } from '@/actions/configuration/room-actions';
import { syncModularProductsWithRealPrice } from '@/actions/products/modular-products';

export const dynamic = 'force-dynamic'

export default async function ProductosModularesPage() {
  let syncRoomsResult = null;
  let syncModularResult = null;
  let skippedRooms: string[] = [];
  let updatedCount = 0;
  let skippedCount = 0;
  let errors: string[] = [];

  // Intentar sincronizar precios de habitaciones (opcional)
  try {
    syncRoomsResult = await syncRoomPricesWithModular();
    skippedRooms = syncRoomsResult?.skippedRooms || [];
  } catch (error) {
    console.error('❌ Error en sincronización de habitaciones:', error);
    errors.push(`Error sincronizando habitaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  // Intentar sincronizar precios de productos modulares (opcional)
  try {
    syncModularResult = await syncModularProductsWithRealPrice();
    updatedCount = syncModularResult?.updatedCount || 0;
    skippedCount = syncModularResult?.skippedCount || 0;
    if (syncModularResult?.errors) {
      errors.push(...syncModularResult.errors);
    }
  } catch (error) {
    console.error('❌ Error en sincronización de productos modulares:', error);
    errors.push(`Error sincronizando productos modulares: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Advertencia de habitaciones no sincronizadas eliminada por obsoleta. */}
      {updatedCount > 0 && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          ✅ {updatedCount} productos modulares de comida/servicio actualizados automáticamente con precio final (IVA incluido).
        </div>
      )}
      {errors.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          ❌ Errores durante la sincronización automática:<br />
          <ul className="list-disc ml-6">
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
          <p className="mt-2 text-sm">La página continuará funcionando normalmente, pero algunos precios pueden no estar sincronizados.</p>
        </div>
      )}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando panel de administración...</p>
          </div>
        </div>
      }>
        <AdminModularPanel />
      </Suspense>
    </div>
  );
} 