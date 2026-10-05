import { NextRequest, NextResponse } from 'next/server';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline } from '@/detect/engine';
import { exportIncidentToCsv } from '@/lib/export/csv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get('incidentId');

    // Run sealed Pack B pipeline to obtain ground-truth incidents
    const corpus = generateSyntheticCorpus({ userCount: 120, pack: 'B' });
    const result = runDetectionPipeline(corpus.events);

    const targetIncident = incidentId
      ? result.incidents.find((i) => i.id === incidentId) || result.incidents[0]
      : result.incidents[0];

    if (!targetIncident) {
      return NextResponse.json({ error: 'No incident found to export' }, { status: 404 });
    }

    const csvData = exportIncidentToCsv(targetIncident);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quorum_incidents_${targetIncident.id}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'CSV export failed', details: msg }, { status: 500 });
  }
}
