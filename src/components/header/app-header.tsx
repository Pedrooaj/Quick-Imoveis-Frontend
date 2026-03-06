"use client";

import { useSession } from "next-auth/react";
import { AuthButtons } from "./auth-buttons";
import { HeaderNav } from "./header-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

type SessionUser = { name?: string; email?: string; role?: string };

export function AppHeader() {
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isAuthenticated = status === "authenticated";

  const userName = user?.name ?? user?.email ?? "Usuário";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav isAuthenticated={isAuthenticated} role={user?.role} />
          <HeaderNav isAuthenticated={isAuthenticated} role={user?.role} />
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu name={userName} role={user?.role} />
          ) : (
            <div className="hidden md:block">
              <AuthButtons />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
