"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getLocalAIClient } from "@/services/local-ai/worker-client";
import { LOCAL_MODELS, getModelConfig, DEFAULT_LOCAL_MODEL_ID } from "@/services/local-ai/models";
import type {
  LocalAIModelConfig,
  LocalAIProgress,
  LocalAIRequest,
  LocalAIStatus,
  LocalAIToken,
} from "@/services/local-ai/types";
import { useAi } from "@/stores/ai";

export function useLocalAi() {
  const localModelId = useAi((s) => s.localModelId);
  const setAiStore = useAi((s) => s.set);
  const [status, setStatus] = useState<LocalAIStatus>(() => getLocalAIClient().getStatus());
  const [cachedModels, setCachedModels] = useState<Record<string, boolean>>({});
  const [isWebGpuSupported, setIsWebGpuSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const client = getLocalAIClient();
    const unsub = client.subscribeStatus((newStatus) => {
      setStatus(newStatus);
      setAiStore({ localStatus: newStatus });
    });

    // Check WebGPU support
    client.isSupported().then((supported) => {
      setIsWebGpuSupported(supported);
    });

    return () => unsub();
  }, [setAiStore]);

  // Check cache for available models
  const refreshCacheStatus = useCallback(async () => {
    const client = getLocalAIClient();
    const map: Record<string, boolean> = {};
    for (const model of LOCAL_MODELS) {
      try {
        const inCache = await client.checkModelInCache(model.id);
        map[model.id] = inCache;
      } catch {
        map[model.id] = false;
      }
    }
    setCachedModels(map);
  }, []);

  useEffect(() => {
    refreshCacheStatus();
  }, [refreshCacheStatus]);

  const activeModel = useMemo<LocalAIModelConfig>(() => {
    return getModelConfig(localModelId) || getModelConfig(DEFAULT_LOCAL_MODEL_ID)!;
  }, [localModelId]);

  const loadModel = useCallback(
    async (modelId?: string, onProgress?: (p: LocalAIProgress) => void) => {
      const targetId = modelId || localModelId;
      const client = getLocalAIClient();
      await client.loadModel(targetId, onProgress);
      await refreshCacheStatus();
      setAiStore({ localModelId: targetId });
    },
    [localModelId, refreshCacheStatus, setAiStore],
  );

  const unloadModel = useCallback(async () => {
    const client = getLocalAIClient();
    await client.unloadModel();
    await refreshCacheStatus();
  }, [refreshCacheStatus]);

  const deleteModel = useCallback(
    async (modelId: string) => {
      const client = getLocalAIClient();
      await client.deleteModelFromCache(modelId);
      await refreshCacheStatus();
    },
    [refreshCacheStatus],
  );

  const generate = useCallback((req: LocalAIRequest): AsyncIterable<LocalAIToken> => {
    const client = getLocalAIClient();
    return client.generate(req);
  }, []);

  return {
    status,
    models: LOCAL_MODELS,
    activeModel,
    cachedModels,
    isWebGpuSupported,
    loadModel,
    unloadModel,
    deleteModel,
    generate,
    refreshCacheStatus,
    setLocalModelId: (id: string) => setAiStore({ localModelId: id }),
  };
}
