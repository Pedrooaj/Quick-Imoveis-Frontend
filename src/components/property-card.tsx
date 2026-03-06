"use client";

import Link from "next/link";
import type { Property } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BedDouble,
  Heart,
  Home,
  ImageOff,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
} from "lucide-react";

export const TYPE_LABELS: Record<string, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  TERRENO: "Terreno",
  COMERCIAL: "Comercial",
  RURAL: "Rural",
};

export const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  DISPONIVEL: "Disponível",
  VENDIDO: "Vendido",
};

const STATUS_STYLES: Record<string, string> = {
  DISPONIVEL:
    "bg-emerald-500/90 text-white",
  VENDIDO:
    "bg-muted-foreground/80 text-background",
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export function getImageUrl(property: Property): string | null {
  const img = property.images?.[0];
  if (img?.image_url) return img.image_url;
  if (img?.url) return img.url;
  if (property.primary_image) return property.primary_image;
  if (property.image_url) return property.image_url;
  return null;
}

type PropertyCardVariant = "listing" | "my-properties" | "favorites";

interface PropertyCardBaseProps {
  property: Property;
  index?: number;
}

interface PropertyCardListingProps extends PropertyCardBaseProps {
  variant: "listing";
  isFavorite?: boolean;
  onToggleFavorite?: (p: Property) => void;
  isOwn?: boolean;
}

interface PropertyCardMyPropertiesProps extends PropertyCardBaseProps {
  variant: "my-properties";
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
}

interface PropertyCardFavoritesProps extends PropertyCardBaseProps {
  variant: "favorites";
  onRemove?: (p: Property) => void;
  removingId?: string | null;
}

export type PropertyCardProps =
  | PropertyCardListingProps
  | PropertyCardMyPropertiesProps
  | PropertyCardFavoritesProps;

/* ------------------------------------------------------------------ */

function FavoriteButton({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      className="absolute left-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 text-red-500 shadow-sm hover:bg-background hover:text-red-600"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className="size-4" fill={active ? "currentColor" : "none"} />
    </Button>
  );
}

/* ------------------------------------------------------------------ */

export function PropertyCard(props: PropertyCardProps) {
  const { property: p } = props;
  const imgUrl = getImageUrl(p);
  const status = p.status;
  const statusLabel = status ? (STATUS_LABELS[status] ?? status) : null;
  const statusClass = status ? (STATUS_STYLES[status] ?? "bg-background/80 text-foreground") : "";

  return (
    <Card className="group row-span-4 grid grid-rows-subgrid gap-0 overflow-hidden p-0 transition-shadow hover:shadow-lg">
      {/* ── Row 1 · Imagem ─────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {props.variant === "listing" && p.id && props.onToggleFavorite && (
          <FavoriteButton
            active={!!props.isFavorite}
            onClick={() => props.onToggleFavorite?.(p)}
          />
        )}
        {props.variant === "favorites" && p.id && props.onRemove && (
          <FavoriteButton
            active
            disabled={props.removingId === p.id}
            onClick={() => props.onRemove?.(p)}
          />
        )}

        {props.variant === "listing" && p.id && props.isOwn && (
          <span className="absolute bottom-2 left-2 z-10 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
            Meu imóvel
          </span>
        )}
        {statusLabel && (
          <span
            className={`absolute right-2 top-2 z-10 rounded-md px-2 py-0.5 text-xs font-medium shadow-sm ${statusClass}`}
          >
            {statusLabel}
          </span>
        )}

        {imgUrl ? (
          <img
            src={imgUrl}
            alt={p.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <ImageOff className="size-10" strokeWidth={1.2} />
            <span className="text-[11px]">Sem imagem</span>
          </div>
        )}
      </div>

      {/* ── Row 2 · Título + Preço ────────────────────────────── */}
      <div className="px-5 pt-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {p.title}
        </h3>
        {p.price != null && p.price > 0 && (
          <p className="mt-1.5 text-lg font-bold text-primary">
            {formatPrice(p.price)}
          </p>
        )}
      </div>

      {/* ── Row 3 · Metadados (grid 2×2 fixo) ────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-5 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 truncate">
          <Home className="size-4 shrink-0" />
          {TYPE_LABELS[p.property_type ?? ""] ?? p.property_type ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1.5 truncate">
          <MapPin className="size-4 shrink-0" />
          {p.address?.city ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Ruler className="size-4 shrink-0" />
          {p.area != null && p.area > 0 ? `${p.area} m²` : "—"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BedDouble className="size-4 shrink-0" />
          {p.bedrooms != null && p.bedrooms > 0
            ? `${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}`
            : "—"}
        </span>
      </div>

      {/* ── Row 4 · Ações ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-2 border-t px-5 py-4">
        {p.id && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/imoveis/${p.id}`}>Ver detalhes</Link>
          </Button>
        )}
        {props.variant === "my-properties" && (
          <>
            <Button variant="outline" size="sm" onClick={() => props.onEdit?.(p)}>
              <Pencil className="mr-1.5 size-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => props.onDelete?.(p)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
        {props.variant === "favorites" && p.id && props.onRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.removingId === p.id}
            onClick={() => props.onRemove?.(p)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
          >
            <Heart className="mr-1.5 size-3.5 fill-current" />
            Remover
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function PropertyCardSkeleton() {
  return (
    <Card className="row-span-4 grid grid-rows-subgrid gap-0 overflow-hidden p-0">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-2 px-5 pt-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
      <div className="grid grid-cols-2 gap-2 px-5 py-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="border-t px-5 py-4">
        <Skeleton className="h-8 w-24" />
      </div>
    </Card>
  );
}
