"use client";

import type { Property } from "@/types/property";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditPropertyForm } from "@/components/edit-property-form";

interface EditPropertyModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPropertyModal({
  property,
  open,
  onOpenChange,
  onSuccess,
}: EditPropertyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto pb-8 pt-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle>Editar imóvel</DialogTitle>
          <DialogDescription>
            Navegue pelas etapas para alterar os dados do imóvel.
          </DialogDescription>
        </DialogHeader>
        {property && (
          <EditPropertyForm
            property={property}
            key={property.id}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
