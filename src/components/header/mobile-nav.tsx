"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Heart, Home, LayoutList, LogIn, Sparkles, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavProps {
  isAuthenticated: boolean;
  role?: string;
}

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

export function MobileNav({ isAuthenticated, role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    ...publicLinks,
    ...(isAuthenticated ? authLinks : []),
    ...(isAuthenticated && role === "CORRETOR" ? corretorLinks : []),
    ...(isAuthenticated ? authLinksEnd : []),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-left text-base font-semibold">
            Quick Imóveis
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-2 py-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {!isAuthenticated && (
          <div className="mt-auto border-t px-4 py-4">
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/login" onClick={() => setOpen(false)} className="gap-2">
                  <LogIn className="size-4" />
                  Entrar
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/register" onClick={() => setOpen(false)} className="gap-2">
                  <UserPlus className="size-4" />
                  Criar conta
                </Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
