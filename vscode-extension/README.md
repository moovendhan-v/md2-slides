# Slidewise — Markdown Slides for VS Code

Open any Markdown deck as slides without leaving the editor. The extension runs the same engine and UI as the [Slidewise web app](https://github.com/moovendhan-v/md2-slides): the Rust/Wasm parser, slide renderer, Components view, customizer and presenter.

## Features

- **Open as Slides.** Use the preview button in the editor title bar, **Slides** in the status bar, the explorer context menu, or <kbd>Ctrl/Cmd+K</kbd> <kbd>Shift+S</kbd>.
- **Suggestion on open.** Opening a Markdown file that looks like a deck (front matter, `---` slide breaks, `:::` blocks) offers **Open Slides**, **Present** or **Don't Ask Again**.
- **Live two-way sync.**
  - Typing in the text editor re-renders the slides.
  - Changes made in the slides panel (customizer, component moves, raw edits) are written back to the document, so undo and save work as usual.
  - The preview follows your cursor, and clicking a slide title jumps to its line.
- **Components view.** Every slide is a card listing its components. Drag slides or components to reorder them, and double-click a component to edit its raw Markdown.
- **Customize.** Theme, palette, fonts, layout and motion, saved to the deck's front matter.
- **Present.** Full presenter mode with timer, pen, laser, blackout, overview and speaker notes.
- **Open With… → Slidewise Slides.** Use the slides as the editor for a `.md` file.
- **Relative images.** Paths such as `![](./img/chart.png)` resolve against the deck's folder.

## Settings

| Setting | Default | |
| --- | --- | --- |
| `slidewise.suggestOnOpen` | `decks` | `decks`, `always` or `never` |
| `slidewise.defaultView` | `preview` | Open with rendered slides or the `blocks` component view |

## Development

Everything is built from the main repository, not a separate app:

```bash
./scripts/vscode-dev.sh            # build + open an Extension Development Host on sample/demo.md
./scripts/vscode-dev.sh my-deck.md # …on your own deck
./scripts/vscode-dev.sh --install  # package a .vsix and install it into VS Code
npm run vscode:test                # headless integration test (downloads VS Code once)
```

To release a new version, run `./scripts/vscode-release.sh patch "What changed"`, then push the tag. CI builds, tests and publishes the extension.
