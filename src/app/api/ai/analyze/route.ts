import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Endpoint básico para análisis con IA
    return NextResponse.json({
      success: true,
      message: 'AI analysis endpoint',
      data: {
        analyzed: true,
        timestamp: new Date().toISOString(),
        input: body
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error in AI analysis' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI analysis endpoint available',
    methods: ['POST']
  })
} 