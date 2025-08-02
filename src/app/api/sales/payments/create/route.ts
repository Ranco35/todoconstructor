import { NextRequest, NextResponse } from 'next/server';
import { createPayment, type CreatePaymentInput } from '@/actions/sales/payments/create';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    if (!body.invoice_id) {
      return NextResponse.json(
        { success: false, error: 'ID de factura es obligatorio.' },
        { status: 400 }
      );
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto del pago debe ser mayor a 0.' },
        { status: 400 }
      );
    }

    if (!body.payment_method) {
      return NextResponse.json(
        { success: false, error: 'Método de pago es obligatorio.' },
        { status: 400 }
      );
    }

    // Preparar datos de entrada
    const paymentData: CreatePaymentInput = {
      invoice_id: parseInt(body.invoice_id),
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      payment_date: body.payment_date,
      reference_number: body.reference_number,
      notes: body.notes,
      bank_account_id: body.bank_account_id ? parseInt(body.bank_account_id) : undefined,
      processed_by: body.processed_by
    };

    // Crear el pago
    const result = await createPayment(paymentData);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error en endpoint de crear pago:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 