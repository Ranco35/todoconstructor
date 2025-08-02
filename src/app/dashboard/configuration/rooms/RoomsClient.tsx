"use client";

import { useState } from "react";
import { getRooms, deleteRoom, syncRoomPricesWithModular, Room } from "@/actions/configuration/room-actions";
import RoomTable from "@/components/rooms/RoomTable";
import { Plus, Search, Bed, RefreshCw } from "lucide-react";
import Link from "next/link";

interface RoomsClientProps {
  initialRooms: Room[];
  initialTotalPages: number;
  initialPage: number;
  initialSearch: string;
}

export default function RoomsClient({ initialRooms, initialTotalPages, initialPage, initialSearch }: RoomsClientProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState(initialSearch);

  const loadRooms = async (page = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const result = await getRooms(page, 20, searchTerm);
      if (result.success) {
        setRooms(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
    loadRooms(1, e.target.value);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta habitación?")) {
      const result = await deleteRoom(id);
      if (result.success) {
        loadRooms(currentPage, search);
      } else {
        alert(result.error || "Error al eliminar habitación");
      }
    }
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const result = await syncRoomPricesWithModular();
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Recargar habitaciones para mostrar cambios
        loadRooms(currentPage, search);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      alert("Error al sincronizar precios");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bed className="w-6 h-6 text-blue-600" />
            Gestión de Habitaciones
          </h1>
          <p className="text-gray-600">Administra las habitaciones del hotel</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncPrices}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Precios'}
          </button>
          <Link
            href="/dashboard/configuration/rooms/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nueva Habitación
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por número, tipo o edificio..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando habitaciones...</span>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Bed className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay habitaciones</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera habitación.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/configuration/rooms/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Habitación
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <RoomTable
          rooms={rooms}
          onDelete={handleDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => loadRooms(page, search)}
        />
      )}
    </div>
  );
} 