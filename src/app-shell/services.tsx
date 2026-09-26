"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useEngine } from "@/engine/provider";
import { GitHubProvider } from "@/services/git/github-provider";
import type { AuthProvider, GitProvider } from "@/services/git/types";
import { createTemplateRepository, type TemplateRepository } from "@/services/templates";
import { HttpAiDeckService } from "@/services/ai/http-ai-service";
import type { AiDeckService } from "@/services/ai/types";

export interface Services {
  auth: AuthProvider;
  git: GitProvider;
  templates: TemplateRepository;
  ai: AiDeckService;
}

const Ctx = createContext<Services | null>(null);

/** Composition root: the only place concrete service classes are chosen. */
export function ServicesProvider({ children, override }: { children: ReactNode; override?: Partial<Services> }) {
  const engine = useEngine();
  const services = useMemo<Services>(
    () => {
      const github = new GitHubProvider();
      return { auth: github, git: github, templates: createTemplateRepository(engine), ai: new HttpAiDeckService(), ...override };
    },
    [engine, override],
  );
  return <Ctx.Provider value={services}>{children}</Ctx.Provider>;
}

export function useServices(): Services {
  const s = useContext(Ctx);
  if (!s) throw new Error("useServices must be used inside <ServicesProvider>");
  return s;
}
