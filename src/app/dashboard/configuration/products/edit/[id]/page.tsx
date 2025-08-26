import Link from 'next/link';
import { getProductById } from "@/actions/products/get";
import ProductFormModern from '@/components/products/ProductFormModern';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  // Intentar cargar el producto; si falla, mostrar una UI de error en vez de 404
  const isInvalidId = isNaN(productId);
  const product = !isInvalidId ? await getProductById(productId) : null;

  if (isInvalidId || !product) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-yellow-800">No se pudo abrir la página de edición</h1>
          <p className="mt-2 text-sm text-yellow-700">
            {isInvalidId
              ? 'El identificador del producto es inválido.'
              : 'No encontramos el producto solicitado o no hay permisos para verlo.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/configuration/products" className="text-blue-600 hover:text-blue-800 underline">
              Volver a Productos
            </Link>
            <Link href="/dashboard/configuration/products/create" className="text-blue-600 hover:text-blue-800 underline">
              Crear nuevo producto
            </Link>
            {!isInvalidId && (
              <Link href={`/dashboard/configuration/products/${id}`} className="text-blue-600 hover:text-blue-800 underline">
                Ver detalle del producto
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Modifica la información del producto: <strong>{product.name}</strong>
          </p>
        </div>
        <div className="p-6">
          <ProductFormModern 
            initialData={product} 
            action={undefined} 
            isEdit={true} 
          />
        </div>
      </div>
    </div>
  );
}