"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiFetch, fetchPublic } from "@/lib/api";
import type { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

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
  return { items: [], meta };
}

function parsePropertiesResponse(data: unknown): Property[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const items = (obj.data ?? obj.items ?? obj.properties) as unknown;
  if (Array.isArray(items)) return items as Property[];
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return [items as Property];
  }
  return [];
}

const STATUS_OPTIONS = [
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "VENDIDO", label: "Vendido" },
] as const;

export function ImoveisListContent() {
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState<ListingsMeta>({});
  const [ownCount, setOwnCount] = useState(0);
  const [ownIds, setOwnIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;
  const isCorretor = (session?.user as { role?: string })?.role === "CORRETOR";
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const [filters, setFilters] = useState({
    city: "",
    neighborhood: "",
    minPrice: "",
    maxPrice: "",
    status: ["DISPONIVEL"] as string[],
  });
  const [filterInputs, setFilterInputs] = useState({
    city: "",
    neighborhood: "",
    minPrice: "",
    maxPrice: "",
  });

  const isAuthenticated = status === "authenticated";

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

  const fetchListings = useCallback(async () => {
    const normalizePrice = (value: string) => value.replace(/\D/g, "").trim();
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (filters.city.trim()) params.set("city", filters.city.trim());
    if (filters.neighborhood.trim()) params.set("neighborhood", filters.neighborhood.trim());
    const minP = normalizePrice(filters.minPrice);
    const maxP = normalizePrice(filters.maxPrice);
    if (minP) params.set("min_price", minP);
    if (maxP) params.set("max_price", maxP);
    if (filters.status.length > 0) params.set("status", filters.status.join(","));

    const url = `/listings?${params.toString()}`;
    const fetcher = status === "authenticated" ? apiFetch : fetchPublic;

    const fetchMyProperties =
      status === "authenticated" && isCorretor
        ? apiFetch("/property").then(parsePropertiesResponse).catch(() => [])
        : Promise.resolve([]);

    const minPriceNumber = minP ? Number(minP) : null;
    const maxPriceNumber = maxP ? Number(maxP) : null;
    const cityFilter = filters.city.trim().toLowerCase();
    const neighborhoodFilter = filters.neighborhood.trim().toLowerCase();

    function matchesLocalFilters(p: Property): boolean {
      const addr = p.address;
      if (cityFilter) {
        const cityValue = (addr?.city ?? "").toLowerCase();
        if (!cityValue.includes(cityFilter)) return false;
      }
      if (neighborhoodFilter) {
        const nValue = (addr?.neighborhood ?? "").toLowerCase();
        if (!nValue.includes(neighborhoodFilter)) return false;
      }
      if (minPriceNumber != null) {
        if (p.price == null || p.price < minPriceNumber) return false;
      }
      if (maxPriceNumber != null) {
        if (p.price == null || p.price > maxPriceNumber) return false;
      }
      return true;
    }

    Promise.all([fetcher(url), fetchMyProperties])
      .then(([listingsData, myProperties]) => {
        const { items: listings, meta: m } = parseListingsResponse(
          listingsData ?? {}
        );
        const listingsIds = new Set(listings.map((p) => p.id).filter(Boolean));
        const includeMyDisponiveis =
          page === 1 && filters.status.includes("DISPONIVEL");
        const myDisponiveis = includeMyDisponiveis
          ? myProperties.filter(
              (p) =>
                p.status === "DISPONIVEL" &&
                p.id &&
                !listingsIds.has(p.id) &&
                matchesLocalFilters(p)
            )
          : [];
        const merged = page === 1 ? [...myDisponiveis, ...listings] : listings;
        setProperties(merged);
        setOwnCount(page === 1 ? myDisponiveis.length : 0);
        setOwnIds(new Set(myDisponiveis.map((p) => p.id).filter(Boolean)));
        setMeta(m);
      })
      .catch(() => {
        setProperties([]);
        setMeta({});
        setOwnCount(0);
        setOwnIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [page, filters, status, isCorretor]);

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
    fetchListings();
  }, [fetchListings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((f) => ({
      ...f,
      city: filterInputs.city.trim(),
      neighborhood: filterInputs.neighborhood.trim(),
      minPrice: filterInputs.minPrice.trim(),
      maxPrice: filterInputs.maxPrice.trim(),
    }));
    setPage(1);
  }

  function toggleStatus(value: string) {
    setFilters((f) => {
      const next = f.status.includes(value)
        ? f.status.filter((s) => s !== value)
        : [...f.status, value];
      return { ...f, status: next.length > 0 ? next : ["DISPONIVEL"] };
    });
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      city: "",
      neighborhood: "",
      minPrice: "",
      maxPrice: "",
      status: ["DISPONIVEL"],
    });
    setFilterInputs({
      city: "",
      neighborhood: "",
      minPrice: "",
      maxPrice: "",
    });
    setPage(1);
  }

  const hasActiveFilters =
    filters.city ||
    filters.neighborhood ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.status.length !== 1 || filters.status[0] !== "DISPONIVEL");

  const totalPages = meta.totalPages ?? 1;
  const total = (meta.total ?? 0) + (page === 1 ? ownCount : 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Imóveis</h1>
        <p className="text-base text-muted-foreground">
          {loading
            ? "Buscando imóveis…"
            : total > 0
              ? `${total} ${total === 1 ? "imóvel encontrado" : "imóveis encontrados"}`
              : "Nenhum imóvel encontrado"}
        </p>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <Card className="p-3 sm:p-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="size-4" />
            Filtros
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Label htmlFor="filter-city" className="sr-only">
                Cidade
              </Label>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="filter-city"
                placeholder="Cidade"
                value={filterInputs.city}
                onChange={(e) =>
                  setFilterInputs((f) => ({ ...f, city: e.target.value }))
                }
                className="pl-9"
              />
            </div>

            <div>
              <Label htmlFor="filter-neighborhood" className="sr-only">
                Bairro
              </Label>
              <Input
                id="filter-neighborhood"
                placeholder="Bairro"
                value={filterInputs.neighborhood}
                onChange={(e) =>
                  setFilterInputs((f) => ({ ...f, neighborhood: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="filter-min-price" className="sr-only">
                Preço mínimo
              </Label>
              <Input
                id="filter-min-price"
                type="number"
                placeholder="Preço mín."
                value={filterInputs.minPrice}
                onChange={(e) =>
                  setFilterInputs((f) => ({ ...f, minPrice: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="filter-max-price" className="sr-only">
                Preço máximo
              </Label>
              <Input
                id="filter-max-price"
                type="number"
                placeholder="Preço máx."
                value={filterInputs.maxPrice}
                onChange={(e) =>
                  setFilterInputs((f) => ({ ...f, maxPrice: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status:
              </span>
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="mr-1 size-4" />
                  Limpar
                </Button>
              )}
              <Button type="submit">
                <Search className="mr-2 size-4" />
                Buscar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* ── Grid de imóveis ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="py-8 text-center sm:py-16">
          <p className="text-lg text-muted-foreground">
            Nenhum imóvel disponível no momento.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id ?? `prop-${i}`}
                property={p}
                index={i}
                variant="listing"
                isFavorite={p.id ? favoriteIds.has(p.id) : false}
                onToggleFavorite={handleToggleFavorite}
                isOwn={p.id ? ownIds.has(p.id) : false}
              />
            ))}
          </div>

          {/* ── Paginação ──────────────────────────────────────── */}
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
