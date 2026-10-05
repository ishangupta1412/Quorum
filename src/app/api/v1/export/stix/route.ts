import { NextRequest, NextResponse } from 'next/server';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline } from '@/detect/engine';
import { exportToStix21 } from '@/lib/export/stix';

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

    const stixBundle = exportToStix21(targetIncident);

    return new NextResponse(JSON.stringify(stixBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="quorum_stix_${targetIncident.id}.json"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'STIX export failed', details: msg }, { status: 500 });
  }
}
