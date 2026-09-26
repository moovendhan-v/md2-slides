---
title: Slidewise in VS Code
theme: zinc
---

^ Slidewise
# Markdown slides, right in VS Code
Edit on the left, see slides on the right.

---

## What you get

:::cards style=grid cols=3
- presentation | Live slides | Every keystroke re-renders the deck
- squares-four | Components | Drag slides and blocks to reorder them
- play | Present | Full presenter mode with pen and laser
:::

---

## Numbers

:::stats style=big
- 1 | Markdown file
- 0 | Build steps
:::

---

## Code

```ts extension.ts {2}
const doc = await vscode.workspace.openTextDocument(uri);
panels.open(doc);
```

> [!TIP] Click any slide title to jump to its line in the editor.

---

## Roadmap

:::timeline style=h
- v0.1 | Preview and present
- v0.2 | Export PDF
- v0.3 | GitHub sync
:::

note: These are speaker notes. They show in presenter mode.
