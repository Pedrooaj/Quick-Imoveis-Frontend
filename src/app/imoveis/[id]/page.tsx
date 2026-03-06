import { PropertyDetailContent, type PropertyDetail } from "@/components/property-detail-content";

interface ImovelPageProps {
  params: Promise<{ id: string }>;
}

async function fetchListing(id: string): Promise<PropertyDetail | null> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/listings/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PropertyDetail;
  } catch {
    return null;
  }
}

export default async function ImovelDetalhePage({ params }: ImovelPageProps) {
  const { id } = await params;
  const initialData = await fetchListing(id);
  return <PropertyDetailContent id={id} initialData={initialData} />;
}

