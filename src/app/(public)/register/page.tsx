"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "COMPRADOR", label: "Comprador" },
  { value: "CORRETOR", label: "Corretor" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

    if (!role) {
      const msg = "Selecione o tipo de conta.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-up`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        const msg = parseApiError(text, res.status);
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Conta criada com sucesso! Faça login.");
      router.push("/login");
      router.refresh();
    } catch {
      const msg = "Erro de conexão. Tente novamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm gap-4 py-5">
        <CardHeader className="space-y-0.5">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label>Tipo de conta</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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
              {loading ? "Criando conta..." : "Registrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
