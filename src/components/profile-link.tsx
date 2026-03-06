"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export function ProfileLink() {
  const pathname = usePathname();
  const isActive = pathname === "/perfil";

  return (
    <Link
      href="/perfil"
      className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground ${
        isActive ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <User className="size-4" />
      Perfil
    </Link>
  );
}
