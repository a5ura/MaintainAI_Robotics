import { afterEach, expect, it, vi } from "vitest";
import { api } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("provides a retry message for sleeping/unavailable services without retrying a write", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError("network"));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VITE_API_TIMEOUT_MS", "90000");
  await expect(api("/tickets", "POST", { title: "draft" })).rejects.toThrow(
    "Please retry shortly",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("preserves safe API quota errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ detail: "Daily shared demo budget exhausted" }),
      }),
  );
  await expect(api("/tickets")).rejects.toThrow(
    "Daily shared demo budget exhausted",
  );
});
