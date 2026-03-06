"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiFetch, fetchPublic } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Pencil,
  Send,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";

/* ── Tipos ──────────────────────────────────────────────────────── */

interface CommentAuthor {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  content: string;
  rating?: number | null;
  created_at: string;
  author: CommentAuthor;
}

interface CommentsMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function parseCommentsResponse(data: unknown): {
  items: Comment[];
  meta: CommentsMeta;
} {
  if (!data || typeof data !== "object") return { items: [], meta: {} };
  const obj = data as Record<string, unknown>;
  const items = (obj.data ?? obj.items ?? obj.results ?? obj.comments) as unknown;
  const meta = (obj.meta ?? {}) as CommentsMeta;
  if (Array.isArray(items)) return { items: items as Comment[], meta };
  return { items: [], meta };
}

/* ── Props ──────────────────────────────────────────────────────── */

interface CommentsProps {
  /** "property" ou "corretor" */
  type: "property" | "corretor";
  /** ID do imóvel ou do corretor */
  targetId: string;
}

/* ── Componente principal ───────────────────────────────────────── */

export function Comments({ type, targetId }: CommentsProps) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const isAuthenticated = status === "authenticated";

  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<CommentsMeta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Form de criação
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState<number>(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const basePath = `/comments/${type}`;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");

    try {
      const data = await fetchPublic(
        `${basePath}/${encodeURIComponent(targetId)}?${params.toString()}`
      );
      const { items, meta: m } = parseCommentsResponse(data);
      setComments(items);
      setMeta(m);
    } catch {
      setComments([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [basePath, targetId, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      await apiFetch(`${basePath}/${encodeURIComponent(targetId)}`, {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          ...(rating > 0 && { rating }),
        }),
      });
      setContent("");
      setRating(0);
      setPage(1);
      await fetchComments();
      toast.success("Comentário publicado!");
    } catch {
      // apiFetch already toasts the error
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return;
    setEditSubmitting(true);

    try {
      await apiFetch(`${basePath}/${encodeURIComponent(commentId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          content: editContent.trim(),
          ...(editRating > 0 ? { rating: editRating } : {}),
        }),
      });
      setEditingId(null);
      await fetchComments();
      toast.success("Comentário atualizado!");
    } catch {
      // apiFetch already toasts the error
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await apiFetch(`${basePath}/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      await fetchComments();
      toast.success("Comentário removido.");
    } catch {
      // apiFetch already toasts the error
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditRating(comment.rating ?? 0);
  }

  const totalPages = meta.totalPages ?? 1;
  const total = meta.total ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          Comentários
          {!loading && total > 0 && (
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ({total})
            </span>
          )}
        </h2>
      </div>

      {/* ── Formulário de novo comentário ────────────────────── */}
      {isAuthenticated ? (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              placeholder="Escreva um comentário…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex items-center justify-between gap-3">
              <RatingInput value={rating} onChange={setRating} />
              <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
                <Send className="mr-1.5 size-4" />
                {submitting ? "Enviando…" : "Comentar"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Faça login para deixar um comentário.
        </p>
      )}

      {/* ── Lista de comentários ─────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <Card key={c.id} className="px-4 py-3">
              {editingId === c.id ? (
                /* ── Modo edição ─────────────────────────────── */
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <RatingInput value={editRating} onChange={setEditRating} />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="mr-1 size-3.5" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={editSubmitting || !editContent.trim()}
                        onClick={() => handleEdit(c.id)}
                      >
                        {editSubmitting ? "Salvando…" : "Salvar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Modo visualização ───────────────────────── */
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar author={c.author} />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {c.author.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {userId === c.author.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => startEdit(c)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {c.rating != null && c.rating > 0 && (
                    <StarDisplay rating={c.rating} />
                  )}

                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Paginação ────────────────────────────────────────── */}
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
    </section>
  );
}

/* ── Sub-componentes ────────────────────────────────────────────── */

function Avatar({ author }: { author: CommentAuthor }) {
  if (author.avatar_url) {
    return (
      <img
        src={author.avatar_url}
        alt={author.name}
        className="size-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <User className="size-4" />
    </div>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1.5 text-xs text-muted-foreground">Nota:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(value === star ? 0 : star)}
          className="text-muted-foreground/40 transition-colors hover:text-yellow-500"
        >
          <Star
            className="size-5"
            fill={(hover || value) >= star ? "currentColor" : "none"}
            strokeWidth={1.5}
            style={{
              color: (hover || value) >= star ? "#eab308" : undefined,
            }}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="size-4"
          fill={rating >= star ? "currentColor" : "none"}
          strokeWidth={1.5}
          style={{ color: rating >= star ? "#eab308" : undefined }}
        />
      ))}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-3/4" />
    </Card>
  );
}
