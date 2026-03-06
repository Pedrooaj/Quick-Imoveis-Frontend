"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Profile, ProfileUpdate } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Mail, Banknote, Wallet, MapPin, Phone, MessageCircle, BadgeCheck, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrazilianStates } from "@/lib/use-brazilian-states";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAvatarSrc(avatar: string | null): string | undefined {
  if (!avatar) return undefined;
  return avatar;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdate>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [needsRole, setNeedsRole] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const searchParams = useSearchParams();
  const brazilianStates = useBrazilianStates();

  useEffect(() => {
    apiFetch("/auth/profile")
      .then((data: Profile & { needs_role?: boolean }) => {
        setProfile(data);
        // needs_role pode vir do backend ou inferimos quando não há role definido
        setNeedsRole(
          (data as { needs_role?: boolean; needsRole?: boolean }).needs_role ??
            (data as { needsRole?: boolean }).needsRole ??
            !data.role
        );
        setFormData({
          name: data.name,
          creci: data.creci ?? undefined,
          phone: data.phone ?? undefined,
          whatsapp: data.whatsapp ?? undefined,
          renda_mensal: data.renda_mensal,
          valor_entrada: data.valor_entrada,
          address: data.address ?? undefined,
        });
      })
      .catch((err) => setError(err.message ?? "Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("edit") === "1") setEditing(true);
  }, [searchParams]);

  async function handleSave() {
    if (!profile) return;
    setError("");
    setSaving(true);

    try {
      const data = new FormData();
      if (formData.name != null && formData.name !== "") {
        data.append("name", formData.name);
      }
      if (formData.creci != null && formData.creci !== "") {
        data.append("creci", formData.creci);
      }
      if (formData.phone != null && formData.phone !== "") {
        data.append("phone", formData.phone);
      }
      if (formData.whatsapp != null && formData.whatsapp !== "") {
        data.append("whatsapp", formData.whatsapp);
      }
      if (formData.renda_mensal != null)
        data.append("renda_mensal", String(formData.renda_mensal));
      if (formData.valor_entrada != null)
        data.append("valor_entrada", String(formData.valor_entrada));
      if (formData.address && Object.keys(formData.address).length > 0) {
        const addr = formData.address;
        if (addr.street != null) data.append("address[street]", addr.street);
        if (addr.number != null) data.append("address[number]", addr.number);
        if (addr.neighborhood != null)
          data.append("address[neighborhood]", addr.neighborhood);
        if (addr.city != null) data.append("address[city]", addr.city);
        if (addr.state != null) data.append("address[state]", addr.state);
        if (addr.country != null) data.append("address[country]", addr.country);
        if (addr.postal_code != null)
          data.append("address[postal_code]", addr.postal_code);
        if (addr.lat != null)
          data.append("address[lat]", String(addr.lat));
        if (addr.lng != null)
          data.append("address[lng]", String(addr.lng));
      }
      if (avatarFile) data.append("avatar", avatarFile);

      const updated = (await apiFetch("/auth/profile", {
        method: "PATCH",
        body: data,
      })) as Profile;
      setProfile(updated);
      setAvatarFile(null);
      setFormData({
        name: updated.name,
        creci: updated.creci ?? undefined,
        phone: updated.phone ?? undefined,
        whatsapp: updated.whatsapp ?? undefined,
        renda_mensal: updated.renda_mensal,
        valor_entrada: updated.valor_entrada,
        address: updated.address ?? undefined,
      });
      setEditing(false);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestVerification() {
    setError("");
    setVerificationSending(true);
    try {
      await apiFetch("/auth/request-email-verification", {
        method: "POST",
      });
      setVerificationSent(true);
      toast.success("E-mail de verificação enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar e-mail.");
    } finally {
      setVerificationSending(false);
    }
  }

  async function handleChooseRole(role: "COMPRADOR" | "CORRETOR") {
    if (!profile) return;
    setError("");
    setRoleSaving(true);
    try {
      const updated = (await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ role }),
      })) as Profile & { needs_role?: boolean; needsRole?: boolean };
      setProfile(updated);
      setNeedsRole(
        (updated as { needs_role?: boolean; needsRole?: boolean }).needs_role ??
          (updated as { needsRole?: boolean }).needsRole ??
          !updated.role
      );
      toast.success(
        role === "CORRETOR"
          ? "Tipo de conta atualizado para Corretor."
          : "Tipo de conta atualizado para Comprador."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar tipo de conta"
      );
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    setDeleting(true);
    try {
      await apiFetch("/auth/account", {
        method: "DELETE",
      });
      toast.success("Conta desativada com sucesso.");
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao desativar a conta"
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
                <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
                <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <div className="mt-2 flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="space-y-0.5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  const isCorretor = profile.role?.toUpperCase() === "CORRETOR";
  const needsCreci = isCorretor && (!profile.creci || profile.creci.trim() === "");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        {!editing && (
          <Button onClick={() => setEditing(true)}>Editar perfil</Button>
        )}
      </div>

      {needsRole && (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Escolha o tipo de conta</p>
              <p className="text-sm text-muted-foreground">
                Para personalizar sua experiência, informe se você usa o Quick
                Imóveis como comprador ou corretor.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChooseRole("COMPRADOR")}
                disabled={roleSaving}
              >
                Sou comprador
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChooseRole("CORRETOR")}
                disabled={roleSaving}
              >
                Sou corretor
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {needsCreci && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertDescription>
            Como corretor, é necessário informar seu CRECI no perfil para poder
            realizar anúncios de imóveis. Preencha o campo CRECI abaixo e salve.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6">
        {/* Card de perfil com avatar */}
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
              <div className="shrink-0">
                {profile.avatar ? (
                  <img
                    src={getAvatarSrc(profile.avatar)}
                    alt="Avatar"
                    className="size-16 rounded-full object-cover ring-4 ring-background shadow-md sm:size-24"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-4 ring-background shadow-md sm:size-24 sm:text-2xl">
                    {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="w-full text-center sm:text-left">
                <h2 className="text-lg font-semibold sm:text-xl">{profile.name}</h2>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{profile.email}</p>
                {profile.address &&
                  (profile.address.street ||
                    profile.address.city ||
                    profile.address.postal_code ||
                    profile.address.country) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[
                      profile.address.street,
                      profile.address.number,
                      profile.address.neighborhood,
                      profile.address.city,
                      profile.address.state,
                      profile.address.postal_code,
                      profile.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {(profile.phone || profile.whatsapp || (profile.role === "CORRETOR" && profile.creci)) && (
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {profile.creci && profile.role === "CORRETOR" && (
                      <span>CRECI: {profile.creci}</span>
                    )}
                    {profile.phone && <span>{profile.phone}</span>}
                    {profile.whatsapp && <span>WhatsApp: {profile.whatsapp}</span>}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                    {profile.role?.toLowerCase() ?? "—"}
                  </span>
                  {!profile.is_email_verified && (
                    <span className="inline-block rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning">
                      E-mail não verificado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {!profile.is_email_verified && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Verifique seu e-mail</p>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de verificação para {profile.email}. O link
                  expira em 5 minutos.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestVerification}
                disabled={verificationSending || verificationSent}
                className="shrink-0"
              >
                {verificationSending
                  ? "Enviando..."
                  : verificationSent
                    ? "E-mail enviado!"
                    : "Reenviar link"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Card de dados */}
        <Card>
          <CardHeader className="space-y-0.5">
            <CardTitle>Informações</CardTitle>
            <CardDescription>
              Seus dados pessoais e financeiros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Foto de perfil</Label>
                  <FileDropzone
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    maxSize={2 * 1024 * 1024}
                    file={avatarFile}
                    onFileChange={setAvatarFile}
                    onError={setError}
                    disabled={saving}
                    label="Arraste uma imagem ou clique para selecionar"
                    placeholder="JPEG, PNG, WebP ou GIF. Máximo 2MB."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="size-4" />
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={formData.name ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Seu nome"
                  />
                </div>
                {profile.role === "CORRETOR" && (
                  <div className="space-y-2">
                    <Label htmlFor="creci" className="flex items-center gap-2">
                      <BadgeCheck className="size-4" />
                      CRECI
                    </Label>
                    <Input
                      id="creci"
                      value={formData.creci ?? ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, creci: e.target.value }))
                      }
                      placeholder="Ex: 12345-F"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="size-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <MessageCircle className="size-4" />
                    WhatsApp (com DDD)
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, whatsapp: e.target.value }))
                    }
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renda_mensal" className="flex items-center gap-2">
                    <Banknote className="size-4" />
                    Renda mensal (R$)
                  </Label>
                  <Input
                    id="renda_mensal"
                    type="number"
                    value={formData.renda_mensal ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        renda_mensal: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_entrada" className="flex items-center gap-2">
                    <Wallet className="size-4" />
                    Valor de entrada (R$)
                  </Label>
                  <Input
                    id="valor_entrada"
                    type="number"
                    value={formData.valor_entrada ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        valor_entrada: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Ex: 50000"
                  />
                </div>
                <div className="space-y-4 border-t pt-4 sm:col-span-2">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="size-4" />
                      Endereço
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Opcional
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="addr-street">Rua</Label>
                      <Input
                        id="addr-street"
                        value={formData.address?.street ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), street: e.target.value },
                          }))
                        }
                        placeholder="Rua das Flores"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-number">Número</Label>
                      <Input
                        id="addr-number"
                        value={formData.address?.number ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), number: e.target.value },
                          }))
                        }
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-neighborhood">Bairro</Label>
                      <Input
                        id="addr-neighborhood"
                        value={formData.address?.neighborhood ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), neighborhood: e.target.value },
                          }))
                        }
                        placeholder="Centro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-city">Cidade</Label>
                      <Input
                        id="addr-city"
                        value={formData.address?.city ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), city: e.target.value },
                          }))
                        }
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-state">Estado</Label>
                      <Select
                        value={formData.address?.state ?? ""}
                        onValueChange={(value) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), state: value },
                          }))
                        }
                      >
                        <SelectTrigger id="addr-state">
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
                      <Label htmlFor="addr-postal_code">CEP</Label>
                      <Input
                        id="addr-postal_code"
                        value={formData.address?.postal_code ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), postal_code: e.target.value },
                          }))
                        }
                        placeholder="01310-100"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="addr-country">País</Label>
                      <Input
                        id="addr-country"
                        value={formData.address?.country ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...(p.address ?? {}), country: e.target.value },
                          }))
                        }
                        placeholder="Brasil"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-lat">Latitude</Label>
                      <Input
                        id="addr-lat"
                        type="number"
                        step="any"
                        value={formData.address?.lat ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: {
                              ...(p.address ?? {}),
                              lat: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }))
                        }
                        placeholder="-23.5505"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-lng">Longitude</Label>
                      <Input
                        id="addr-lng"
                        type="number"
                        step="any"
                        value={formData.address?.lng ?? ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: {
                              ...(p.address ?? {}),
                              lng: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }))
                        }
                        placeholder="-46.6333"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="size-4" />
                    Nome
                  </p>
                  <p>{profile.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="size-4" />
                    Email
                  </p>
                  <p>{profile.email}</p>
                  {!profile.is_email_verified && (
                    <p className="text-xs text-warning">
                      Email não verificado
                    </p>
                  )}
                </div>
                {profile.role === "CORRETOR" && profile.creci && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BadgeCheck className="size-4" />
                      CRECI
                    </p>
                    <p>{profile.creci}</p>
                  </div>
                )}
                {profile.phone && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="size-4" />
                      Telefone
                    </p>
                    <p>{profile.phone}</p>
                  </div>
                )}
                {profile.whatsapp && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </p>
                    <p>{profile.whatsapp}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Banknote className="size-4" />
                    Renda mensal
                  </p>
                  <p>
                    {profile.renda_mensal != null
                      ? `R$ ${profile.renda_mensal.toLocaleString("pt-BR")}`
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wallet className="size-4" />
                    Valor de entrada
                  </p>
                  <p>
                    {profile.valor_entrada != null
                      ? `R$ ${profile.valor_entrada.toLocaleString("pt-BR")}`
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Conta criada em
                  </p>
                  <p>{formatDate(profile.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Último login
                  </p>
                  <p>{formatDate(profile.last_login)}</p>
                </div>
                {profile.address &&
                  (profile.address.street ||
                    profile.address.city ||
                    profile.address.postal_code ||
                    profile.address.country) && (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="size-4" />
                      Endereço
                    </p>
                    <p>
                      {[
                        profile.address.street,
                        profile.address.number,
                        profile.address.neighborhood,
                        profile.address.city,
                        profile.address.state,
                        profile.address.postal_code,
                        profile.address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {editing && (
            <CardFooter className="flex flex-col gap-2 border-t px-4 pt-6 sm:flex-row sm:px-6">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setAvatarFile(null);
                  setFormData({
                    name: profile.name,
                    creci: profile.creci ?? undefined,
                    phone: profile.phone ?? undefined,
                    whatsapp: profile.whatsapp ?? undefined,
                    renda_mensal: profile.renda_mensal,
                    valor_entrada: profile.valor_entrada,
                    address: profile.address ?? undefined,
                  });
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-4" />
              Desativar conta
            </CardTitle>
            <CardDescription>
              Esta ação desativa sua conta. Você não poderá mais acessar o
              Quick Imóveis com este e-mail até que um administrador reative
              sua conta ou você crie uma nova.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todos os tokens de acesso atuais deixarão de funcionar nas
              próximas requisições. Você será desconectado imediatamente após a
              confirmação.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  Desativar conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja desativar sua conta? Você será
                    desconectado e não poderá mais acessar o Quick Imóveis com
                    este e-mail até que a conta seja reativada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!deleting) void handleDeleteAccount();
                    }}
                    disabled={deleting}
                  >
                    {deleting ? "Desativando..." : "Sim, desativar conta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
