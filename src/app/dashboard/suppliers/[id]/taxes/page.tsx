import { notFound } from 'next/navigation';
import { getSupplierById } from '@/actions/suppliers/get';
import TaxTable from '@/components/suppliers/taxes/TaxTable';
import Head from '@/components/transversal/seccions/Head';
import Link from 'next/link';
import Image from 'next/image';

interface SupplierTaxesPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierTaxesPage({ params }: SupplierTaxesPageProps) {
  const { id } = await params;
  const supplierId = parseInt(id);

  if (isNaN(supplierId)) {
    notFound();
  }

  // Obtener datos del proveedor con sus impuestos
  const supplier = await getSupplierById(supplierId, {
    includeTaxes: true
  });
  
  if (!supplier) {
    notFound();
  }

  // Asegurar que solo se pasen objetos SupplierTax válidos
  const taxes = Array.isArray(supplier.SupplierTax)
    ? supplier.SupplierTax.filter((t: any) => t && t.taxType && t.taxRate !== undefined)
    : [];

  const menuItems = [
    {
      label: 'Agregar Impuesto',
      component: (
        <button
          onClick={() => {
            // TODO: Abrir modal para agregar configuración fiscal
          }}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <span className="mr-2">💸</span>
          Agregar Impuesto
        </button>
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
      <Head title={`Configuración Fiscal - ${supplier.name}`} menuItems={menuItems} />

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
                Configuración Fiscal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de configuraciones fiscales */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Configuración Fiscal
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los impuestos y configuraciones fiscales del proveedor
          </p>
        </div>
        
        <div className="p-6">
          <TaxTable 
            taxes={taxes as any}
            supplierId={supplierId}
          />
        </div>
      </div>
    </div>
  );
} 