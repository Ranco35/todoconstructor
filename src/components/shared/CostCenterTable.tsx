'use client';

import React from 'react';
import Link from 'next/link';
import { DeleteConfirmButton } from './DeleteConfirmButton';

// Local type definitions instead of Prisma types
type CostCenter = {
  id: number;
  name: string;
  description?: string | null;
  code?: string | null;
  parentId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CostCenterWithCount = CostCenter & {
  Parent?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
  Children: Array<{
    id: number;
    name: string;
  }>;
  _count: {
    Sale: number;
    Product: number;
    Permission: number;
    Children: number;
  }
}

interface CostCenterTableProps {
  data: CostCenterWithCount[];
  deleteAction: (formData: FormData) => Promise<void>;
}

export function CostCenterTable({ data, deleteAction }: CostCenterTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Centro Padre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hijos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">No hay centros de costo</h3>
                        <p className="text-sm text-gray-500">Comienza creando tu primer centro de costo</p>
                      </div>
                      <Link
                        href="/dashboard/configuration/cost-centers/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Crear centro de costo
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((costCenter) => (
                  <tr key={costCenter.id} className="hover:bg-gray-50">
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{costCenter.id}
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      {costCenter.code ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {costCenter.code}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sin código</span>
                      )}
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{costCenter.name}</div>
                          {costCenter.description && (
                            <div className="text-sm text-gray-500 max-w-48 truncate" title={costCenter.description}>
                              {costCenter.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      {costCenter.Parent ? (
                        <div className="flex flex-col space-y-1">
                          <div className="font-medium">{costCenter.Parent.name}</div>
                          {costCenter.Parent.code && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                              {costCenter.Parent.code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Centro Raíz
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                        {costCenter._count.Children}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                        {costCenter._count.Sale}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                        {costCenter._count.Product}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm">
                      {costCenter.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/configuration/cost-centers/edit/${costCenter.id}`}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          Editar
                        </Link>
                        <DeleteConfirmButton
                          id={costCenter.id.toString()}
                          deleteAction={deleteAction}
                          confirmMessage={`¿Estás seguro de que quieres eliminar el centro de costo "${costCenter.name}"?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 