import { getCategoryById } from "@/actions/configuration/category-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditCategoryForm from "@/components/shared/EditCategoryForm";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

// Marcar como página dinámica para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    notFound();
  }

  const category = await getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Categoría &quot;{category.name}&quot;</h1>
        <p className="text-gray-600">Modifique los datos de la categoría &quot;{category.name}&quot;</p>
      </div>

      <EditCategoryForm category={category} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Información de la categoría</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium">{category.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Productos asociados:</span>
              <span className="font-medium text-blue-600">{category._count.Product}</span>
            </div>
          </div>
          {category._count.Product > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <Link href={`/configuration/products?category=${category.id}`}>
                <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                  Ver productos de esta categoría →
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Importante</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Los cambios afectarán a todos los productos de esta categoría</li>
                  {category._count.Product > 0 && (
                    <li>Esta categoría tiene {category._count.Product} producto(s) asociado(s)</li>
                  )}
                  <li>No se puede eliminar una categoría con productos asociados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 