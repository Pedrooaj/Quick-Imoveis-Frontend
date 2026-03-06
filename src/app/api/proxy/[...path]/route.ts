import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const COLD_START_RETRIES = 2;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function proxyRequest(req: NextRequest) {
  const token = await getToken({ req });
  const accessToken = token?.accessToken as string | undefined;

  const apiPath = req.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  const url = `${API_URL}${apiPath}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  for (let attempt = 0; attempt <= COLD_START_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: req.method,
        headers,
        body,
      });

      // Render retorna 502/503 enquanto acorda
      if ((res.status === 502 || res.status === 503) && attempt < COLD_START_RETRIES) {
        await wait(2_000 * (attempt + 1));
        continue;
      }

      return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: {
          "content-type": res.headers.get("content-type") || "application/json",
        },
      });
    } catch {
      if (attempt < COLD_START_RETRIES) {
        await wait(2_000 * (attempt + 1));
        continue;
      }
      return NextResponse.json(
        { statusCode: 503, message: "Servidor temporariamente indisponível. Tente novamente em alguns instantes." },
        { status: 503 }
      );
    }
  }

  return NextResponse.json(
    { statusCode: 503, message: "Servidor temporariamente indisponível." },
    { status: 503 }
  );
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
