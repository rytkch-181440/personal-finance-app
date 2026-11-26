type ApiCategory = Record<string, unknown>;

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getResponsePayload(response: Response): Promise<unknown> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    const detail =
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : `APIリクエストに失敗しました（${response.status}）。`;
    throw new Error(detail);
  }

  return payload;
}

export async function fetchCategories(
  email: string,
  password: string,
): Promise<ApiCategory[]> {
  const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const tokenPayload = await getResponsePayload(tokenResponse);

  if (!isRecord(tokenPayload) || typeof tokenPayload.access_token !== "string") {
    throw new Error("認証APIのレスポンス形式が正しくありません。");
  }

  const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const categoriesPayload = await getResponsePayload(categoriesResponse);

  if (
    !Array.isArray(categoriesPayload) ||
    !categoriesPayload.every(isRecord)
  ) {
    throw new Error("カテゴリAPIのレスポンス形式が正しくありません。");
  }

  return categoriesPayload;
}

export type { ApiCategory };
