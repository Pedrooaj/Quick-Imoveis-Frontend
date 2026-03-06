import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    accessToken?: string;
    expiresIn?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    accessToken?: string;
    expiresAt?: number;
  }
} 