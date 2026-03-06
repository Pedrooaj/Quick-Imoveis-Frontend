"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import type { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface ListingsMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function parseListingsResponse(data: unknown): {
  items: Property[];
  meta: ListingsMeta;
} {
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

export function RecommendationsContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<ListingsMeta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const limit = 12;
   const { status } = useSession();
   const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
   const [favoritesLoaded, setFavoritesLoaded] = useState(false);

   const isAuthenticated = status === "authenticated";

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setProfileIncomplete(false);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const data = await apiFetch(`/listings/recommendations?${params.toString()}`);
      const { items, meta: m } = parseListingsResponse(data ?? {});
      setProperties(items);
      setMeta(m);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 400) {
        setProfileIncomplete(true);
        setProperties([]);
        setMeta({});
      } else {
        setProperties([]);
        setMeta({});
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      setFavoritesLoaded(false);
      return;
    }
    if (favoritesLoaded) return;

    const loadFavorites = async () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      try {
        const data = await apiFetch(`/favorite?${params.toString()}`);
        const { items } = parseListingsResponse(data ?? {});
        const ids = new Set(
          items
            .map((p) => p.id)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
        );
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds(new Set());
      } finally {
        setFavoritesLoaded(true);
      }
    };

    loadFavorites();
  }, [isAuthenticated, favoritesLoaded]);

  async function handleToggleFavorite(p: Property) {
    if (!p.id) return;
    if (!isAuthenticated) {
      toast.error("Faça login para favoritar imóveis.");
      return;
    }
    const currentlyFavorite = favoriteIds.has(p.id);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (currentlyFavorite) {
        next.delete(p.id!);
      } else {
        next.add(p.id!);
      }
      return next;
    });

    try {
      if (currentlyFavorite) {
        await apiFetch(`/favorite/${p.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/favorite/${p.id}`, { method: "POST" });
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (currentlyFavorite) {
          next.add(p.id!);
        } else {
          next.delete(p.id!);
        }
        return next;
      });
    }
  }

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const totalPages = meta.totalPages ?? 1;
  const total = meta.total ?? 0;

  if (profileIncomplete) {
    return (
      <Alert className="border-warning/30 bg-warning/10">
        <Sparkles className="size-4" />
        <AlertDescription>
          Para ver recomendações personalizadas, complete seu perfil com endereço
          (CEP/cidade) e dados financeiros (renda mensal e valor de entrada).{" "}
          <Link
            href="/perfil?edit=1"
            className="font-medium underline underline-offset-2 hover:no-underline"
          >
            Ir para o perfil
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="p-6 text-center sm:p-12">
          <Sparkles className="mx-auto mb-4 size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhuma recomendação no momento. Complete seu perfil para receber
            sugestões personalizadas por proximidade e faixa de preço.
          </p>
          <Button asChild className="mt-4">
            <Link href="/perfil?edit=1">Completar perfil</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id ?? `rec-${i}`}
                property={p}
                index={i}
                variant="listing"
                isFavorite={p.id ? favoriteIds.has(p.id) : false}
                onToggleFavorite={handleToggleFavorite}
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
