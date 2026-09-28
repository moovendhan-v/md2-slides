import type { LocalAIModelConfig } from "./types";

export const LOCAL_MODELS: LocalAIModelConfig[] = [
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M (Fast & Compact)",
    sizeMB: 376,
    downloadSizeMB: 190,
    vramRequiredMB: 376,
    description: "Ultra-compact model from Hugging Face. Very fast downloads and low memory usage, perfect for most devices.",
    parameters: "360M",
    quantization: "q4f16_1",
    recommended: true,
    backend: "webgpu",
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B (Best Markdown & Logic)",
    sizeMB: 500,
    downloadSizeMB: 390,
    vramRequiredMB: 945,
    description: "Exceptional instruction-following and structured Markdown generation in a lightweight 500M package.",
    parameters: "500M",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    name: "SmolLM2 135M (Ultra Lightweight)",
    sizeMB: 360,
    downloadSizeMB: 135,
    vramRequiredMB: 360,
    description: "Smallest available model. Fastest to download and runs well even on restricted or low-memory environments.",
    parameters: "135M",
    quantization: "q0f16",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B (High Quality)",
    sizeMB: 880,
    downloadSizeMB: 600,
    vramRequiredMB: 880,
    description: "Meta's flagship small language model with strong slide composition and rich vocabulary.",
    parameters: "1B",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B (Advanced)",
    sizeMB: 1774,
    downloadSizeMB: 920,
    vramRequiredMB: 1774,
    description: "Higher reasoning capacity and nuanced tone adjustments for complex presentation topics.",
    parameters: "1.7B",
    quantization: "q4f16_1",
    recommended: false,
    backend: "webgpu",
  },
];

export const DEFAULT_LOCAL_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

export function getModelConfig(modelId: string): LocalAIModelConfig | undefined {
  return LOCAL_MODELS.find((m) => m.id === modelId);
}
