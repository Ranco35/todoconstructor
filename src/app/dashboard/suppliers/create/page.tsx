import { getUsers } from '@/actions/configuration/auth-actions';
import SupplierForm from '@/components/suppliers/SupplierForm';
import Head from '@/components/transversal/seccions/Head';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function CreateSupplierPage({ searchParams }: PageProps) {
  // Obtener usuarios para los selectores de responsables
  const users = await getUsers();
  
  // Detectar si es un proveedor part-time desde los parámetros
  const params = await searchParams;
  const isPartTime = params.type === 'part-time';

  const menuItems = [
    {
      label: 'Volver',
      component: (
        <Link
          href="/dashboard/suppliers"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <span className="mr-2">←</span>
          Volver
        </Link>
      )
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Head 
        title={isPartTime ? "Crear Proveedor Part-Time" : "Crear Nuevo Proveedor"} 
        menuItems={menuItems} 
      />

      {/* Banner para proveedores part-time */}
      {isPartTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Proveedor Part-Time
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Estás creando un proveedor para personal temporal. Estos proveedores pueden recibir pagos 
                  a través del sistema de caja chica y se organizan por centros de costo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {isPartTime ? "Información del Proveedor Part-Time" : "Información del Proveedor"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isPartTime 
              ? "Complete la información del personal temporal que presta servicios en las termas"
              : "Complete todos los campos requeridos para crear un nuevo proveedor"
            }
          </p>
        </div>
        
        <div className="p-6">
          <SupplierForm 
            mode="create"
            users={users}
            defaultValues={{
              rank: isPartTime ? 'PART_TIME' : undefined,
              companyType: isPartTime ? 'PERSONA' : undefined,
              paymentTerm: isPartTime ? 'CONTADO' : undefined,
              isActive: true,
              active: true
            }}
          />
        </div>
      </div>

      {/* Información adicional para part-time */}
      {isPartTime && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Información para Proveedores Part-Time</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Tipo:</strong> Se establece automáticamente como "PART_TIME"</li>
            <li>• <strong>Tipo:</strong> Se establece como "PERSONA" para personal individual</li>
            <li>• <strong>Pago:</strong> Se establece como "CONTADO" para pagos inmediatos</li>
            <li>• <strong>Pagos:</strong> Podrás registrar pagos desde el módulo de Caja Chica</li>
            <li>• <strong>Centros de Costo:</strong> Cada pago se puede asociar a un centro de costo específico</li>
          </ul>
        </div>
      )}
    </div>
  );
} 