import { NextResponse } from 'next/server';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline } from '@/detect/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pack = body.pack === 'A' ? 'A' : 'B';

    // Generate or fetch telemetry pack
    const corpus = generateSyntheticCorpus({ pack });
    const result = runDetectionPipeline(corpus.events);

    return NextResponse.json({
      success: true,
      data: {
        totalEventsProcessed: result.stats.totalEventsProcessed,
        signalsGenerated: result.stats.signalsGenerated,
        incidentsCount: result.incidents.length,
        primaryIncident: result.incidents.find((i) => i.severityTier === 'CRITICAL') || result.incidents[0] || null,
        executionTimeMs: result.stats.executionTimeMs,
      },
      meta: {
        timestamp: new Date().toISOString(),
        pack,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PIPELINE_ERROR',
          message: error?.message || 'Detection execution failed',
        },
      },
      { status: 500 }
    );
  }
}
