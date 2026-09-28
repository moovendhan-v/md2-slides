import type {
  LocalAICapabilities,
  LocalAIProgress,
  LocalAIProvider,
  LocalAIRequest,
  LocalAIStatus,
  LocalAIToken,
} from "./types";
import { DEFAULT_LOCAL_MODEL_ID, LOCAL_MODELS } from "./models";
import type { WorkerInMessage, WorkerOutMessage } from "@/workers/local-ai.worker";

export class LocalAIWorkerClient implements LocalAIProvider {
  public readonly id = "local-webllm";
  public readonly name = "Browser Local SLM (WebGPU)";

  private worker: Worker | null = null;
  private status: LocalAIStatus = {
    state: "uninitialized",
    backend: undefined,
  };
  private capabilities: LocalAICapabilities = {
    webGpuSupported: false,
    maxContextLength: 4096,
    streamingSupported: true,
    supportedModels: LOCAL_MODELS.map((m) => m.id),
  };

  private progressCallback?: (progress: LocalAIProgress) => void;
  private activeStreams = new Map<
    string,
    {
      push: (token: LocalAIToken) => void;
      fail: (err: Error) => void;
      done: () => void;
    }
  >();

  private pendingRequests = new Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (err: Error) => void;
    }
  >();

  private statusListeners = new Set<(status: LocalAIStatus) => void>();

  constructor() {}

  public subscribeStatus(listener: (status: LocalAIStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(patch: Partial<LocalAIStatus>) {
    this.status = { ...this.status, ...patch };
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }

  public getStatus(): LocalAIStatus {
    return this.status;
  }

  public getCapabilities(): LocalAICapabilities {
    return this.capabilities;
  }

  private initWorker(): Worker {
    if (this.worker) return this.worker;

    if (typeof window === "undefined") {
      throw new Error("Local AI Web Worker cannot be initialized on the server.");
    }

    this.worker = new Worker(new URL("../../workers/local-ai.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker.onerror = (err) => {
      this.setStatus({
        state: "error",
        error: `Worker error: ${err.message || "Unknown error"}`,
      });
    };

    return this.worker;
  }

  private handleWorkerMessage(msg: WorkerOutMessage) {
    switch (msg.type) {
      case "SUPPORT_RESULT": {
        const pending = this.pendingRequests.get("check_support");
        if (pending) {
          this.pendingRequests.delete("check_support");
          this.capabilities.webGpuSupported = msg.supported;
          this.setStatus({
            backend: msg.backend,
            state: this.status.state === "checking" ? "uninitialized" : this.status.state,
            error: msg.error,
          });
          pending.resolve(msg.supported);
        }
        break;
      }

      case "CACHE_RESULT": {
        const pendingKey = `cache_${msg.modelId}`;
        const pending = this.pendingRequests.get(pendingKey);
        if (pending) {
          this.pendingRequests.delete(pendingKey);
          pending.resolve(msg.inCache);
        }
        break;
      }

      case "DELETE_CACHE_RESULT": {
        const pendingKey = `delete_cache_${msg.modelId}`;
        const pending = this.pendingRequests.get(pendingKey);
        if (pending) {
          this.pendingRequests.delete(pendingKey);
          pending.resolve(msg.success);
        }
        break;
      }

      case "PROGRESS": {
        const p: LocalAIProgress = {
          text: msg.text,
          progress: msg.progress,
          timeElapsed: msg.timeElapsed,
        };
        this.setStatus({
          state: "downloading",
          progress: msg.progress,
          progressText: msg.text,
        });
        if (this.progressCallback) {
          this.progressCallback(p);
        }
        break;
      }

      case "LOAD_SUCCESS": {
        const pending = this.pendingRequests.get(`load_${msg.modelId}`);
        this.setStatus({
          state: "ready",
          modelId: msg.modelId,
          progress: 1,
          progressText: "Model loaded and ready",
          error: undefined,
          isCached: true,
        });
        if (pending) {
          this.pendingRequests.delete(`load_${msg.modelId}`);
          pending.resolve(true);
        }
        break;
      }

      case "UNLOAD_SUCCESS": {
        const pending = this.pendingRequests.get("unload");
        this.setStatus({
          state: "uninitialized",
          modelId: undefined,
          progress: undefined,
          progressText: undefined,
        });
        if (pending) {
          this.pendingRequests.delete("unload");
          pending.resolve(true);
        }
        break;
      }

      case "TOKEN": {
        const stream = this.activeStreams.get(msg.requestId);
        if (stream) {
          stream.push({
            text: msg.text,
            delta: msg.delta,
            done: false,
          });
        }
        break;
      }

      case "DONE": {
        const stream = this.activeStreams.get(msg.requestId);
        if (stream) {
          stream.push({
            text: msg.text,
            delta: "",
            done: true,
            stats: msg.stats,
          });
          stream.done();
          this.activeStreams.delete(msg.requestId);
        }
        this.setStatus({
          state: "ready",
        });
        break;
      }

      case "ERROR": {
        if (msg.requestId) {
          const stream = this.activeStreams.get(msg.requestId);
          if (stream) {
            stream.fail(new Error(msg.error));
            this.activeStreams.delete(msg.requestId);
          }
        }
        // Also reject any matching pending loads
        for (const [key, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error(msg.error));
          this.pendingRequests.delete(key);
        }
        this.setStatus({
          state: "error",
          error: msg.error,
        });
        break;
      }
    }
  }

  public async initialize(): Promise<void> {
    const supported = await this.isSupported();
    if (!supported) {
      this.setStatus({
        state: "error",
        error: "WebGPU is not supported on this browser/device.",
      });
    }
  }

  public async isSupported(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // Check navigator.gpu directly on main thread first
    if (!("gpu" in navigator) || !navigator.gpu) {
      this.capabilities.webGpuSupported = false;
      this.setStatus({
        backend: "wasm",
        error: "WebGPU is unavailable in this browser. Local AI requires WebGPU acceleration.",
      });
      return false;
    }

    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter?: () => Promise<{ limits?: { maxStorageBuffersPerShaderStage?: number } } | null> } }).gpu;
      if (gpu && typeof gpu.requestAdapter === "function") {
        const adapter = await gpu.requestAdapter();
        if (adapter && adapter.limits && typeof adapter.limits.maxStorageBuffersPerShaderStage === "number" && adapter.limits.maxStorageBuffersPerShaderStage < 8) {
          this.capabilities.webGpuSupported = false;
          const msg = `GPU device limit: maxStorageBuffersPerShaderStage is ${adapter.limits.maxStorageBuffersPerShaderStage} (WebGPU requires at least 8).`;
          this.setStatus({
            backend: "wasm",
            error: msg,
          });
          return false;
        }
      }
    } catch {
      // ignore
    }

    try {
      const worker = this.initWorker();
      this.setStatus({ state: "checking" });

      return await new Promise<boolean>((resolve, reject) => {
        this.pendingRequests.set("check_support", {
          resolve: (val) => resolve(val as boolean),
          reject,
        });
        worker.postMessage({ type: "CHECK_SUPPORT" } satisfies WorkerInMessage);
      });
    } catch {
      this.capabilities.webGpuSupported = false;
      return false;
    }
  }

  public async checkModelInCache(modelId: string): Promise<boolean> {
    try {
      const worker = this.initWorker();
      return await new Promise<boolean>((resolve, reject) => {
        this.pendingRequests.set(`cache_${modelId}`, {
          resolve: (val) => resolve(val as boolean),
          reject,
        });
        worker.postMessage({ type: "CHECK_CACHE", modelId } satisfies WorkerInMessage);
      });
    } catch {
      return false;
    }
  }

  public async deleteModelFromCache(modelId: string): Promise<void> {
    const worker = this.initWorker();
    await new Promise<void>((resolve, reject) => {
      this.pendingRequests.set(`delete_cache_${modelId}`, {
        resolve: () => resolve(),
        reject,
      });
      worker.postMessage({ type: "DELETE_CACHE", modelId } satisfies WorkerInMessage);
    });
    this.setStatus({
      isCached: false,
      state: this.status.modelId === modelId ? "uninitialized" : this.status.state,
      modelId: this.status.modelId === modelId ? undefined : this.status.modelId,
    });
  }

  public async loadModel(
    modelId: string = DEFAULT_LOCAL_MODEL_ID,
    onProgress?: (p: LocalAIProgress) => void,
  ): Promise<void> {
    const worker = this.initWorker();
    this.progressCallback = onProgress;
    this.setStatus({
      state: "loading",
      modelId,
      error: undefined,
      progress: 0,
      progressText: "Starting model initialization...",
    });

    return new Promise<void>((resolve, reject) => {
      this.pendingRequests.set(`load_${modelId}`, {
        resolve: () => {
          this.progressCallback = undefined;
          resolve();
        },
        reject: (err) => {
          this.progressCallback = undefined;
          this.setStatus({ state: "error", error: err.message });
          reject(err);
        },
      });

      worker.postMessage({ type: "LOAD_MODEL", modelId } satisfies WorkerInMessage);
    });
  }

  public async unloadModel(): Promise<void> {
    if (!this.worker) return;
    return new Promise<void>((resolve, reject) => {
      this.pendingRequests.set("unload", {
        resolve: () => resolve(),
        reject,
      });
      this.worker!.postMessage({ type: "UNLOAD_MODEL" } satisfies WorkerInMessage);
    });
  }

  public async *generate(request: LocalAIRequest): AsyncIterable<LocalAIToken> {
    const worker = this.initWorker();
    if (this.status.state !== "ready" && this.status.state !== "generating") {
      throw new Error("Local model is not loaded. Please download or load the model first.");
    }

    const requestId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.setStatus({ state: "generating" });

    const queue: LocalAIToken[] = [];
    let isDone = false;
    let error: Error | null = null;
    let notifyResolver: (() => void) | null = null;

    const push = (token: LocalAIToken) => {
      queue.push(token);
      if (notifyResolver) {
        notifyResolver();
        notifyResolver = null;
      }
    };

    const fail = (err: Error) => {
      error = err;
      isDone = true;
      if (notifyResolver) {
        notifyResolver();
        notifyResolver = null;
      }
    };

    const done = () => {
      isDone = true;
      if (notifyResolver) {
        notifyResolver();
        notifyResolver = null;
      }
    };

    this.activeStreams.set(requestId, { push, fail, done });

    if (request.signal) {
      request.signal.addEventListener("abort", () => {
        worker.postMessage({ type: "CANCEL", requestId } satisfies WorkerInMessage);
        this.activeStreams.delete(requestId);
        this.setStatus({ state: "ready" });
        done();
      });
    }

    worker.postMessage({
      type: "GENERATE",
      requestId,
      system: request.system,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      topP: request.topP,
    } satisfies WorkerInMessage);

    try {
      while (!isDone || queue.length > 0) {
        if (queue.length > 0) {
          const item = queue.shift()!;
          yield item;
        } else if (!isDone) {
          await new Promise<void>((r) => {
            notifyResolver = r;
          });
        }
      }
      if (error) {
        throw error;
      }
    } finally {
      this.activeStreams.delete(requestId);
      if (this.status.state === "generating") {
        this.setStatus({ state: "ready" });
      }
    }
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.statusListeners.clear();
    this.activeStreams.clear();
    this.pendingRequests.clear();
  }
}

let singletonClient: LocalAIWorkerClient | null = null;

export function getLocalAIClient(): LocalAIWorkerClient {
  if (!singletonClient) {
    singletonClient = new LocalAIWorkerClient();
  }
  return singletonClient;
}
