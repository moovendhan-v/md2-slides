const HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** Profile and avatar URLs for a GitHub username (undefined when it isn't a valid one). */
export function githubProfile(handle: string | undefined, size = 64) {
  if (!handle || !HANDLE.test(handle)) return undefined;
  return { url: `https://github.com/${handle}`, avatar: `https://github.com/${handle}.png?size=${size}` };
}
