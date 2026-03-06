"use client";

import { User } from "lucide-react";

interface RoleBadgeProps {
  role?: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;

  const isCorretor = role === "CORRETOR";
  const label = isCorretor ? "Corretor" : "Comprador";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isCorretor
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      <User className="size-3.5" />
      {label}
    </span>
  );
}
