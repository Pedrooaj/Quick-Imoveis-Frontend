"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login" className="gap-2">
          <LogIn className="size-4" />
          Entrar
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register" className="gap-2">
          <UserPlus className="size-4" />
          Criar conta
        </Link>
      </Button>
    </div>
  );
}
