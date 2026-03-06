"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "@/types/property";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Home,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Comments } from "@/components/comments";

export type PropertyOwner = {
  /** ID do corretor (users.id), se enviado pela API. */
  id?: string;
  name?: string;
  email?: string;
  creci?: string;
  phone?: string;
  whatsapp?: string;
  /** Datas opcionais de quando o corretor entrou na plataforma (user.created_at, joined_at, etc.) */
  created_at?: string;
  createdAt?: string;
  joined_at?: string;
};

export type PropertyDetail = Property & {
  created_at?: string;
  updated_at?: string;
  owner?: PropertyOwner;
  /** ID do corretor (users.id) associado ao imóvel, conforme API. */
  ownerId?: string;
};

/** Retorna todas as URLs de imagem do imóvel (para carrossel). */
function getImageUrls(property: PropertyDetail): string[] {
  const list: string[] = [];
  const imgs = property.images ?? [];
  for (const img of imgs) {
    const u = img?.image_url ?? img?.url;
    if (u) list.push(u);
  }
  if (list.length > 0) return list;
  const fallback = property.primary_image || property.image_url;
  if (fallback) return [fallback];
  return [];
}

const TYPE_LABELS: Record<string, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  TERRENO: "Terreno",
  COMERCIAL: "Comercial",
  RURAL: "Rural",
};

const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: "Disponível",
  VENDIDO: "Vendido",
};

function formatCurrency(value?: number) {
  if (value == null) return "—";
  return `R$ ${Number(value).toLocaleString("pt-BR")}`;
}

interface PropertyDetailContentProps {
  id: string;
  /** Dados já buscados no servidor: evita loading e melhora SEO. null = não encontrado; undefined = buscar no cliente. */
  initialData?: PropertyDetail | null;
}

