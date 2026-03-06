import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinancialDataModal } from "@/components/financial-data-modal";
import { AppHeader } from "@/components/app-header";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/imoveis");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <FinancialDataModal />
      <AppHeader />
      <main className="flex-1 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
