import React from 'react';
import { deleteInventoryAction, getInventories } from "@/actions/configuration/inventory-actions"
import { ColumnDef, Table } from "@/components/shared/Table"
import PaginationControls from '@/components/shared/PaginationControls'
import { PaginationParams } from "@/interface/actions"
import Link from "next/link"
import InventoryRowActions from "@/components/inventory/InventoryRowActions"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// Definir el tipo Inventory localmente
interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<PaginationParams>
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams

  const { page = '1', pageSize = '10' } = searchParams || {};

  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));

  const { data: inventories, totalCount } = await getInventories({ page: currentPage, pageSize: currentPageSize })

  const totalPages = Math.ceil(totalCount / currentPageSize);

  // Función wrapper para deleteInventoryAction
  const handleDeleteInventory = async (id: number) => {
    const formData = new FormData();
    formData.append('id', id.toString());
    await deleteInventoryAction(formData);
  };

  // Definición de columnas para la tabla de inventarios
  const InventoryColumns: ColumnDef<Inventory>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Total de artículos', accessorKey: 'totalItems' },
    { header: 'Última fecha y hora de actualización', accessorKey: 'lastUpdated' },
    { header: 'Centro de costos', accessorKey: 'Cost_CenterId' },
    { header: 'Bodega', accessorKey: 'warehouseId' },
    {
      header: 'Acciones',
      cell: (row) => (
        <InventoryRowActions 
          inventoryId={row.id} 
          deleteAction={handleDeleteInventory}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header con título */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Gestión de inventarios</h1>
          
          {/* Botones de acción directos */}
          <div className="flex flex-wrap gap-2 lg:gap-3 mb-4">
            <button className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
              <span>⚖️</span> 
              <span className="hidden sm:inline">Agregar ajuste al inventario</span>
              <span className="sm:hidden">Ajuste</span>
            </button>
            
            <button className="bg-orange-600 text-white px-3 lg:px-4 py-2 rounded text-sm hover:bg-orange-700 flex items-center gap-2">
              <span>🔄</span> 
              <span className="hidden sm:inline">Mover producto</span>
              <span className="sm:hidden">Mover</span>
            </button>
            
            <button className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
              <span>+</span> 
              <span className="hidden sm:inline">Agregar producto</span>
              <span className="sm:hidden">Producto</span>
            </button>
            
            <button className="bg-purple-600 text-white px-3 lg:px-4 py-2 rounded text-sm hover:bg-purple-700 flex items-center gap-2">
              <span>📥</span> 
              <span className="hidden sm:inline">Importar inventario</span>
              <span className="sm:hidden">Importar</span>
            </button>
            
            <Link href="/configuration/inventory/warehouses">
              <button className="bg-indigo-600 text-white px-3 lg:px-4 py-2 rounded text-sm hover:bg-indigo-700 flex items-center gap-2">
                <span>🏭</span> 
                <span className="hidden sm:inline">Gestionar bodegas</span>
                <span className="sm:hidden">Bodegas</span>
              </button>
            </Link>
          </div>
        </div>

        <Table<Inventory>
          data={inventories}
          columns={InventoryColumns}
          rowKey="id"
        />

        {/* Paginación usando el componente oficial */}
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={Array.isArray(pageSize) ? pageSize[0] : pageSize}
            totalCount={totalCount}
            currentCount={inventories.length}
            basePath="/dashboard/configuration/inventory"
            itemName="inventarios"
          />
        </div>
      </div>
    </div>
  );
}