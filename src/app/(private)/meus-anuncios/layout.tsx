import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function MeusAnunciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/meus-anuncios");
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "CORRETOR") {
    redirect("/imoveis");
  }

  return <>{children}</>;
}
