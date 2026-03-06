"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Profile, ProfileAddress } from "@/types/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

function hasAddress(addr: ProfileAddress | null | undefined): boolean {
  if (!addr) return false;
  return !!(
    addr.street ||
    addr.city ||
    addr.postal_code ||
    addr.country ||
    addr.neighborhood
  );
}

export function FinancialDataModal() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();

  function fetchProfile() {
    apiFetch("/auth/profile")
      .then((data: Profile & { needs_role?: boolean; needsRole?: boolean }) => {
        setProfile(data);
      })
      .catch(() => setProfile(null));
  }

  useEffect(() => {
    fetchProfile();
    const handler = () => fetchProfile();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, []);

  const needsFinancialData =
    profile &&
    (profile.renda_mensal == null || profile.renda_mensal === 0) &&
    (profile.valor_entrada == null || profile.valor_entrada === 0);

  const needsAddress = profile && !hasAddress(profile.address);

  const needsRole =
    profile &&
    ((profile as unknown as { needs_role?: boolean; needsRole?: boolean })
      .needs_role ??
      (profile as unknown as { needsRole?: boolean }).needsRole ??
      !profile.role);

  const shouldShowModal =
    profile && (needsFinancialData || needsAddress || needsRole);

  const needsCreci =
    profile?.role === "CORRETOR" &&
    (!profile.creci || profile.creci.trim() === "");

  if (!shouldShowModal) return null;

  const missingSections: string[] = [];
  if (needsFinancialData) {
    missingSections.push("sua renda mensal e o valor de entrada");
  }
  if (needsAddress) {
    missingSections.push("seu endereço");
  }
  if (needsRole) {
    missingSections.push("o tipo de conta (comprador ou corretor)");
  }

  const descriptionText =
    missingSections.length === 1
      ? `Para personalizar suas recomendações de imóveis e liberar todos os recursos, complete ${missingSections[0]}.`
      : `Para personalizar suas recomendações de imóveis e liberar todos os recursos, complete ${missingSections
          .slice(0, -1)
          .join(", ")} e ${missingSections[missingSections.length - 1]}.`;

  return (
    <Dialog open={showModal} onOpenChange={(open) => setShowModal(open)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        {needsCreci && (
          <Alert className="border-warning/30 bg-warning/10">
            <AlertDescription>
              Como corretor, você precisa informar seu CRECI na página de
              perfil para conseguir anunciar imóveis.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(false)}
          >
            Agora não
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowModal(false);
              router.push("/perfil?edit=1");
            }}
          >
            Ir para o perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
