import { createCostCenter, getCostCentersForParent } from "@/actions/configuration/cost-center-actions";
import { CostCenterForm } from "@/components/shared/CostCenterForm";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CreateCostCenterPage() {
  const parentOptions = await getCostCentersForParent();

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Centro de Costo</h1>
            <p className="text-gray-600 mt-2">
              Agrega un nuevo centro de costo a la estructura organizacional
            </p>
          </div>
          <Link 
            href="/dashboard/configuration/cost-centers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Volver a centros de costo
          </Link>
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 font-semibold">💡</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-900">Consejos para crear centros de costo</h3>
              <div className="mt-2 text-blue-800 space-y-2">
                <p>• <strong>Nombre:</strong> Usa nombres descriptivos como &quot;Administración&quot;, &quot;Ventas&quot;, &quot;Marketing&quot;</p>
                <p>• <strong>Código:</strong> Opcional, pero útil para identificación rápida (ej: ADM-001, VEN-001)</p>
                <p>• <strong>Jerarquía:</strong> Puedes crear centros hijos para organizar mejor tu estructura</p>
                <p>• <strong>Descripción:</strong> Explica el propósito del centro de costo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <CostCenterForm 
          parentOptions={parentOptions}
          onSubmit={createCostCenter}
          isEditing={false}
        />
      </div>
    </div>
  );
} 