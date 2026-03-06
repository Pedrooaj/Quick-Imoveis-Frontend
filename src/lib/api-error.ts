/**
 * Formato típico de erro do NestJS
 */
export interface NestJsErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

const AUTH_MESSAGES: Record<number, string> = {
  401: "Sessão expirada. Faça login novamente.",
  403: "Você não tem permissão para esta ação.",
};

const ERROR_MESSAGES: Record<number, string> = {
  400: "Requisição inválida.",
  404: "Recurso não encontrado.",
  409: "Conflito. O recurso já existe ou foi alterado.",
  422: "Dados inválidos.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  502: "Serviço temporariamente indisponível.",
  503: "Serviço temporariamente indisponível.",
};

function parseMessage(body: NestJsErrorBody | string): string {
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as NestJsErrorBody;
      return parseMessage(parsed);
    } catch {
      return body || "Erro desconhecido.";
    }
  }

  const msg = body.message;
  if (Array.isArray(msg)) {
    const joined = msg.join(". ");
    return (
      joined ||
      ERROR_MESSAGES[body.statusCode ?? 500] ||
      "Erro desconhecido."
    );
  }
  if (typeof msg === "string" && msg.trim()) {
    return msg;
  }
  const status = body.statusCode ?? 500;
  return AUTH_MESSAGES[status] ?? ERROR_MESSAGES[status] ?? "Erro desconhecido.";
}

export function parseApiError(text: string, status?: number): string {
  try {
    const body = JSON.parse(text) as NestJsErrorBody;
    return parseMessage(body);
  } catch {
    if (status && AUTH_MESSAGES[status]) return AUTH_MESSAGES[status];
    if (status && ERROR_MESSAGES[status]) return ERROR_MESSAGES[status];
    return text?.trim() || "Erro desconhecido.";
  }
}

export function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}
