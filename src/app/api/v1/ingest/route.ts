import { NextResponse } from 'next/server';
import { parseJsonLines } from '@/normalize/parsers';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawContent = body.content || (Array.isArray(body.lines) ? body.lines.join('\n') : '');
    const sourceSystem = body.sourceSystem || 'CiscoAnyConnect';

    if (!rawContent || rawContent.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_PAYLOAD',
            message: 'No log content provided in request body.',
          },
        },
        { status: 400 }
      );
    }

    const { accepted, rejected } = parseJsonLines(rawContent, sourceSystem);

    return NextResponse.json({
      success: true,
      data: {
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        rejectedSample: rejected.slice(0, 5),
      },
      meta: {
        timestamp: new Date().toISOString(),
        sourceSystem,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INGESTION_ERROR',
          message: error?.message || 'Failed to process ingestion payload',
        },
      },
      { status: 500 }
    );
  }
}
