import { RecommendationsContent } from "@/components/recommendations-content";

export default function RecomendacoesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Recomendações</h1>
        <p className="text-base text-muted-foreground">
          Imóveis sugeridos para você com base na sua localização e faixa de
          preço
        </p>
      </div>
      <RecommendationsContent />
    </div>
  );
}
