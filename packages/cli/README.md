# md2-slides CLI

Preview, validate, and launch interactive presentations from any Markdown file.

```bash
npx -y md2-slides demo.md
```

## Features

- ⚡ **Instant Browser Preview**: Opens your slide deck in your default browser.
- 🦀 **Rust/Wasm Engine**: Validates slide deck structure and reports syntax issues.
- 📑 **Slide Outline**: Prints slide count and titles in the terminal.

## Usage

```bash
# Preview and open a slide deck in your browser
npx -y md2-slides path/to/slides.md

# Validate without opening browser
npx -y md2-slides path/to/slides.md --no-open

# Run as Claude MCP server
npx -y md2-slides
```
