"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import type { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreatePropertyWizard } from "@/components/create-property-wizard";
import { EditPropertyModal } from "@/components/edit-property-modal";
import { Card } from "@/components/ui/card";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { Plus } from "lucide-react";

function parsePropertiesResponse(data: unknown): Property[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  let items = (obj.data ?? obj.items ?? obj.properties) as unknown;
  if (Array.isArray(items)) return items as Property[];
  // API pode retornar um único objeto em data
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return [items as Property];
  }
  return [];
}

export function PropertiesContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isCorretor = profile?.role?.toUpperCase() === "CORRETOR";
  const needsCreci = isCorretor && (!profile?.creci || profile.creci.trim() === "");

  async function fetchProfile() {
    try {
      const data = (await apiFetch("/auth/profile")) as Profile;
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }

  async function fetchProperties() {
    setLoading(true);
    try {
      const data = await apiFetch("/property");
      setProperties(parsePropertiesResponse(data));
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    fetchProperties();
  }, []);

  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, []);

  async function handleDelete() {
    if (!deleteProperty) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/property/${deleteProperty.id}`, { method: "DELETE" });
      setDeleteProperty(null);
      await fetchProperties();
      toast.success("Imóvel excluído com sucesso!");
    } catch {
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {needsCreci && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertDescription>
            Para criar anúncios de imóveis, é necessário informar seu CRECI no
            perfil.{" "}
            <Link
              href="/perfil?edit=1"
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              Ir para o perfil e preencher o CRECI
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus anúncios</h1>
          <p className="mt-1 text-muted-foreground">
            {properties.length}{" "}
            {properties.length === 1 ? "anúncio cadastrado" : "anúncios cadastrados"}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={needsCreci}
          title={needsCreci ? "Informe seu CRECI no perfil para criar anúncios" : undefined}
        >
          <Plus className="mr-2 size-4" />
          Criar imóvel
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum imóvel cadastrado. Clique em &quot;Criar imóvel&quot; para
            começar.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              variant="my-properties"
              onEdit={setEditProperty}
              onDelete={setDeleteProperty}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto pb-8 pt-6">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle>Criar imóvel</DialogTitle>
            <DialogDescription>
              Preencha as etapas para cadastrar um novo imóvel.
            </DialogDescription>
          </DialogHeader>
          <CreatePropertyWizard
            onComplete={() => {
              setCreateOpen(false);
              fetchProperties();
            }}
          />
        </DialogContent>
      </Dialog>

      <EditPropertyModal
        property={editProperty}
        open={!!editProperty}
        onOpenChange={(open) => !open && setEditProperty(null)}
        onSuccess={fetchProperties}
      />

      <AlertDialog
        open={!!deleteProperty}
        onOpenChange={(open) => !open && setDeleteProperty(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imóvel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteProperty?.title}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
