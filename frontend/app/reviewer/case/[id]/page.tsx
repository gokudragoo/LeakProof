import ReviewerCaseDetailClient from './ReviewerCaseDetailClient';

export default async function ReviewerCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewerCaseDetailClient caseId={Number(id)} />;
}