export function PropertyDetailContent({ id, initialData }: PropertyDetailContentProps) {
  const [data, setData] = useState<PropertyDetail | null>(initialData ?? null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(initialData === undefined);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (initialData !== undefined) return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`);
        if (!isMounted) return;
        setStatusCode(res.status);
        if (res.ok) {
          const json = (await res.json()) as PropertyDetail;
          setData(json);
        } else {
          setData(null);
        }
      } catch {
        if (!isMounted) return;
        setData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id, initialData]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [data?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Imóvel não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível carregar os detalhes deste imóvel (status {statusCode ?? "desconhecido"}).
            Ele pode ter sido removido ou você não tem permissão para visualizá-lo.
          </p>
        </div>
      </div>
    );
  }

  const imageUrls = getImageUrls(data);
  const hasImages = imageUrls.length > 0;
  const currentUrl = imageUrls[carouselIndex] ?? null;
  const status = data.status ?? "";
  const statusLabel = STATUS_LABELS[status] ?? status ?? "—";
  // ownerId vem de data.ownerId ou, em fallback, de owner.id (se a API expuser assim)
  const ownerId = data.ownerId ?? data.owner?.id;
  const owner = data.owner;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
        {data.address && (data.address.city || data.address.neighborhood) && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {data.address.neighborhood && (
              <>
                {data.address.neighborhood}
                {data.address.city ? ", " : ""}
              </>
            )}
            {data.address.city}
            {data.address.state && ` - ${data.address.state}`}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {status && (
              <span
                className={`absolute right-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-medium ${
                  status === "DISPONIVEL"
                    ? "bg-emerald-500 text-emerald-50 shadow-sm dark:bg-emerald-500"
                    : status === "VENDIDO"
                    ? "bg-muted-foreground/90 text-background"
                    : "bg-background/90"
                }`}
              >
                {statusLabel}
              </span>
            )}
            {hasImages ? (
              <>
                <img
                  src={currentUrl ?? ""}
                  alt={`${data.title} (${carouselIndex + 1} de ${imageUrls.length})`}
                  className="size-full object-cover"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselIndex((i) => (i <= 0 ? imageUrls.length - 1 : i - 1))
                      }
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselIndex((i) => (i >= imageUrls.length - 1 ? 0 : i + 1))
                      }
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
                      {imageUrls.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCarouselIndex(i)}
                          className={`h-2 rounded-full transition ${
                            i === carouselIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/70"
                          }`}
                          aria-label={`Ir para imagem ${i + 1}`}
                        />
                      ))}
                    </div>
                    <span className="absolute left-3 bottom-3 z-10 rounded bg-black/50 px-2 py-1 text-xs text-white">
                      {carouselIndex + 1} / {imageUrls.length}
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-14" strokeWidth={1.25} />
                <span className="text-sm">Sem imagem</span>
              </div>
            )}
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-2xl font-semibold text-foreground">
                <DollarSign className="size-6" />
                {formatCurrency(data.price)}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {data.property_type && (
                  <span className="inline-flex items-center gap-1">
                    <Home className="size-4" />
                    {TYPE_LABELS[data.property_type] ?? data.property_type}
                  </span>
                )}
                {data.area != null && data.area > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="size-4" />
                    {data.area} m²
                  </span>
                )}
                {data.bedrooms != null && data.bedrooms > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="size-4" />
                    {data.bedrooms} quartos
                  </span>
                )}
              </div>
            </div>
            {data.description && (
              <div className="space-y-1.5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Descrição
                </h2>
                <p className="text-sm leading-relaxed text-foreground">
                  {data.description}
                </p>
              </div>
            )}
            {data.address && (
              <div className="space-y-1.5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Endereço
                </h2>
                <p className="text-sm text-foreground">
                  {[data.address.street, data.address.number].filter(Boolean).join(", ")}
                  {([data.address.street, data.address.number].filter(Boolean).length > 0) && <br />}
                  {[data.address.neighborhood, data.address.city].filter(Boolean).join(" - ")}
                  {data.address.state && ` / ${data.address.state}`}
                  {data.address.postal_code && (
                    <>
                      <br />
                      CEP: {data.address.postal_code}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h2 className="text-base font-semibold">Corretor responsável</h2>
              {owner ? (
                <>
                  <p className="text-sm text-foreground">
                    {owner.name ?? "Corretor"}
                    {owner.creci && (
                      <span className="text-muted-foreground"> • CRECI {owner.creci}</span>
                    )}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {owner.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="size-3.5" />
                        <a
                          href={`mailto:${owner.email}`}
                          className="hover:underline"
                        >
                          {owner.email}
                        </a>
                      </p>
                    )}
                    {owner.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5" />
                        <span>{owner.phone}</span>
                      </p>
                    )}
                    {owner.whatsapp && (
                      <p className="flex items-center gap-1.5">
                        <MessageCircle className="size-3.5" />
                        <span>{owner.whatsapp}</span>
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dados do corretor não disponíveis.
                </p>
              )}
            </div>
          </div>
          {owner && (owner.phone || owner.whatsapp) && (
            <div className="space-y-2 pt-1">
              {owner.phone && (
                <Button asChild className="w-full justify-start gap-2">
                  <a href={`tel:${owner.phone}`}>
                    <Phone className="size-4" />
                    Ligar agora
                  </a>
                </Button>
              )}
              {owner.whatsapp && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <a
                    href={`https://wa.me/${(owner.whatsapp || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Conversar no WhatsApp
                  </a>
                </Button>
              )}
            </div>
          )}
          {ownerId && (
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Link href={`/corretor/${ownerId}`}>
                <User className="size-4" />
                Ver portfólio do corretor
              </Link>
            </Button>
          )}
          <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
            Cadastrado em{" "}
            {data.created_at
              ? new Date(data.created_at).toLocaleDateString("pt-BR")
              : "—"}
          </div>
        </aside>
      </div>

      <Comments type="property" targetId={id} />
    </div>
  );
}

