/**
 * Stand-in for the `mermaid` package in the standalone player: exported HTML
 * carries every diagram pre-rendered as SVG, so the library is not bundled.
 */
const unavailable = () => {
  throw new Error("This diagram was not pre-rendered in the exported file.");
};

const mermaid = { initialize: () => undefined, render: async (): Promise<{ svg: string }> => unavailable() };
export default mermaid;
