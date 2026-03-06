"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutList, Sparkles, Users } from "lucide-react";

const publicLinks = [
  { href: "/imoveis", label: "Imóveis", icon: Home },
  { href: "/corretores", label: "Corretores", icon: Users },
];

const authLinks = [
  { href: "/recomendacoes", label: "Recomendações", icon: Sparkles },
];

const authLinksEnd = [
  { href: "/favoritos", label: "Favoritos", icon: Heart },
];

const corretorLinks = [
  { href: "/meus-anuncios", label: "Meus anúncios", icon: LayoutList },
];

export function ImoveisNav({ role, isAuthenticated }: { role?: string; isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/imoveis", label: "Imóveis", icon: Home },
    ...(isAuthenticated ? authLinks : []),
    { href: "/corretores", label: "Corretores", icon: Users },
    ...(isAuthenticated && role === "CORRETOR" ? corretorLinks : []),
    ...(isAuthenticated ? authLinksEnd : []),
  ];

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 lg:gap-4">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors hover:text-foreground sm:gap-1.5 sm:px-2 sm:text-sm lg:gap-2 ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon className="hidden size-4 sm:block" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
