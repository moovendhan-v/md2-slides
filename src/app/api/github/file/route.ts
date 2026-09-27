import { bad, REPO_RE, withGitHub } from "@/server/github/route-helpers";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  ico: "image/x-icon",
};

/** GET ?repo&path&ref&format=dataurl → raw text or base64 data URL of one file. */
export function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const repo = u.get("repo") ?? "";
  const path = u.get("path") ?? "";
  const ref = u.get("ref") ?? "main";
  const format = u.get("format");
  if (!REPO_RE.test(repo) || !path || path.includes("..")) return Promise.resolve(bad("repo and path are required"));

  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ext in MIME_TYPES;

  if (isImage || format === "dataurl") {
    return withGitHub(async (gh) => {
      const res = await gh.fileContent(repo, path, ref);
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      if (res.encoding === "base64" && res.content) {
        const cleanBase64 = res.content.replace(/\s+/g, "");
        return Response.json({ dataUrl: `data:${mime};base64,${cleanBase64}` });
      }
      return new Response(res.content, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
    });
  }

  return withGitHub(async (gh) => new Response(await gh.file(repo, path, ref), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }));
}
