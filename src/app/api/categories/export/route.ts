import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Endpoint para exportar categorías
    return NextResponse.json({
      success: true,
      message: 'Categories export endpoint',
      data: [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error exporting categories' },
      { status: 500 }
    )
  }
} 