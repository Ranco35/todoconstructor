import { getCostCenterById, updateCostCenter, getCostCentersForParent } from "@/actions/configuration/cost-center-actions";
import { CostCenterForm } from "@/components/shared/CostCenterForm";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditCostCenterPage(props: PageProps) {
  const params = await props.params;
  const costCenterId = parseInt(params.id);
  
  if (isNaN(costCenterId)) {
    notFound();
  }

  const [costCenter, parentOptions] = await Promise.all([
    getCostCenterById(costCenterId),
    getCostCentersForParent(costCenterId)
  ]);
  
  if (!costCenter) {
    notFound();
  }

  const updateCostCenterWithId = updateCostCenter.bind(null, costCenterId);

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Centro de Costo: {costCenter.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Modifica la información del centro de costo
            </p>
          </div>
          <Link 
            href="/dashboard/configuration/cost-centers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Volver a centros de costo
          </Link>
        </div>

        {/* Información del centro de costo */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Relaciones</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ventas:</span>
                  <span className="font-medium">{costCenter._count.Sale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{costCenter._count.Product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Permisos:</span>
                  <span className="font-medium">{costCenter._count.Permission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Centros hijos:</span>
                  <span className="font-medium">{costCenter._count.Children}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Jerarquía</h3>
              <div className="space-y-2 text-sm">
                {costCenter.Parent ? (
                  <div>
                    <span className="text-gray-600">Centro Padre:</span>
                    <div className="font-medium">{costCenter.Parent.name}</div>
                    {costCenter.Parent.code && (
                      <div className="text-xs text-gray-500">({costCenter.Parent.code})</div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-600 font-medium">Centro Raíz</div>
                )}
                
                {costCenter.Children.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600">Centros Hijos:</span>
                    <div className="mt-1 space-y-1">
                      {costCenter.Children.map((child) => (
                        <div key={child.id} className="text-sm font-medium">
                          {child.name}
                          {child.code && <span className="text-xs text-gray-500"> ({child.code})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Estado</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">Estado:</span>
                  {costCenter.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactivo
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">Creado:</span>
                  <div className="font-medium">
                    {new Date(costCenter.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Actualizado:</span>
                  <div className="font-medium">
                    {new Date(costCenter.updatedAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de validación */}
        {(costCenter._count.Children > 0 || costCenter._count.Sale > 0 || costCenter._count.Product > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-amber-600 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Precaución: Este centro de costo tiene relaciones
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <ul className="list-disc list-inside space-y-1">
                    {costCenter._count.Children > 0 && (
                      <li>Tiene {costCenter._count.Children} centros hijos asociados</li>
                    )}
                    {costCenter._count.Sale > 0 && (
                      <li>Tiene {costCenter._count.Sale} ventas asociadas</li>
                    )}
                    {costCenter._count.Product > 0 && (
                      <li>Tiene {costCenter._count.Product} productos asociados</li>
                    )}
                  </ul>
                  <p className="mt-2">
                    Ten cuidado al modificar la jerarquía o desactivar este centro de costo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <CostCenterForm 
          parentOptions={parentOptions}
          initialData={costCenter}
          onSubmit={updateCostCenterWithId}
          isEditing={true}
        />
      </div>
    </div>
  );
} 