import { NextRequest, NextResponse } from 'next/server';
import { updateProduct } from '@/actions/products/update';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const result = await updateProduct(formData);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Producto actualizado exitosamente',
        data: result.data,
        redirect: '/dashboard/configuration/products'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 