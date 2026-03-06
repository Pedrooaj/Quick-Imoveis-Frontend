import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { BackendStatusProvider } from "@/components/providers/backend-status-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BackendWakeUpBanner } from "@/components/backend-wake-up-banner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Imóveis",
  description:
    "Plataforma que conecta compradores e corretores para facilitar a compra de imóveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            <BackendStatusProvider>
              <BackendWakeUpBanner />
              {children}
            </BackendStatusProvider>
          </AuthSessionProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
