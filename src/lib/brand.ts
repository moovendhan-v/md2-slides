/** Product identity, in one place. */
export const BRAND = {
  name: "md2slides",
  tagline: "Write Markdown. Present like a designer.",
  description: "Markdown slide decks synced to GitHub: live preview, draggable components, share links without a server, HTML export and a VS Code extension.",
  repo: "https://github.com/moovendhan-v/md2-slides",
  /** Public app URL (preview links from the MCP server, canonical links). Override with NEXT_PUBLIC_SITE_URL / MD2SLIDES_APP_URL. */
  url: "https://md2slides.cybertechmind.com",
  /** npm package that runs the MCP server: `npx -y md2slides-mcp`. */
  mcpPackage: "md2slides-mcp",
  support: {
    sponsors: "https://github.com/sponsors/moovendhan-v",
    buyMeACoffee: `https://buymeacoffee.com/${process.env.NEXT_PUBLIC_BMC_HANDLE || "moovendhan"}`,
    openCollective: "https://opencollective.com/md2slides",
  },
  /** Square logo mark (public/logo.svg); favicons are generated from it by scripts/brand-icons.mjs. */
  logo: "/logo.svg",
} as const;
