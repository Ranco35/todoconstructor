import { notFound } from 'next/navigation';
import { getUnitMeasureById } from '@/actions/configuration/unit-measure-actions';
import UnitMeasureForm from '@/components/configuration/units/UnitMeasureForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUnitPage({ params }: PageProps) {
  const { id } = await params;
  const unitId = parseInt(id);

  if (isNaN(unitId)) {
    notFound();
  }

  const unit = await getUnitMeasureById(unitId);

  if (!unit) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <UnitMeasureForm 
        initialData={unit} 
        isEditing={true} 
      />
    </div>
  );
} 