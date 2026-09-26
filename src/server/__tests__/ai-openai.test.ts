import { afterEach, describe, expect, it, vi } from "vitest";
import { chatCompletion, ping } from "@/server/ai/openai-compatible";
import { AiRequestError } from "@/server/ai/types";

const cfg = { baseUrl: "https://api.example.com/v1/", apiKey: "k", model: "m1", label: "Example" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const mockFetch = (...responses: Response[]) => {
  const f = vi.fn();
  responses.forEach((r) => f.mockResolvedValueOnce(r));
  vi.stubGlobal("fetch", f);
  return f;
};

afterEach(() => vi.unstubAllGlobals());

describe("chatCompletion", () => {
  it("posts an OpenAI-style request and returns the text", async () => {
    const f = mockFetch(json({ choices: [{ message: { content: "# Deck" } }] }));
    expect(await chatCompletion(cfg, { system: "s", user: "u", maxTokens: 5 }, AbortSignal.timeout(1000))).toBe("# Deck");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer k");
    expect(JSON.parse(init.body)).toMatchObject({ model: "m1", max_tokens: 5, messages: [{ role: "system" }, { role: "user" }] });
  });

  it("surfaces upstream errors with their status", async () => {
    mockFetch(json({ error: { message: "slow down" } }, 429));
    const err = await chatCompletion(cfg, { system: "s", user: "u", maxTokens: 5 }, AbortSignal.timeout(1000)).catch((e) => e);
    expect(err).toBeInstanceOf(AiRequestError);
    expect([err.status, err.rateLimited, err.message]).toEqual([429, true, "slow down"]);
  });
});

describe("ping", () => {
  it("lists models and reports whether the configured model exists", async () => {
    mockFetch(json({ data: [{ id: "models/m1" }, { id: "m2" }] }));
    expect(await ping(cfg)).toMatchObject({ ok: true, method: "models", models: 2, modelListed: true });
  });

  it("reports a rejected key without trying a completion", async () => {
    const f = mockFetch(json({ error: { message: "bad key" } }, 401));
    expect(await ping(cfg)).toMatchObject({ ok: false, status: 401, error: "bad key" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falls back to a 1-token completion when /models is unsupported", async () => {
    const f = mockFetch(json({}, 404), json({ choices: [{ message: { content: "" }, finish_reason: "length" }] }));
    expect(await ping(cfg)).toMatchObject({ ok: true, method: "chat" });
    expect(f.mock.calls[1][0]).toBe("https://api.example.com/v1/chat/completions");
  });

  it("fails when the completion fails too", async () => {
    mockFetch(json({}, 404), json({ error: "no such model" }, 404));
    expect(await ping(cfg)).toMatchObject({ ok: false, method: "chat", status: 404, error: "no such model" });
  });
});
