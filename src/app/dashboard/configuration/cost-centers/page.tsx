import { getCostCenters, getCostCentersForParent, deleteCostCenterAction, createCostCenter } from "@/actions/configuration/cost-center-actions";
import { CostCenterTable } from "@/components/shared/CostCenterTable";
import { CostCenterForm } from "@/components/shared/CostCenterForm";
import PaginationControls from "@/components/shared/PaginationControls";

interface PageProps {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CostCentersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  
  const { costCenters, totalCount, totalPages } = await getCostCenters({ page, pageSize });
  const parents = await getCostCentersForParent();

  const filteredCostCenters = (costCenters || []).filter(cc => !cc.parentId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Centros de Costo</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Crear Nuevo Centro de Costo</h2>
        <CostCenterForm 
          parentOptions={parents || []} 
          onSubmit={createCostCenter}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Listado de Centros de Costo</h2>
        <CostCenterTable 
          data={filteredCostCenters} 
          deleteAction={deleteCostCenterAction}
        />
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize.toString()}
          totalCount={totalCount}
          currentCount={filteredCostCenters.length}
          basePath="/dashboard/configuration/cost-centers"
          itemName="centros de costo"
        />
      </div>
    </div>
  );
}