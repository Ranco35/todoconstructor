import { notFound } from 'next/navigation';
import { getSupplierById } from '@/actions/suppliers/get';
import { getUsers } from '@/actions/configuration/auth-actions';
import SupplierForm from '@/components/suppliers/SupplierForm';
import Head from '@/components/transversal/seccions/Head';
import Link from 'next/link';

interface EditSupplierPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params;
  const supplierId = parseInt(id);

  if (isNaN(supplierId)) {
    notFound();
  }

  // Obtener datos del proveedor
  const supplier = await getSupplierById(supplierId);
  
  if (!supplier) {
    notFound();
  }

  // Obtener usuarios para los selectores de responsables
  const users = await getUsers();

  const menuItems = [
    {
      label: 'Ver Detalles',
      component: (
        <Link
          href={`/dashboard/suppliers/${supplierId}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">👁️</span>
          Ver Detalles
        </Link>
      )
    },
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
      <Head title={`Editar Proveedor - ${supplier.name}`} menuItems={menuItems} />

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Editar Información del Proveedor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Modifique los campos que desee actualizar
          </p>
        </div>
        
        <div className="p-6">
          <SupplierForm 
            mode="edit"
            supplier={supplier}
            users={users}
          />
        </div>
      </div>
    </div>
  );
} 