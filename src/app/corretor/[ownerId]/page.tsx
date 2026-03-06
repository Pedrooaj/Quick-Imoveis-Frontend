import { CorretorPortfolioContent } from "@/components/corretor-portfolio-content";

interface CorretorPageProps {
  params: Promise<{ ownerId: string }>;
}

export default async function CorretorPage({ params }: CorretorPageProps) {
  const { ownerId } = await params;
  return <CorretorPortfolioContent ownerId={ownerId} />;
}

