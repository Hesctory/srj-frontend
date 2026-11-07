import { describe, expect, it, vi } from "vitest";
import { WORKBENCH_API_URL, workbenchRequest } from "./client";

const jsonResponse = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("workbench client", () => {
  it("calls the fixed local host with JSON and no credentials", async () => {
    localStorage.setItem("token", "test-jwt");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { a: 1 }));

    const result = await workbenchRequest(
      "POST",
      "/workspace/date",
      { date: "2026-03-02" },
      fetchMock,
    );

    expect(result).toEqual({ ok: true, status: 200, data: { a: 1 } });
    expect(WORKBENCH_API_URL).toBe("http://127.0.0.1:4100/api");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:4100/api/workspace/date");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe('{"date":"2026-03-02"}');
    expect(JSON.stringify(init)).not.toContain("test-jwt");
  });

  it("sends no body and no Content-Type on a GET", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    await workbenchRequest("GET", "/log", undefined, fetchMock);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({});
    expect(init.body).toBeUndefined();
  });

  it("returns a refusal's message exactly as the server wrote it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(409, { message: "The date only moves forward." }),
      );
    expect(
      await workbenchRequest("POST", "/workspace/date", {}, fetchMock),
    ).toEqual({
      ok: false,
      status: 409,
      message: "The date only moves forward.",
    });
  });

  it("says when a failure has no message, and when the host is down", async () => {
    const empty = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    expect(await workbenchRequest("GET", "/status", undefined, empty)).toEqual({
      ok: false,
      status: 500,
      message: "La solicitud falló (500)",
    });

    const down = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await workbenchRequest("GET", "/status", undefined, down);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.message).toContain("Failed to fetch");
    expect(result.status).toBe(0);
  });
});
