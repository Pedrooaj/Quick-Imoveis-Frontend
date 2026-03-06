import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home as HomeIcon,
  Users,
  Handshake,
  Building2,
  Shield,
  FileCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Quick Imóveis
          </span>
          <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/imoveis">Ver imóveis</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Onde compradores e corretores{" "}
            <span className="text-primary">se encontram</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Quick Imóveis é a plataforma que conecta quem busca o imóvel ideal
            com os profissionais que podem ajudar a realizar esse sonho.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground sm:text-base">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Recomendações personalizadas
            </li>
            <li className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Transparência e segurança
            </li>
            <li className="flex items-center gap-2">
              <FileCheck className="size-4 text-primary" />
              Processo simplificado
            </li>
          </ul>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/register">Começar agora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:mb-12 sm:text-3xl">
            Como funciona
          </h2>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-sm sm:gap-4 sm:p-6 md:p-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <HomeIcon className="size-7 text-primary" />
              </div>
              <h3 className="font-semibold">Plataforma única</h3>
              <p className="text-sm text-muted-foreground">
                Um só lugar para compradores encontrarem imóveis e corretores
                apresentarem suas ofertas. Cadastre-se, informe seu perfil e
                receba sugestões compatíveis com seu orçamento.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-sm sm:gap-4 sm:p-6 md:p-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-7 text-primary" />
              </div>
              <h3 className="font-semibold">Compradores</h3>
              <p className="text-sm text-muted-foreground">
                Informe renda mensal e valor de entrada. A plataforma cruza seus
                dados com as ofertas disponíveis e conecta você a corretores que
                podem ajudar com FGTS, financiamento e documentação.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-sm sm:gap-4 sm:p-6 md:p-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <Handshake className="size-7 text-primary" />
              </div>
              <h3 className="font-semibold">Corretores</h3>
              <p className="text-sm text-muted-foreground">
                Acesse leads qualificados com perfil financeiro completo. Foque
                em quem tem orçamento definido e está pronto para fechar,
                economizando tempo e aumentando suas chances de conversão.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Taxas Caixa */}
      <section className="border-t px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="size-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Taxas de corretagem
            </h2>
            <p className="text-muted-foreground">
              Todas as taxas de corretagem utilizadas na plataforma são da
              Caixa Econômica Federal, instituição referência em crédito
              imobiliário e financiamento habitacional no Brasil.
            </p>
            <div className="grid gap-4 pt-4 text-left sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-2 font-medium">Para compradores</h4>
                <p className="text-sm text-muted-foreground">
                  Consulte as taxas oficiais da Caixa para planejar seu
                  financiamento e saber exatamente o valor das parcelas e da
                  corretagem.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-2 font-medium">Para corretores</h4>
                <p className="text-sm text-muted-foreground">
                  Trabalhe com valores padronizados e transparentes, sem
                  surpresas. As taxas seguem a tabela oficial da Caixa
                  Econômica Federal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Pronto para encontrar seu imóvel?
          </h2>
          <p className="mb-6 text-muted-foreground">
            Crie sua conta gratuitamente e comece a explorar as melhores
            oportunidades. Seja você comprador ou corretor, a plataforma foi
            pensada para facilitar a conexão e acelerar o processo de compra.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Quick Imóveis
          </span>
          <div className="flex gap-6">
            <Link
              href="/imoveis"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Imóveis
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Registrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
