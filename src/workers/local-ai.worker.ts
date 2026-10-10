import {
  MLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
  type InitProgressReport,
} from "@mlc-ai/web-llm";

export type WorkerInMessage =
  | { type: "CHECK_SUPPORT" }
  | { type: "CHECK_CACHE"; modelId: string }
  | { type: "DELETE_CACHE"; modelId: string }
  | { type: "LOAD_MODEL"; modelId: string }
  | { type: "UNLOAD_MODEL" }
  | {
      type: "GENERATE";
      requestId: string;
      system?: string;
      prompt: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  | { type: "CANCEL"; requestId: string }
  | { type: "GET_STATUS" };

export type WorkerOutMessage =
  | { type: "SUPPORT_RESULT"; supported: boolean; backend: "webgpu" | "wasm" | "cpu"; error?: string }
  | { type: "CACHE_RESULT"; modelId: string; inCache: boolean }
  | { type: "DELETE_CACHE_RESULT"; modelId: string; success: boolean }
  | { type: "PROGRESS"; text: string; progress: number; timeElapsed?: number }
  | { type: "LOAD_SUCCESS"; modelId: string }
  | { type: "UNLOAD_SUCCESS" }
  | { type: "TOKEN"; requestId: string; text: string; delta: string; done: false }
  | { type: "DONE"; requestId: string; text: string; stats?: { tokensPerSecond?: number; totalTokens?: number } }
  | { type: "ERROR"; requestId?: string; error: string };

let engine: MLCEngine | null = null;
let currentModelId: string | null = null;
let activeRequestId: string | null = null;
let activeAbortController: AbortController | null = null;

async function checkWebGpuSupport(): Promise<{ supported: boolean; backend: "webgpu" | "wasm" | "cpu"; error?: string }> {
  if (typeof navigator === "undefined" || !("gpu" in navigator) || !navigator.gpu) {
    return {
      supported: false,
      backend: "wasm",
      error: "WebGPU is not available in your browser. A browser with WebGPU support (Chrome 113+, Edge, Safari 18+) is required for local SLM.",
    };
  }
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter?: () => Promise<{ limits?: { maxStorageBuffersPerShaderStage?: number } } | null> } }).gpu;
    if (!gpu || typeof gpu.requestAdapter !== "function") {
      return {
        supported: false,
        backend: "wasm",
        error: "WebGPU is not available in your browser.",
      };
    }
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        backend: "wasm",
        error: "No compatible WebGPU graphics adapter was found on your system.",
      };
    }
    const maxStorageBuffers = adapter.limits?.maxStorageBuffersPerShaderStage ?? 0;
    if (maxStorageBuffers < 8) {
      return {
        supported: false,
        backend: "wasm",
        error: `GPU limit: maxStorageBuffersPerShaderStage is ${maxStorageBuffers} (WebGPU requires at least 8).`,
      };
    }
    return {
      supported: true,
      backend: "webgpu",
    };
  } catch (err) {
    return {
      supported: false,
      backend: "wasm",
      error: (err as Error).message || "Failed to initialize WebGPU adapter",
    };
  }
}

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case "CHECK_SUPPORT": {
      const result = await checkWebGpuSupport();
      self.postMessage({
        type: "SUPPORT_RESULT",
        supported: result.supported,
        backend: result.backend,
        error: result.error,
      } satisfies WorkerOutMessage);
      break;
    }

    case "CHECK_CACHE": {
      try {
        const inCache = await hasModelInCache(msg.modelId);
        self.postMessage({
          type: "CACHE_RESULT",
          modelId: msg.modelId,
          inCache,
        } satisfies WorkerOutMessage);
      } catch {
        self.postMessage({
          type: "CACHE_RESULT",
          modelId: msg.modelId,
          inCache: false,
        } satisfies WorkerOutMessage);
      }
      break;
    }

    case "DELETE_CACHE": {
      try {
        await deleteModelAllInfoInCache(msg.modelId);
        if (currentModelId === msg.modelId && engine) {
          await engine.unload();
          engine = null;
          currentModelId = null;
        }
        self.postMessage({
          type: "DELETE_CACHE_RESULT",
          modelId: msg.modelId,
          success: true,
        } satisfies WorkerOutMessage);
      } catch (err) {
        self.postMessage({
          type: "ERROR",
          error: (err as Error).message || "Failed to delete model from cache",
        } satisfies WorkerOutMessage);
      }
      break;
    }

    case "LOAD_MODEL": {
      try {
        const sup = await checkWebGpuSupport();
        if (!sup.supported) {
          throw new Error(sup.error || "WebGPU is not supported");
        }

        if (!engine) {
          engine = new MLCEngine();
        }

        engine.setInitProgressCallback((report: InitProgressReport) => {
          self.postMessage({
            type: "PROGRESS",
            text: report.text,
            progress: report.progress,
            timeElapsed: report.timeElapsed,
          } satisfies WorkerOutMessage);
        });

        await engine.reload(msg.modelId);
        currentModelId = msg.modelId;

        self.postMessage({
          type: "LOAD_SUCCESS",
          modelId: msg.modelId,
        } satisfies WorkerOutMessage);
      } catch (err) {
        self.postMessage({
          type: "ERROR",
          error: (err as Error).message || `Failed to load model ${msg.modelId}`,
        } satisfies WorkerOutMessage);
      }
      break;
    }

    case "UNLOAD_MODEL": {
      try {
        if (engine) {
          await engine.unload();
          engine = null;
        }
        currentModelId = null;
        self.postMessage({
          type: "UNLOAD_SUCCESS",
        } satisfies WorkerOutMessage);
      } catch (err) {
        self.postMessage({
          type: "ERROR",
          error: (err as Error).message || "Failed to unload model",
        } satisfies WorkerOutMessage);
      }
      break;
    }

    case "CANCEL": {
      if (activeRequestId === msg.requestId && activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
        activeRequestId = null;
      }
      break;
    }

    case "GENERATE": {
      if (!engine || !currentModelId) {
        self.postMessage({
          type: "ERROR",
          requestId: msg.requestId,
          error: "Model is not loaded. Please download or load the model first.",
        } satisfies WorkerOutMessage);
        return;
      }

      activeRequestId = msg.requestId;
      activeAbortController = new AbortController();

      try {
        const messages: Array<{ role: "system" | "user"; content: string }> = [];
        if (msg.system) {
          messages.push({ role: "system", content: msg.system });
        }
        messages.push({ role: "user", content: msg.prompt });

        const startTime = performance.now();
        let tokenCount = 0;
        let accumulatedText = "";

        const stream = await engine.chat.completions.create({
          stream: true,
          messages,
          temperature: msg.temperature ?? 0.6,
          max_tokens: msg.maxTokens ?? 2048,
          top_p: msg.topP ?? 0.95,
          repetition_penalty: 1.18,
          frequency_penalty: 0.15,
          presence_penalty: 0.15,
          stop: ["<|im_end|>", "<|endoftext|>", "</s>", "\n---\n---\n"],
        });

        let consecutiveDashes = 0;

        for await (const chunk of stream) {
          if (activeAbortController?.signal.aborted) {
            break;
          }
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            accumulatedText += delta;
            tokenCount++;

            // Break runaway repetition of slide separators
            if (delta.includes("---")) {
              consecutiveDashes++;
              if (consecutiveDashes > 2) break;
            } else if (delta.trim().length > 0) {
              consecutiveDashes = 0;
            }

            self.postMessage({
              type: "TOKEN",
              requestId: msg.requestId,
              delta,
              text: accumulatedText,
              done: false,
            } satisfies WorkerOutMessage);
          }
        }

        const durationSec = Math.max(0.001, (performance.now() - startTime) / 1000);
        const tokensPerSecond = Math.round((tokenCount / durationSec) * 10) / 10;

        self.postMessage({
          type: "DONE",
          requestId: msg.requestId,
          text: accumulatedText,
          stats: {
            tokensPerSecond,
            totalTokens: tokenCount,
          },
        } satisfies WorkerOutMessage);
      } catch (err) {
        if (!activeAbortController?.signal.aborted) {
          self.postMessage({
            type: "ERROR",
            requestId: msg.requestId,
            error: (err as Error).message || "Inference error",
          } satisfies WorkerOutMessage);
        }
      } finally {
        if (activeRequestId === msg.requestId) {
          activeRequestId = null;
          activeAbortController = null;
        }
      }
      break;
    }
  }
};
