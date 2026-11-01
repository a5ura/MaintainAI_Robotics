export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const configured = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000);
  const timeout = Number.isFinite(configured)
    ? Math.max(1000, Math.min(120000, configured))
    : 10000;
  let response: Response;
  try {
    response = await fetch(
      (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "") + path,
      {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(timeout),
      },
    );
  } catch {
    throw new Error(
      "Network failure. The service is unavailable or still waking up. Please retry shortly.",
    );
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {}
    throw new Error(detail);
  }
  return response.json();
}
