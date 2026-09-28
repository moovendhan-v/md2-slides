import type { SlideEngine } from "@/engine/engine";
import type { AiDeckService, AiHealth, DeckDraft, GenerateOptions } from "./types";
import { RemoteAiProvider } from "./remote-provider";
import { LocalAiDeckService } from "./local-provider";
import { useAi } from "@/stores/ai";

export class UnifiedAiService implements AiDeckService {
  private remote: RemoteAiProvider;
  private local: LocalAiDeckService;

  constructor(engine?: SlideEngine) {
    this.remote = new RemoteAiProvider();
    this.local = new LocalAiDeckService(engine);
  }

  public setEngine(engine: SlideEngine) {
    this.local.setEngine(engine);
  }

  public getLocalService(): LocalAiDeckService {
    return this.local;
  }

  public getRemoteService(): RemoteAiProvider {
    return this.remote;
  }

  async generate(prompt: string, opts?: GenerateOptions): Promise<DeckDraft> {
    const selectedProvider = opts?.provider ?? useAi.getState().provider;
    if (selectedProvider === "local") {
      return this.local.generate(prompt, opts);
    }
    return this.remote.generate(prompt, opts);
  }

  async health(): Promise<AiHealth> {
    const selectedProvider = useAi.getState().provider;
    if (selectedProvider === "local") {
      return this.local.health();
    }
    return this.remote.health();
  }
}
