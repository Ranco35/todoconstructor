import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Chat response placeholder',
      data: {
        response: 'Esta es una respuesta de prueba del chat',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error in chat API' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Chat API endpoint available',
    methods: ['POST']
  })
} 