/** `- a | b | c` → ["a", "b", "c"] */
export const rowCells = (r: string) => r.replace(/^\s*[-*]\s+/, "").split("|").map((x) => x.trim());

/** Strip list markers and checkbox from a list row. */
export const listText = (r: string) => r.replace(/^([-*]|\d+\.)\s+(\[[ x]\]\s*)?/i, "");
