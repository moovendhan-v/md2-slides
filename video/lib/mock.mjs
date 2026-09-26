/**
 * Signed-in app without GitHub: stub the API routes the app calls so the
 * video can drive /app against a fake repository with real decks.
 */
import { readFileSync } from "node:fs";

export const REPO = "acme/platform";

export async function mockApp(context, files) {
  await context.addInitScript(
    ([repo]) => localStorage.setItem("md2slides-prefs", JSON.stringify({ state: { prefs: {}, share: {}, selectedRepos: { "you": [repo] } }, version: 1 })),
    [REPO],
  );
  await context.route("**/api/auth/me", (r) => r.fulfill({ json: { user: { login: "you", name: "You", avatar: "", scope: "repo", since: Date.now() } } }));
  await context.route("**/api/github/repos", (r) =>
    r.fulfill({ json: [{ id: REPO, private: true, branch: "main", pushedAt: new Date().toISOString(), canPush: true }] }),
  );
  await context.route("**/api/github/tree?*", (r) => r.fulfill({ json: { paths: Object.keys(files()), truncated: false } }));
  await context.route("**/api/github/file?*", (r) => {
    const path = new URL(r.request().url()).searchParams.get("path");
    r.fulfill({ body: files()[path] ?? "", contentType: "text/plain" });
  });
  await context.route("**/api/github/commit", (r) => r.fulfill({ json: { sha: "9f3c2ab", url: `https://github.com/${REPO}/commit/9f3c2ab` } }));
}

export const deck = (name) => readFileSync(new URL(`../decks/${name}`, import.meta.url), "utf8");
