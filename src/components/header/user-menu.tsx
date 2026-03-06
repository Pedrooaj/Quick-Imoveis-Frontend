"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { apiFetch } from "@/lib/api";
import { RoleBadge } from "./role-badge";

interface UserMenuProps {
  name: string;
  role?: string;
}

export function UserMenu({ name, role }: UserMenuProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignora erro: o importante é limpar a sessão no cliente
    } finally {
      await signOut({ callbackUrl: "/", redirect: true });
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <RoleBadge role={role} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 font-normal">
              {name}
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center gap-2">
                <User className="size-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setLogoutOpen(true);
              }}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sua conta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
