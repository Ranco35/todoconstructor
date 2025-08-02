import { notFound } from 'next/navigation';
import { getSupplierById } from '@/actions/suppliers/get';
import ProductTable from '@/components/products/ProductTable';
import Head from '@/components/transversal/seccions/Head';
import Link from 'next/link';
import Image from 'next/image';

interface SupplierProductsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierProductsPage({ params }: SupplierProductsPageProps) {
  const { id } = await params;
  const supplierId = parseInt(id);

  if (isNaN(supplierId)) {
    notFound();
  }

  // Obtener datos del proveedor con sus productos
  const supplier = await getSupplierById(supplierId, {
    includeProducts: true
  });
  
  if (!supplier) {
    notFound();
  }

  const menuItems = [
    {
      label: 'Agregar Producto',
      component: (
        <Link
          href="/dashboard/configuration/products/create"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <span className="mr-2">📦</span>
          Agregar Producto
        </Link>
      )
    },
    {
      label: 'Ver Proveedor',
      component: (
        <Link
          href={`/dashboard/suppliers/${supplierId}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">👁️</span>
          Ver Proveedor
        </Link>
      )
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Head title={`Productos - ${supplier.name}`} menuItems={menuItems} />

      {/* Información del proveedor */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {supplier.logo ? (
              <Image 
                src={supplier.logo} 
                alt={supplier.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg font-medium">
                  {supplier.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {supplier.name}
              </h2>
              <p className="text-sm text-gray-500">
                Productos del Proveedor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de productos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">
                {supplier.Product?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {supplier.Product?.filter((p: any) => p.isActive).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Con Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {supplier.Product?.filter((p: any) => p.Product_Stock && p.Product_Stock.current > 0).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">🏷️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(supplier.Product?.map((p: any) => p.categoryId).filter(Boolean)).size || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Productos del Proveedor
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Lista de todos los productos asociados a este proveedor
          </p>
        </div>
        
        <div className="p-6">
          {supplier.Product && supplier.Product.length > 0 ? (
            <ProductTable 
              products={supplier.Product as any}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay productos
              </h3>
              <p className="text-gray-500 mb-6">
                Este proveedor no tiene productos asociados aún.
              </p>
              <Link
                href="/dashboard/configuration/products/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Agregar Primer Producto
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 