"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublic } from "@/lib/api";
import type { Property } from "@/types/property";
import type { PropertyOwner } from "@/components/property-detail-content";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { Comments } from "@/components/comments";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";

interface ListingsMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

type PropertyWithOwner = Property & { owner?: PropertyOwner | null };

function parseListingsResponse(data: unknown): {
  items: PropertyWithOwner[];
  meta: ListingsMeta;
} {
  if (!data || typeof data !== "object") return { items: [], meta: {} };
  const obj = data as Record<string, unknown>;
  const items = (obj.data ?? obj.items ?? obj.results ?? obj.properties) as unknown;
  const meta = (obj.meta ?? {}) as ListingsMeta;
  if (Array.isArray(items)) return { items: items as PropertyWithOwner[], meta };
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return { items: [items as PropertyWithOwner], meta };
  }
  return { items: [], meta: {} };
}

interface CorretorPortfolioContentProps {
  ownerId: string;
}

export function CorretorPortfolioContent({ ownerId }: CorretorPortfolioContentProps) {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [meta, setMeta] = useState<ListingsMeta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const data = await fetchPublic(
        `/listings/owner/${encodeURIComponent(ownerId)}?${params.toString()}`
      );
      const { items, meta: m } = parseListingsResponse(data ?? {});
      setProperties(items);
      setMeta(m);
    } catch {
      setProperties([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [ownerId, page]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const totalPages = meta.totalPages ?? 1;
  const total = meta.total ?? 0;

  const mainOwner: PropertyOwner | undefined =
    properties[0]?.owner ?? undefined;

  const joinedRaw =
    mainOwner?.joined_at ?? mainOwner?.created_at ?? mainOwner?.createdAt;
  let joinedLabel: string | null = null;
  if (joinedRaw) {
    const d = new Date(joinedRaw);
    if (!Number.isNaN(d.getTime())) {
      joinedLabel = d.toLocaleDateString("pt-BR");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-4 sm:gap-4 sm:px-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-14">
            <User className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">
              {mainOwner?.name ? `Portfólio de ${mainOwner.name}` : "Portfólio do corretor"}
            </h1>
            <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
              {mainOwner?.email && (
                <p className="flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" />
                  <a
                    href={`mailto:${mainOwner.email}`}
                    className="truncate hover:underline"
                  >
                    {mainOwner.email}
                  </a>
                </p>
              )}
              {mainOwner?.phone && (
                <p className="flex min-w-0 items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  <a href={`tel:${mainOwner.phone}`} className="truncate hover:underline">
                    {mainOwner.phone}
                  </a>
                </p>
              )}
              {mainOwner?.whatsapp && (
                <p className="flex min-w-0 items-center gap-1.5">
                  <MessageCircle className="size-3.5 shrink-0" />
                  <a
                    href={`https://wa.me/${mainOwner.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate hover:underline"
                  >
                    WhatsApp: {mainOwner.whatsapp}
                  </a>
                </p>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
              {mainOwner?.creci && (
                <span className="rounded-full border bg-muted/60 px-2 py-0.5 font-medium">
                  CRECI {mainOwner.creci}
                </span>
              )}
              {joinedLabel && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  No Quick Imóveis desde {joinedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="text-right text-xs text-muted-foreground sm:text-sm">
            <p className="font-medium">
              {total} {total === 1 ? "imóvel" : "imóveis"}
            </p>
            <p>
              Página {page} de {totalPages}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="p-6 text-center sm:p-12">
          <p className="text-muted-foreground">
            Nenhum imóvel encontrado para este corretor.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id ?? `owner-${i}`}
                property={p}
                index={i}
                variant="listing"
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
              </Button>
            </nav>
          )}
        </>
      )}

      <Comments type="corretor" targetId={ownerId} />
    </div>
  );
}

