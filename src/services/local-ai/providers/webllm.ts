import type {
  LocalAICapabilities,
  LocalAIProgress,
  LocalAIProvider,
  LocalAIRequest,
  LocalAIStatus,
  LocalAIToken,
} from "../types";
import { getLocalAIClient, LocalAIWorkerClient } from "../worker-client";

/**
 * WebLLM implementation of LocalAIProvider running in a Web Worker.
 */
export class WebLLMProvider implements LocalAIProvider {
  public readonly id = "webllm";
  public readonly name = "WebLLM (WebGPU SLM)";

  private client: LocalAIWorkerClient;

  constructor(client?: LocalAIWorkerClient) {
    this.client = client ?? getLocalAIClient();
  }

  public async initialize(): Promise<void> {
    return this.client.initialize();
  }

  public async isSupported(): Promise<boolean> {
    return this.client.isSupported();
  }

  public async loadModel(modelId: string, onProgress?: (p: LocalAIProgress) => void): Promise<void> {
    return this.client.loadModel(modelId, onProgress);
  }

  public async unloadModel(): Promise<void> {
    return this.client.unloadModel();
  }

  public generate(request: LocalAIRequest): AsyncIterable<LocalAIToken> {
    return this.client.generate(request);
  }

  public getStatus(): LocalAIStatus {
    return this.client.getStatus();
  }

  public getCapabilities(): LocalAICapabilities {
    return this.client.getCapabilities();
  }

  public async checkModelInCache(modelId: string): Promise<boolean> {
    return this.client.checkModelInCache(modelId);
  }

  public async deleteModelFromCache(modelId: string): Promise<void> {
    return this.client.deleteModelFromCache(modelId);
  }
}
