'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { DeleteConfirmButton } from './DeleteConfirmButton';

// Definir el tipo Category localmente
interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

type CategoryWithCount = Category & {
  _count: {
    Product: number;
  },
  Parent?: { name: string } | null;
}

interface CategoryTableProps {
  data: CategoryWithCount[];
  deleteAction: (formData: FormData) => Promise<any>;
  searchTerm?: string;
}

export function CategoryTable({ data, deleteAction, searchTerm }: CategoryTableProps) {
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
                  Nombre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría Padre
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ver Productos
                </th>
                <th className="py-3 px-3 lg:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-3 lg:px-6 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      {searchTerm ? (
                        <>
                          <span className="text-4xl mb-4">🔍</span>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron categorías</h3>
                          <p className="text-gray-600">No hay categorías que coincidan con &quot;{searchTerm}&quot;</p>
                          <p className="text-gray-500 text-sm mt-2">Intenta con otros términos de búsqueda</p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl mb-4">📂</span>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías registradas</h3>
                          <p className="text-gray-600">Agrega tu primera categoría para organizar tus productos</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900">
                      {category.id}
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-900">
                      <div className="max-w-48 truncate font-medium" title={category.name}>
                        {category.name}
                      </div>
                    </td>
                    <td className="py-4 px-3 lg:px-6 text-sm text-gray-500">
                      {category.Parent ? (
                        <span className="inline-block bg-gray-200 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                          {category.Parent.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Raíz</span>
                      )}
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-semibold rounded-full ${
                        category._count.Product > 0 
                          ? 'text-blue-700 bg-blue-100' 
                          : 'text-gray-700 bg-gray-100'
                      }`}>
                        {category._count.Product}
                      </span>
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm text-gray-900">
                      {category._count.Product > 0 ? (
                        <Link href={`/configuration/products?category=${category.id}`}>
                          <button className="text-blue-600 hover:text-blue-900 text-xs underline">
                            Ver ({category._count.Product})
                          </button>
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin productos</span>
                      )}
                    </td>
                    <td className="py-4 px-3 lg:px-6 whitespace-nowrap text-sm font-medium w-32">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/configuration/category/edit/${category.id}`}>
                          <button className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50">
                            Editar
                          </button>
                        </Link>
                        {category.name === 'Sistema Reservas' ? (
                          <span className="text-gray-400 text-xs px-2 py-1 rounded bg-gray-100 cursor-not-allowed" title="Categoría protegida del sistema">
                            Protegida
                          </span>
                        ) : (
                          <DeleteConfirmButton
                            deleteAction={deleteAction}
                            id={String(category.id)}
                            confirmMessage={`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?${category._count.Product > 0 ? ` Esta categoría tiene ${category._count.Product} producto(s) asociado(s).` : ''}`}
                            className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded hover:bg-red-50"
                          />
                        )}
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