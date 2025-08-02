'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageDisplayProps {
  imageUrl?: string | null;
  productName: string;
}

export default function ProductImageDisplay({ imageUrl, productName }: ProductImageDisplayProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Package className="w-5 h-5 mr-2 text-blue-600" />
        Imagen del Producto
      </h3>
      <div className="flex justify-center">
        <div className="relative w-64 h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`Imagen de ${productName}`}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${imageUrl && !imageError ? 'hidden' : ''}`}>
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin imagen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 