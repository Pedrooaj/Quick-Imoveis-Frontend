"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Link de verificação inválido. Token não encontrado.");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message ?? "Verificação falhou.");
          });
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Erro ao verificar e-mail.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Verificando seu e-mail...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm gap-4 py-5">
          <CardHeader className="space-y-0.5">
            <CardTitle className="text-2xl">Verificação falhou</CardTitle>
            <CardDescription>
              Não foi possível verificar seu e-mail. O link pode ter expirado
              (válido por 5 minutos).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Solicite um novo link de verificação em seu perfil.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm gap-4 py-5">
        <CardHeader className="space-y-0.5">
          <CardTitle className="text-2xl">E-mail verificado!</CardTitle>
          <CardDescription>
            Seu e-mail foi verificado com sucesso. Você já pode fazer login.
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2">
          <Button asChild className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
