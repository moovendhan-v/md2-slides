import type { LocalAIModelConfig } from "./types";

export const LOCAL_MODELS: LocalAIModelConfig[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B (Recommended)",
    sizeMB: 880,
    downloadSizeMB: 600,
    vramRequiredMB: 880,
    description: "Meta's flagship small language model. Excellent reasoning, rich explanations, and strong Markdown compliance.",
    parameters: "1B",
    quantization: "q4f16_1",
    recommended: true,
    backend: "webgpu",
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B (Fast & Compact)",
    sizeMB: 500,
    downloadSizeMB: 390,
    vramRequiredMB: 945,
    description: "High-accuracy instruction following, code blocks, and structured slide authoring in a 500M package.",
    parameters: "500M",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B (Maximum Quality)",
    sizeMB: 2263,
    downloadSizeMB: 1500,
    vramRequiredMB: 2263,
    description: "Meta's most capable edge model for in-depth, complex multi-slide technical presentations.",
    parameters: "3B",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M (Ultra Lightweight)",
    sizeMB: 376,
    downloadSizeMB: 190,
    vramRequiredMB: 376,
    description: "Ultra-compact model from Hugging Face. Very fast downloads and minimal memory footprint.",
    parameters: "360M",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    name: "SmolLM2 135M (Minimal Memory)",
    sizeMB: 360,
    downloadSizeMB: 135,
    vramRequiredMB: 360,
    description: "Smallest available model. Quickest to download for restricted or memory-constrained devices.",
    parameters: "135M",
    quantization: "q0f16",
    recommended: false,
    backend: "webgpu",
  },
];

export const DEFAULT_LOCAL_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export function getModelConfig(modelId: string): LocalAIModelConfig | undefined {
  return LOCAL_MODELS.find((m) => m.id === modelId);
}
