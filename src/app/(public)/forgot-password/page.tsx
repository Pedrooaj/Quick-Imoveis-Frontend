"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

const STEPS = [
  { num: 1, title: "Email" },
  { num: 2, title: "Código" },
  { num: 3, title: "Nova senha" },
] as const;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Erro ao enviar código. Tente novamente.");
        return;
      }

      setStep(2);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      const msg = "Digite o código de 6 dígitos.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setStep(3);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      const msg = "As senhas não coincidem.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "A senha deve ter pelo menos 6 caracteres.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code,
            newPassword: password,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        const msg = parseApiError(text, res.status);
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Senha alterada com sucesso! Faça login.");
      setSuccess(true);
    } catch {
      const msg = "Erro de conexão. Tente novamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm gap-4 py-5">
          <CardHeader className="space-y-0.5">
            <CardTitle className="text-2xl">Senha alterada</CardTitle>
            <CardDescription>
              Sua senha foi redefinida com sucesso. Você já pode fazer login.
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm gap-4 py-5">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === s.num
                      ? "bg-primary text-primary-foreground"
                      : step > s.num
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.num}
                </div>
                {s.num < 3 && (
                  <div
                    className={`h-0.5 w-6 ${
                      step > s.num ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-2xl">
              {step === 1 && "Esqueceu a senha?"}
              {step === 2 && "Digite o código"}
              {step === 3 && "Nova senha"}
            </CardTitle>
            <CardDescription>
              {step === 1 &&
                "Informe seu email e enviaremos um código de 6 dígitos"}
              {step === 2 && `Código enviado para ${email}`}
              {step === 3 && "Defina sua nova senha"}
            </CardDescription>
          </div>
        </CardHeader>

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <CardContent className="space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Continuar"}
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCodeSubmit}>
            <CardContent className="space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Código de 6 dígitos</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full">
                Continuar
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Usar outro email
              </button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Voltar ao código
              </button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
