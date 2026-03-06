"use client";

import { Loader2, ServerCrash, WifiOff } from "lucide-react";
import { useBackendStatus } from "@/components/providers/backend-status-provider";
import { Button } from "@/components/ui/button";

/**
 * Overlay exibido enquanto o backend (Render free tier) está acordando.
 * Quando status === "awake", não renderiza nada.
 */
export function BackendWakeUpBanner() {
  const { status, recheck } = useBackendStatus();

  if (status === "awake") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center shadow-lg sm:p-8">
        {status === "checking" ? (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <h2 className="text-lg font-semibold">Conectando ao servidor…</h2>
            <p className="text-sm text-muted-foreground">
              Verificando a disponibilidade do servidor.
            </p>
          </>
        ) : (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <WifiOff className="size-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Servidor inicializando</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O servidor estava em modo de economia e está sendo iniciado.
              Isso pode levar de <strong>30 segundos a 2 minutos</strong>.
              Aguarde, a página carregará automaticamente.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Aguardando resposta do servidor…
            </div>
            <Button variant="outline" size="sm" onClick={recheck}>
              <ServerCrash className="mr-1.5 size-4" />
              Tentar novamente
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
