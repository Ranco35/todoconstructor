import ProductFormModern from '@/components/products/ProductFormModern';
import { createProduct } from '@/actions/products/create';

export default function CreateProductPage() {
  return <ProductFormModern action={createProduct} />;
} 