"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublic } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

interface Corretor {
  id: string;
  name: string;
  email?: string;
  creci?: string;
  phone?: string;
  whatsapp?: string;
  favoritesCount?: number;
}

interface Meta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function parseResponse(data: unknown): { items: Corretor[]; meta: Meta } {
  if (!data || typeof data !== "object") return { items: [], meta: {} };
  const obj = data as Record<string, unknown>;
  const items = obj.data as unknown;
  const meta = (obj.meta ?? {}) as Meta;
  if (Array.isArray(items)) return { items: items as Corretor[], meta };
  return { items: [], meta };
}

export function CorretoresContent() {
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 12;

  const fetchCorretores = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());

    try {
      const data = await fetchPublic(`/corretores?${params.toString()}`);
      const { items, meta: m } = parseResponse(data);
      setCorretores(items);
      setMeta(m);
    } catch {
      setCorretores([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCorretores();
  }, [fetchCorretores]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const totalPages = meta.totalPages ?? 1;
  const total = meta.total ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Corretores</h1>
        <p className="text-base text-muted-foreground">
          {loading
            ? "Buscando corretores…"
            : total > 0
              ? `${total} ${total === 1 ? "corretor encontrado" : "corretores encontrados"}`
              : "Nenhum corretor encontrado"}
        </p>
      </div>

      {/* ── Busca ───────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative max-w-md flex-1">
          <Label htmlFor="search-corretor" className="sr-only">
            Buscar corretor
          </Label>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-corretor"
            placeholder="Buscar por nome ou CRECI…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
        {search && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
            Limpar
          </Button>
        )}
      </form>

      {/* ── Grid de corretores ──────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CorretorCardSkeleton key={i} />
          ))}
        </div>
      ) : corretores.length === 0 ? (
        <Card className="py-8 text-center sm:py-16">
          <p className="text-lg text-muted-foreground">
            Nenhum corretor encontrado.
          </p>
          {search && (
            <Button variant="outline" className="mt-4" onClick={clearSearch}>
              Limpar busca
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {corretores.map((c) => (
              <CorretorCard key={c.id} corretor={c} />
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

/* ------------------------------------------------------------------ */

function CorretorCard({ corretor: c }: { corretor: Corretor }) {
  return (
    <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
      {/* Avatar + nome */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{c.name}</h2>
          {c.creci && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              CRECI {c.creci}
            </span>
          )}
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        {c.email && (
          <p className="flex items-center gap-2 truncate">
            <Mail className="size-4 shrink-0" />
            <a href={`mailto:${c.email}`} className="truncate hover:underline">
              {c.email}
            </a>
          </p>
        )}
        {c.phone && (
          <p className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" />
            <a href={`tel:${c.phone}`} className="hover:underline">
              {c.phone}
            </a>
          </p>
        )}
        {c.whatsapp && (
          <p className="flex items-center gap-2">
            <MessageCircle className="size-4 shrink-0" />
            <a
              href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {c.whatsapp}
            </a>
          </p>
        )}
      </div>

      {/* Favoritos count */}
      {c.favoritesCount != null && c.favoritesCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Heart className="size-4 text-red-500" />
          <span>
            {c.favoritesCount}{" "}
            {c.favoritesCount === 1 ? "favorito" : "favoritos"} em seus imóveis
          </span>
        </div>
      )}

      {/* Ação */}
      <Button asChild variant="outline" className="mt-auto w-full">
        <Link href={`/corretor/${c.id}`}>Ver portfólio</Link>
      </Button>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function CorretorCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-auto h-9 w-full" />
    </Card>
  );
}
