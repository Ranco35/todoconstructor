'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NuevoLeadButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard/crm/create');
  };

  return (
    <Button size="sm" onClick={handleClick}>
      <Plus className="h-4 w-4 mr-2" />
      Nuevo Lead
    </Button>
  );
}
