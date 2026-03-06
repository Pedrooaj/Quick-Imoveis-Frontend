"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { PropertyImage } from "@/types/property";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronUp, ChevronDown } from "lucide-react";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 5;

function getImageUrl(img: PropertyImage): string | null {
  return img.image_url ?? img.url ?? null;
}

export function PropertyImagesUpload({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [reorderLoading, setReorderLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const data = await apiFetch(`/property/${propertyId}`);
      const prop = (data as { data?: { images?: PropertyImage[] } })?.data ?? (data as { images?: PropertyImage[] });
      const list = prop?.images ?? [];
      setImages(Array.isArray(list) ? list : []);
    } catch {
      setImages([]);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleReorder(direction: "up" | "down", index: number) {
    const newImages = [...images];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newImages.length) return;

    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    const imageIds = newImages.map((i) => i.id).filter(Boolean) as string[];

    setReorderLoading(true);
    try {
      await apiFetch(`/property/${propertyId}/images/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ image_ids: imageIds }),
      });
      setImages(newImages);
      router.refresh();
      toast.success("Ordem atualizada!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao reordenar.";
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message ?? msg);
      } catch {
        setError(msg);
      }
    } finally {
      setReorderLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!file) {
      const msg = "Selecione uma imagem.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const msg = `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      await apiFetch(`/property/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });

      setSuccess(true);
      setFile(null);
      await fetchImages();
      router.refresh();
      toast.success("Imagem adicionada!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar imagem.";
      try {
        const parsed = JSON.parse(message);
        if (parsed.message) setError(parsed.message);
        else setError(message);
      } catch {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-muted/20">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base">Imagens do imóvel</CardTitle>
        <CardDescription className="text-sm">
          Adicione imagens e reordene conforme a ordem de exibição desejada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-0">
        {images.length > 0 && (
          <div className="space-y-3">
            <Label>Imagens ({images.length})</Label>
            <div className="flex flex-col gap-2">
              {images.map((img, index) => {
                const url = getImageUrl(img);
                return (
                  <div
                    key={img.id ?? index}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2"
                  >
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={reorderLoading || index === 0}
                        onClick={() => handleReorder("up", index)}
                        aria-label="Mover para cima"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={reorderLoading || index === images.length - 1}
                        onClick={() => handleReorder("down", index)}
                        aria-label="Mover para baixo"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                    <div className="min-h-12 min-w-16 overflow-hidden rounded bg-muted">
                      {url ? (
                        <img
                          src={url}
                          alt=""
                          className="size-16 object-cover"
                        />
                      ) : (
                        <div className="flex size-16 items-center justify-center text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">Imagem {index + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4 border-t pt-5">
          <Label className="text-sm font-medium">Adicionar imagem</Label>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <AlertDescription>Imagem adicionada com sucesso!</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Imagem *</Label>
                <FileDropzone
                  accept={ACCEPTED_TYPES}
                  maxSize={MAX_SIZE_MB * 1024 * 1024}
                  file={file}
                  onFileChange={setFile}
                  onError={setError}
                  disabled={loading}
                  label="Arraste uma imagem ou clique para selecionar"
                  placeholder="JPEG, PNG, WebP ou GIF. Máximo 5MB."
                />
              </div>
            </div>
            <CardFooter className="pt-5">
              <Button type="submit" disabled={loading || !file}>
                {loading ? "Enviando..." : "Enviar imagem"}
              </Button>
            </CardFooter>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
