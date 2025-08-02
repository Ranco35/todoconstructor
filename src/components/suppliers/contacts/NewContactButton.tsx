'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/shared/Modal';
import ContactForm from './ContactForm';
import { useRouter } from 'next/navigation';

interface NewContactButtonProps {
  supplierId: number;
}

export default function NewContactButton({ supplierId }: NewContactButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const handleFormSuccess = () => {
    setShowForm(false);
    // Refrescar la página para mostrar el nuevo contacto
    router.refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <>
      <Button 
        className="bg-purple-600 hover:bg-purple-700"
        onClick={() => setShowForm(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Contacto
      </Button>

      <Modal
        open={showForm}
        onClose={handleFormCancel}
      >
        <ContactForm
          supplierId={supplierId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </>
  );
} 