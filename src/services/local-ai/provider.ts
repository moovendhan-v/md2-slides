import type { LocalAIProvider } from "./types";
import { WebLLMProvider } from "./providers/webllm";
import { getLocalAIClient } from "./worker-client";

let defaultProvider: LocalAIProvider | null = null;

export function getLocalAIProvider(): LocalAIProvider {
  if (!defaultProvider) {
    defaultProvider = new WebLLMProvider(getLocalAIClient());
  }
  return defaultProvider;
}

export * from "./types";
export * from "./models";
