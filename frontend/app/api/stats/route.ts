import { getHomeStats } from '@/lib/home-stats';

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getHomeStats());
  } catch (error) {
    return Response.json(
      {
        caseCount: 0,
        verifiedCount: 0,
        activeCount: 0,
        message: error instanceof Error ? error.message : "Unable to load stats",
      },
      { status: 503 }
    );
  }
}
