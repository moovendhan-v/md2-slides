/** Build a sorted folder tree from flat repo paths (folders first, then A–Z). */

export interface TreeFolder {
  kind: "folder";
  name: string;
  path: string;
  children: TreeNode[];
}

export interface TreeFile {
  kind: "file";
  name: string;
  path: string;
}

export type TreeNode = TreeFolder | TreeFile;

export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeFolder = { kind: "folder", name: "", path: "", children: [] };
  for (const p of paths) {
    let node = root;
    const parts = p.split("/");
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      if (i === parts.length - 1) {
        node.children.push({ kind: "file", name: part, path });
        return;
      }
      let next = node.children.find((c): c is TreeFolder => c.kind === "folder" && c.name === part);
      if (!next) {
        next = { kind: "folder", name: part, path, children: [] };
        node.children.push(next);
      }
      node = next;
    });
  }
  const sort = (n: TreeFolder) => {
    n.children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));
    n.children.forEach((c) => c.kind === "folder" && sort(c));
  };
  sort(root);
  return root.children;
}

export const isMarkdown = (name: string) => /\.md$/.test(name);
export const fileIcon = (name: string) => (isMarkdown(name) ? "file-md" : /\.(png|svg|jpe?g|gif|webp)$/.test(name) ? "file-image" : "file");
