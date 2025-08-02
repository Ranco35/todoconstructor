import { notFound } from "next/navigation";
import { getProductById } from "@/actions/products/get";
import ProductFormModern from '@/components/products/ProductFormModern';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  // Obtener los datos del producto
  const product = await getProductById(productId);

  if (!product) {
    notFound();
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