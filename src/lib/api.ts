// lib/api.ts
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { parseApiError, isAuthError } from "./api-error";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...options.headers,
    ...(!isFormData && { "Content-Type": "application/json" }),
  };

  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();

  if (!res.ok) {
    const message = parseApiError(text, res.status);
    toast.error(message);

    if (isAuthError(res.status)) {
      await signOut({ callbackUrl: "/login", redirect: true });
    }

    throw new ApiError(message, res.status);
  }

  return text.trim() ? JSON.parse(text) : {};
}

/** Fetch público - sem auth, sem toast/signOut em erro. Para listagens públicas. */
export async function fetchPublic(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(options.method !== "GET" &&
      !isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };
  const url = `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });

      // Render retorna 502/503 durante cold start — retry
      if ((res.status === 502 || res.status === 503) && attempt < maxRetries) {
        await delay(2_000 * (attempt + 1));
        continue;
      }

      const text = await res.text();
      if (!res.ok) return null;
      return text.trim() ? JSON.parse(text) : {};
    } catch {
      // Falha de rede (servidor ainda acordando)
      if (attempt < maxRetries) {
        await delay(2_000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }

  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
