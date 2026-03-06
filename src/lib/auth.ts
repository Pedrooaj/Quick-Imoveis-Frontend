import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasGoogleAuth = !!googleClientId && !!googleClientSecret;

export const authOptions = {
  providers: [
    ...(hasGoogleAuth
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            authorization: {
              params: {
                prompt: "consent",
                scope: "openid email profile",
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-in`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.access_token,
          expiresIn: data.expires_in,
        };
      },
    }),
  ],
  callbacks: {
    async jwt(params: {
      token: JWT;
      user?: unknown;
      account?: unknown;
      trigger?: "update" | "signIn" | "signUp";
      session?: unknown;
    }) {
      const { token, user, account, trigger, session } = params;
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      const acc = account as { provider?: string; id_token?: string; access_token?: string } | null;
      const usr = user as { id?: string; role?: string; accessToken?: string; email?: string } | undefined;
      if (acc?.provider === "google" && (acc.id_token ?? acc.access_token)) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_token: acc.id_token,
                access_token: acc.access_token,
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.expiresAt = data.expires_in
              ? Date.now() + Number(data.expires_in) * 1000
              : undefined;
            token.role = data.user?.role;
            token.id = data.user?.id ?? usr?.email ?? "";
          }
        } catch {
          // Se o backend não tiver /auth/google, o login com Google falhará
        }
      }
      if (usr && acc?.provider === "credentials") {
        const usrExt = usr as { expiresIn?: number };
        token.accessToken = usr.accessToken;
        token.expiresAt = usrExt.expiresIn
          ? Date.now() + usrExt.expiresIn * 1000
          : undefined;
        token.role = usr.role;
        token.id = usr.id ?? "";
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 dias (alinhado ao backend)
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };