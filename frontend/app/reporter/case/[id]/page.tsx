import ReporterCaseDetailClient from './ReporterCaseDetailClient';

export default async function ReporterCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReporterCaseDetailClient caseId={Number(id)} />;
}
