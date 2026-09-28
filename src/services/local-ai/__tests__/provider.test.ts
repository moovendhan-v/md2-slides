import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LocalAIProvider, LocalAIRequest, LocalAIToken, LocalAIStatus, LocalAICapabilities, LocalAIProgress } from "../types";
import { LocalAiDeckService, extractMarkdown } from "@/services/ai/local-provider";
import type { SlideEngine } from "@/engine/engine";
import type { Deck } from "@/engine/types";

class MockLocalAIProvider implements LocalAIProvider {
  public id = "mock-local";
  public name = "Mock Local Provider";
  public status: LocalAIStatus = { state: "ready", modelId: "test-model", backend: "webgpu" };
  public capabilities: LocalAICapabilities = {
    webGpuSupported: true,
    maxContextLength: 4096,
    streamingSupported: true,
    supportedModels: ["test-model"],
  };

  public mockTokens: string[] = [];
  public shouldError = false;

  async initialize(): Promise<void> {}
  async isSupported(): Promise<boolean> {
    return true;
  }
  async loadModel(modelId: string, onProgress?: (p: LocalAIProgress) => void): Promise<void> {
    this.status = { state: "ready", modelId, backend: "webgpu" };
    if (onProgress) onProgress({ text: "100%", progress: 1.0 });
  }
  async unloadModel(): Promise<void> {
    this.status = { state: "uninitialized" };
  }
  async checkModelInCache(): Promise<boolean> {
    return true;
  }
  async deleteModelFromCache(): Promise<void> {
    this.status = { state: "uninitialized" };
  }

  getStatus(): LocalAIStatus {
    return this.status;
  }
  getCapabilities(): LocalAICapabilities {
    return this.capabilities;
  }

  async *generate(request: LocalAIRequest): AsyncIterable<LocalAIToken> {
    if (this.shouldError) {
      throw new Error("Simulated inference failure");
    }

    let acc = "";
    for (const chunk of this.mockTokens) {
      if (request.signal?.aborted) {
        break;
      }
      acc += chunk;
      yield { text: acc, delta: chunk, done: false };
    }
    yield {
      text: acc,
      delta: "",
      done: true,
      stats: { tokensPerSecond: 42, totalTokens: this.mockTokens.length },
    };
  }
}

describe("Local AI Provider and Service Integration", () => {
  let mockProvider: MockLocalAIProvider;
  let mockEngine: SlideEngine;

  beforeEach(() => {
    mockProvider = new MockLocalAIProvider();
    mockEngine = {
      version: "1.0.0",
      parse: vi.fn((src: string): Deck => {
        const slides = src.split("---").filter((s) => s.trim().length > 0);
        return {
          meta: { title: "Test Deck" },
          slides: slides.map((s, i) => ({
            startLine: i * 5,
            title: `Slide ${i + 1}`,
            titleLine: i * 5 + 1,
            kicker: "Test",
            body: s,
            groups: [],
            notes: "",
            layout: "default",
            dir: {},
          })),
          problems: [],
        };
      }),
      fillTemplate: vi.fn(),
      createStore: vi.fn(),
    };
  });

  it("extracts clean markdown without chat fences", () => {
    const wrapped = "Here is your slide:\n```markdown\n---\ntitle: Demo\n---\n# Slide 1\n```\nHope you like it!";
    const extracted = extractMarkdown(wrapped);
    expect(extracted).toContain("---\ntitle: Demo\n---\n# Slide 1");
    expect(extracted).not.toContain("```");
    expect(extracted).not.toContain("Here is your slide");
  });

  it("generates structured slide markdown locally with token streaming", async () => {
    mockProvider.mockTokens = ["---\n", "title: AWS Lambda\n", "---\n", "# Serverless Compute\n", "- Event driven\n"];

    const service = new LocalAiDeckService(mockEngine, mockProvider);
    const streamedTokens: string[] = [];

    const draft = await service.generate("Create AWS Lambda slide", {
      slides: 1,
      task: "slide",
      onToken: (text) => {
        streamedTokens.push(text);
      },
    });

    expect(draft.provider).toBe("Local AI (Browser SLM)");
    expect(draft.model).toBe("test-model");
    expect(draft.markdown).toContain("# Serverless Compute");
    expect(draft.stats?.tokensPerSecond).toBe(42);
    expect(streamedTokens.length).toBe(mockProvider.mockTokens.length);
  });

  it("handles model generation cancellation via AbortSignal", async () => {
    mockProvider.mockTokens = ["Line 1\n", "Line 2\n", "Line 3\n"];
    const service = new LocalAiDeckService(mockEngine, mockProvider);

    const controller = new AbortController();
    controller.abort(); // Cancel immediately

    const draft = await service.generate("Test", {
      signal: controller.signal,
    });

    expect(draft.markdown.trim()).toBe("");
  });

  it("reports proper health status", async () => {
    const service = new LocalAiDeckService(mockEngine, mockProvider);
    const health = await service.health();

    expect(health.configured).toBe(true);
    expect(health.ok).toBe(true);
    expect(health.isLocal).toBe(true);
    expect(health.backend).toBe("webgpu");
  });

  it("guarantees zero remote network calls to /api/ai during local inference", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    mockProvider.mockTokens = ["---\n# Completely Local Slide\n"];

    const service = new LocalAiDeckService(mockEngine, mockProvider);
    await service.generate("Private content strictly on-device");

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
