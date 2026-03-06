"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { ImoveisNav } from "@/components/imoveis-nav";

interface HeaderNavProps {
  isAuthenticated: boolean;
  role?: string;
}

export function HeaderNav({ isAuthenticated, role }: HeaderNavProps) {
  return (
    <nav className="flex items-center gap-3 sm:gap-4 lg:gap-6">
      <Link
        href="/imoveis"
        className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:gap-2 sm:text-lg"
      >
        <Building2 className="size-5" />
        Quick Imóveis
      </Link>
      <div className="hidden md:block">
        <ImoveisNav role={role} isAuthenticated={isAuthenticated} />
      </div>
    </nav>
  );
}
