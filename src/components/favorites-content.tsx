"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface ListingsMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function parseListingsResponse(data: unknown): { items: Property[]; meta: ListingsMeta } {
  if (!data || typeof data !== "object") return { items: [], meta: {} };
  const obj = data as Record<string, unknown>;
  const items = (obj.data ?? obj.items ?? obj.results ?? obj.properties) as unknown;
  const meta = (obj.meta ?? {}) as ListingsMeta;
  if (Array.isArray(items)) return { items, meta };
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return { items: [items as Property], meta };
  }
  return { items: [], meta: {} };
}

export function FavoritesContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<ListingsMeta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const data = await apiFetch(`/favorite?${params.toString()}`);
      const { items, meta: m } = parseListingsResponse(data ?? {});
      setProperties(items);
      setMeta(m);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 401) {
        setProperties([]);
        setMeta({});
      } else {
        setProperties([]);
        setMeta({});
        toast.error("Erro ao carregar favoritos.");
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleRemoveFavorite(p: Property) {
    if (!p.id) return;
    setRemovingId(p.id);
    const previous = [...properties];
    const previousMeta = { ...meta };
    setProperties((prev) => prev.filter((x) => x.id !== p.id));
    setMeta((prev) => ({
      ...prev,
      total: Math.max(0, (prev.total ?? 1) - 1),
    }));
    try {
      await apiFetch(`/favorite/${p.id}`, { method: "DELETE" });
      toast.success("Removido dos favoritos.");
    } catch {
      setProperties(previous);
      setMeta(previousMeta);
      toast.error("Não foi possível remover dos favoritos.");
    } finally {
      setRemovingId(null);
    }
  }

  const totalPages = meta.totalPages ?? 1;
  const total = meta.total ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Favoritos</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total === 1
              ? "1 imóvel favoritado"
              : `${total} imóveis favoritados`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Alert>
          <AlertDescription>
            Você ainda não possui imóveis favoritos. Explore a lista de imóveis e clique no
            ícone de{" "}
            <Heart className="inline-block size-4 text-red-500 align-text-bottom" /> para
            salvar seus favoritos aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id ?? `fav-${i}`}
                property={p}
                index={i}
                variant="favorites"
                onRemove={handleRemoveFavorite}
                removingId={removingId}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="mr-1 size-4" />
                Anterior
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Próxima
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

