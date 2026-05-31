import HomeClient from './HomeClient';
import { getHomeStats, type HomeStatsSnapshot } from '@/lib/home-stats';

export const dynamic = 'force-dynamic';

const emptyStats: HomeStatsSnapshot = {
  caseCount: 0,
  verifiedCount: 0,
  activeCount: 0,
  sampledCases: 0,
};

export default async function Home() {
  let initialStats = emptyStats;

  try {
    initialStats = await getHomeStats();
  } catch {
    initialStats = emptyStats;
  }

  return <HomeClient initialStats={initialStats} />;
}
