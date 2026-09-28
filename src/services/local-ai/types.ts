export type LocalAIBackend = "webgpu" | "wasm" | "cpu";

export type LocalAIState =
  | "uninitialized"
  | "checking"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface LocalAIProgress {
  text: string;
  progress: number; // 0.0 to 1.0
  timeElapsed?: number;
}

export interface LocalAIStatus {
  state: LocalAIState;
  modelId?: string;
  progress?: number;
  progressText?: string;
  error?: string;
  backend?: LocalAIBackend;
  isCached?: boolean;
}

export interface LocalAICapabilities {
  webGpuSupported: boolean;
  maxContextLength: number;
  streamingSupported: boolean;
  supportedModels: string[];
}

export interface LocalAIModelConfig {
  id: string;
  name: string;
  sizeMB: number;
  downloadSizeMB: number;
  vramRequiredMB: number;
  description: string;
  parameters: string;
  quantization: string;
  recommended?: boolean;
  backend: LocalAIBackend;
}

export interface LocalAIRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  signal?: AbortSignal;
}

export interface LocalAIToken {
  text: string;
  delta: string;
  done: boolean;
  stats?: {
    tokensPerSecond?: number;
    totalTokens?: number;
  };
}

export interface LocalAIProvider {
  id: string;
  name: string;

  initialize(): Promise<void>;
  isSupported(): Promise<boolean>;
  loadModel(modelId: string, onProgress?: (p: LocalAIProgress) => void): Promise<void>;
  unloadModel(): Promise<void>;
  generate(request: LocalAIRequest): AsyncIterable<LocalAIToken>;
  getStatus(): LocalAIStatus;
  getCapabilities(): LocalAICapabilities;
  checkModelInCache(modelId: string): Promise<boolean>;
  deleteModelFromCache(modelId: string): Promise<void>;
}
