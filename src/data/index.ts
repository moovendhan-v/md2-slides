/**
 * Seed data for the demo workspace. Everything here is plain JSON so it can be
 * replaced by a real backend (GitHub API, template service) without code changes.
 */
import type { TemplateRecord } from "@/engine/types";
import aiPresets from "./ai-presets.json";
import codeTemplates from "./code-templates.json";
import repos from "./repos.json";
import snippets from "./snippets.json";
import studioGuide from "./studio-guide.json";
import templates from "./templates.json";

export interface RepoNode {
  name: string;
  content?: string;
  children?: RepoNode[];
}

export interface RepoSeed {
  id: string;
  private: boolean;
  branch: string;
  updated: string;
  tree: RepoNode[];
}

export interface Snippet {
  label: string;
  md: string;
  icon: string;
  cat: string;
}

export interface AiPreset {
  label: string;
  icon: string;
  prompt: string;
  md: string;
}

export interface CodeTemplate {
  id: string;
  config: { name: string; category: string; author: string; slots: string[]; description: string };
  html: string;
  sample: string;
}

export const SEED_REPOS = repos as RepoSeed[];
export const SEED_TEMPLATES = templates as TemplateRecord[];
export const BLOCK_SNIPPETS = snippets as Snippet[];
export const AI_PRESETS = aiPresets as AiPreset[];
export const CODE_TEMPLATES = codeTemplates as CodeTemplate[];
export const STUDIO_GUIDE = studioGuide as { h: string; b: string }[];

/** Code (HTML + Tailwind) layouts exposed as single-slide community templates. */
export const codeTemplateRecords = (): TemplateRecord[] =>
  CODE_TEMPLATES.map((c) => ({
    id: "code-" + c.id,
    name: c.config.name,
    cat: c.config.category,
    author: c.config.author,
    md: c.sample,
    stars: 0,
    community: true,
    single: true,
    code: true,
    look: {},
    html: c.html,
    config: { id: c.id, ...c.config },
  }));

export const DEMO_USER = { login: "yoni-o", initials: "YO", connected: "12 Sep 2026" };
