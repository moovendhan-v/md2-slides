# md2slides — Markdown Slides for VS Code

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/moovendhan-v/md2-slides@main/vscode-extension/media/banner.png" alt="md2slides Banner" width="100%" />
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=moovendhan-the-cybertechmind.md2slides"><img src="https://img.shields.io/visual-studio-marketplace/v/moovendhan-the-cybertechmind.md2slides?style=flat-square&color=3b82f6" alt="Visual Studio Marketplace" /></a>
  <a href="https://github.com/moovendhan-v/md2-slides"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
</p>

**Transform any Markdown file into interactive, presentation-ready slides directly inside VS Code.**  
Powered by a high-performance **Rust / Wasm engine**, md2slides gives you live two-way preview sync, rich built-in animation blocks, interactive diagrams, CSV data charts, LaTeX math, and a full presenter view.

---

## 🎬 Video Demo

<p align="center">
  <video src="https://cdn.jsdelivr.net/gh/moovendhan-v/md2-slides@main/public/demo.mp4" width="100%" controls autoplay loop muted playsinline></video>
</p>

> 🎥 **Watch the Demo Video**: [https://cdn.jsdelivr.net/gh/moovendhan-v/md2-slides@main/public/demo.mp4](https://cdn.jsdelivr.net/gh/moovendhan-v/md2-slides@main/public/demo.mp4)

---

## ✨ Features at a Glance

* ⚡ **Live Two-Way Sync**: Write markdown in your editor and see slides update instantaneously. Edits or theme changes in the preview write directly back to your Markdown file.
* 🪄 **Slash Commands (`/`) & Smart Autocomplete**: Type `/` or `:::` anywhere to instantly insert animated blocks, CSV tables, cards, flow diagrams, or counters with live snippet tab stops.
* 🎨 **IntelliSense for `style=` & `template=`**: Full autocompletion with inline documentation for all block styles (`glass`, `typewriter`, `pipeline`, `neon`, `gradient`).
* 🎬 **Built-In Tailwind Animation Blocks (`:::anim`)**: Typewriter, shimmer, gradient text, float, bounce, pulse, stagger, and custom Tailwind CSS classes.
* 📊 **CSV to Interactive Tables & Charts (`:::csv`)**: Embed raw CSV and render them as modern data tables, bar charts, or column charts.
* 🔢 **Live Metric Counters & Math (`:::counter`, `:::math`)**: Animated KPI counters and LaTeX equations via KaTeX.
* 🛠️ **Architecture & Flow Diagrams (`:::flow`)**: Step pipelines, tech stacks, cycles, and pyramids with Phosphor icons.
* 🎭 **Presenter Mode**: Fullscreen slides with speaker notes, slide timer, laser pointer, live pen drawing, and slide overview grid.

---

## 🚀 Quick Start

1. Open any `.md` Markdown file.
2. Click the **Slides** preview button in the editor title bar (or press `Ctrl+K Shift+S` / `Cmd+K Shift+S`).
3. Start authoring slides!

---

## 📝 Demo Deck Example

Here is a complete slide deck that demonstrates layouts, flows, cards, and terminal blocks:

```markdown
---
title: Moovendhan — Cloud Developer
theme: zinc
accent: #3b82f6
bg: mesh
font: geist
glass: true
density: normal
transition: slide
animate: fade-up
nums: true
---

<!-- layout: image-top; image: https://cdn.jsdelivr.net/gh/moovendhan-v/md2-slides@main/public/images/moovendhan_v_cybertechmind.png -->
^ www.cybertechmind.com
# Moovendhan V
AWS Cloud Developer · Full-Stack Engineer · Builder of CyberTechMind

---

^ Timeline
# Engineering Journey

:::flow style=pipeline
- clock | Started journey | 2022
- clock | Building seriously | 2025
- cloud | AWS Cloud Developer | 2026
:::

> [!NOTE] Focused on building resilient cloud architecture and developer tooling.

---

^ Technologies
# The Tech Stack

:::cards style=outline cols=3
- cloud | AWS Ecosystem | ECS, Lambda, S3, Cognito, RDS, SQS, SNS, CloudFront
- browser | Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- database | Backend & Data | Node.js, NestJS, PostgreSQL, Prisma, GraphQL
- stack | Infrastructure | Terraform, Terragrunt, Docker, GitHub Actions
- chart-line-up | Observability | PostHog, Grafana, CloudWatch, AWS X-Ray
- shield-check | Security | IAM, Cognito, RBAC, MFA, Cloudflare
:::

---

^ Open Source
# md2Docs
Developer-focused tool converting Markdown into polished documents and PDFs.

:::terminal zsh
$ npx -y md2docs build architecture.md --pdf --theme modern
✔ Parsed architecture.md (14 pages)
✔ Applied CyberTechMind design system
✔ Exported architecture.pdf in 420ms
:::

---

<!-- layout: arch -->
^ Get in Touch
# Let's Build Something Together
Moovendhan V · AWS Cloud Developer & Full-Stack Engineer

:::cards style=outline cols=2
- globe | CyberTechMind | cybertechmind.com
- github-logo | GitHub | github.com/moovendhan-v
:::

note: Thanks for checking out my work. Let's connect!
```

---

## 🧩 Rich Block Syntax Reference

| Block | Syntax & Example | Supported Styles |
| :--- | :--- | :--- |
| **Animation** | `:::anim style=typewriter speed=fast`<br>`Your animated text here`<br>`:::` | `typewriter`, `shimmer`, `glow`, `stagger`, `gradient`, `float`, `pulse`, `wave`, `flip`, `bounce` |
| **CSV & Charts** | `:::csv style=column`<br>`Quarter,Revenue,Costs`<br>`Q1,1.2,0.8`<br>`:::` | `table`, `column`, `bar`, `line` |
| **Feature Cards** | `:::cards style=glass cols=3`<br>`- rocket \| Fast \| 10x performance`<br>`:::` | `grid`, `glass`, `outline`, `numbered`, `iconLeft`, `accent` |
| **Flow & Pipeline** | `:::flow style=pipeline`<br>`- rocket \| Step 1 \| Initial setup`<br>`:::` | `pipeline`, `steps`, `stack`, `hub`, `cycle`, `funnel`, `pyramid` |
| **Counters** | `:::counter style=up`<br>`99.98% \| Uptime \| Global SLA`<br>`:::` | `up`, `flip` |
| **Stats** | `:::stats style=big`<br>`- 42% \| Conversion \| +12%`<br>`:::` | `boxed`, `plain`, `bar`, `big` |
| **Timeline** | `:::timeline style=h`<br>`- Q1 \| Alpha release`<br>`:::` | `h` *(horizontal)*, `v` *(vertical)* |
| **Terminal** | `:::terminal bash`<br>`$ npm run build`<br>`✓ built in 1.2s`<br>`:::` | `chrome`, `bare` |
| **LaTeX Math** | `:::math`<br>`E = mc^2`<br>`:::` | `block`, `inline` |

---

## 🎨 Slide Directives

Customize individual slides using HTML comment directives:

```markdown
<!-- layout: center | statement | arch | circle | image-right | image-top -->
<!-- bg: #09090b | linear-gradient(...) | https://image.url -->
<!-- color: #ffffff -->
<!-- accent: #3b82f6 -->
<!-- transition: slide | zoom | cube | flip | fade -->
<!-- animate: fade-up | pop | zoom-in -->
<!-- fontSize: 1.2 -->
```

---

## ⌨️ Keyboard Shortcuts & Commands

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| `md2slides: Open as Slides` | <kbd>Cmd/Ctrl+K</kbd> <kbd>Shift+S</kbd> | Open side-by-side slide preview |
| `md2slides: Present Slides` | <kbd>F5</kbd> | Launch full-screen Presenter Mode |
| `md2slides: Insert Slide` | — | Insert a new slide template at cursor |
| `md2slides: Insert Block` | — | Pick and insert a block with live preview |
| `md2slides: Insert Icon` | — | Search & insert Phosphor icon (`:rocket:`) |

---

## 👨‍💻 Created by
**Moovendhan V** — AWS Cloud Developer & Full-Stack Engineer  
🌐 [CyberTechMind](https://cybertechmind.com) · 🐙 [GitHub](https://github.com/moovendhan-v)
