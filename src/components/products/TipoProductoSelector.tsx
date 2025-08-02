import { ProductType } from '@/types/product';

interface TipoProductoSelectorProps {
  value: ProductType;
  onChange: (type: ProductType) => void | Promise<void>;
  disabled?: boolean;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.CONSUMIBLE]: 'Consumible',
  [ProductType.ALMACENABLE]: 'Almacenable',
  [ProductType.SERVICIO]: 'Servicio',
  [ProductType.INVENTARIO]: 'Inventario',
  [ProductType.COMBO]: 'Combo',
};

export default function TipoProductoSelector({ value, onChange, disabled = false }: TipoProductoSelectorProps) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tipo de Producto</h2>
        <div className="w-full flex justify-center">
          <div className="flex flex-row gap-6 justify-center items-center border-4 border-blue-400 rounded-2xl bg-white py-6 px-4">
            {Object.values(ProductType).map((type) => (
              <button
                key={type}
                type="button"
        disabled={disabled}
                onClick={() => onChange(type)}
                className={`transition-all px-10 py-6 rounded-xl font-bold border-2 focus:outline-none text-lg
                  ${value === type
                    ? 'bg-blue-600 text-white border-blue-700 scale-110 shadow-lg'
                    : 'bg-white text-gray-400 border-gray-300 grayscale hover:scale-105 hover:border-blue-400'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ fontSize: value === type ? '1.5rem' : '1.15rem' }}
              >
                {PRODUCT_TYPE_LABELS[type as ProductType]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-base text-gray-500 text-center w-full">
        {value === ProductType.CONSUMIBLE && "Producto que se consume al usarse"}
        {value === ProductType.ALMACENABLE && "Producto que se puede almacenar"}
        {value === ProductType.SERVICIO && "Servicio prestado"}
        {value === ProductType.INVENTARIO && "Producto de inventario"}
        {value === ProductType.COMBO && "Conjunto de productos"}
      </p>
      </div>
    </div>
  );
} 