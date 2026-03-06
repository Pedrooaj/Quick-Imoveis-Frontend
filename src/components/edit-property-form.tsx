"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, fetchPublic } from "@/lib/api";
import { toast } from "sonner";
import type { Property, PropertyCreate } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyImagesUpload } from "@/components/property-images-upload";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Informações", description: "Dados básicos" },
  { id: 2, title: "Endereço", description: "Localização" },
  { id: 3, title: "Imagens", description: "Fotos do imóvel" },
] as const;

const PROPERTY_TYPES = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "TERRENO", label: "Terreno" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "RURAL", label: "Rural" },
];

const STATUS_OPTIONS = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "VENDIDO", label: "Vendido" },
];

export function EditPropertyForm({
  property,
  onSuccess,
}: {
  property: Property;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<PropertyCreate>({
    title: property.title ?? "",
    description: property.description ?? "",
    property_type: property.property_type ?? "APARTAMENTO",
    price: property.price ?? 0,
    area: property.area ?? 0,
    bedrooms: property.bedrooms ?? 0,
    status: property.status ?? "RASCUNHO",
    address: property.address ?? {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "Brasil",
      postal_code: "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brazilianStates, setBrazilianStates] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchPublic("/common/brazilian-states")
      .then((data: unknown) => {
        if (!isMounted || !data || typeof data !== "object") return;
        const list = (data as { states?: string[] }).states;
        if (Array.isArray(list)) setBrazilianStates(list);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const isLastFormStep = currentStep === 2;
  const isImagesStep = currentStep === 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        address: {
          ...form.address,
          lat: form.address?.lat != null && Number.isFinite(form.address.lat) ? form.address.lat : undefined,
          lng: form.address?.lng != null && Number.isFinite(form.address.lng) ? form.address.lng : undefined,
        },
      };
      await apiFetch(`/property/${property.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      router.refresh();
      onSuccess?.();
      toast.success("Imóvel atualizado com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar.";
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message ?? msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (isLastFormStep) {
      setCurrentStep(3);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
    setError("");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Indicador de passos */}
      <div className="space-y-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, (currentStep / 3) * 100)}%` }}
          />
        </div>

        <nav aria-label="Progresso da edição" className="flex items-stretch justify-between gap-2">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isClickable = step.id <= currentStep;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.id} className="flex flex-1 items-stretch">
                <button
                  type="button"
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  disabled={!isClickable}
                  className={`group flex flex-1 flex-col items-center justify-center gap-2 rounded-lg px-3 py-3 transition-all ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  } ${
                    isActive
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted && step.id !== 3 ? (
                      <Check className="size-5" strokeWidth={2.5} />
                    ) : (
                      step.id
                    )}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={`text-xs font-medium sm:text-sm ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      {step.description}
                    </span>
                  </div>
                </button>
                {!isLast && (
                  <div
                    className={`flex shrink-0 items-center self-center px-1 transition-colors ${
                      isCompleted ? "text-primary/40" : "text-muted-foreground/30"
                    }`}
                    aria-hidden
                  >
                    <ChevronRight className="size-4" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Passo 3: Imagens */}
      {isImagesStep ? (
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Imagens do imóvel</h3>
            <p className="text-sm text-muted-foreground">
              Adicione e reordene as fotos do imóvel.
            </p>
          </div>
          <PropertyImagesUpload propertyId={property.id} />
          <div className="flex justify-between gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-1 size-4" />
              Voltar
            </Button>
            <Button
              onClick={() =>
                handleSubmit({
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>)
              }
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      ) : (
        /* Passos 1 e 2: Formulário */
        <form onSubmit={handleNext} className="flex flex-col gap-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Passo 1: Informações */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in-0 duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Informações do imóvel</h3>
                <p className="text-sm text-muted-foreground">
                  Altere os dados básicos do imóvel.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Ex: Apartamento 2 quartos centro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <textarea
                    id="edit-description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Descreva o imóvel..."
                    className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-property_type">Tipo</Label>
                    <Select
                      value={form.property_type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, property_type: v }))
                      }
                    >
                      <SelectTrigger id="edit-property_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, status: v }))
                      }
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Preço (R$) *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.price || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          price: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-area">Área (m²) *</Label>
                    <Input
                      id="edit-area"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.area || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          area: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bedrooms">Quartos</Label>
                    <Input
                      id="edit-bedrooms"
                      type="number"
                      min={0}
                      value={form.bedrooms || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bedrooms: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Passo 2: Endereço */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in-0 duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Endereço do imóvel</h3>
                <p className="text-sm text-muted-foreground">
                  Informe a localização do imóvel.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-street">Rua</Label>
                  <Input
                    id="edit-street"
                    value={form.address?.street ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, street: e.target.value },
                      }))
                    }
                    placeholder="Rua das Flores"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-number">Número</Label>
                  <Input
                    id="edit-number"
                    value={form.address?.number ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, number: e.target.value },
                      }))
                    }
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-neighborhood">Bairro</Label>
                  <Input
                    id="edit-neighborhood"
                    value={form.address?.neighborhood ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, neighborhood: e.target.value },
                      }))
                    }
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={form.address?.city ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, city: e.target.value },
                      }))
                    }
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Select
                    value={form.address?.state ?? ""}
                    onValueChange={(value) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, state: value },
                      }))
                    }
                  >
                    <SelectTrigger id="edit-state">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-postal_code">CEP</Label>
                  <Input
                    id="edit-postal_code"
                    value={form.address?.postal_code ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, postal_code: e.target.value },
                      }))
                    }
                    placeholder="01310-100"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-country">País</Label>
                  <Input
                    id="edit-country"
                    value={form.address?.country ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: { ...f.address, country: e.target.value },
                      }))
                    }
                    placeholder="Brasil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lat">Latitude</Label>
                  <Input
                    id="edit-lat"
                    type="number"
                    step="any"
                    value={form.address?.lat ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: {
                          ...f.address,
                          lat: e.target.value ? Number(e.target.value) : undefined,
                        },
                      }))
                    }
                    placeholder="-23.5505"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lng">Longitude</Label>
                  <Input
                    id="edit-lng"
                    type="number"
                    step="any"
                    value={form.address?.lng ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address: {
                          ...f.address,
                          lng: e.target.value ? Number(e.target.value) : undefined,
                        },
                      }))
                    }
                    placeholder="-46.6333"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-4 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-1 size-4" />
              Voltar
            </Button>
            <Button type="submit">
              Próximo
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
