import * as vscode from "vscode";

export const BLOCK_VARIANTS: Record<string, string[]> = {
  anim: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
  animation: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
  motion: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
  csv: ["table", "bar", "column", "line"],
  counter: ["up", "flip"],
  cards: ["grid", "glass", "outline", "numbered", "iconLeft", "accent"],
  stats: ["boxed", "plain", "bar", "big"],
  flow: ["pipeline", "steps", "stack", "hub", "cycle", "funnel", "pyramid"],
  chart: ["column", "bar", "line", "donut", "pie", "rings"],
  gallery: ["grid", "strip", "circles", "mosaic"],
  timeline: ["h", "v"],
  terminal: ["chrome", "bare"],
  list: ["dot", "check", "number", "boxed"],
  math: ["block", "inline"],
};

export const ANIM_TEMPLATES = ["hero", "neon", "glass", "badge", "cyberpunk", "minimal", "gradient-card"];
export const LAYOUTS = ["center", "statement", "image-left", "image-right", "image-full", "image-top", "diagonal", "circle", "arch"];
export const TRANSITIONS = [
  "fade", "slide", "slide-right", "slide-up", "slide-down", "push", "zoom", "zoom-out", "flip",
  "flip-x", "cube", "swing", "rotate", "skew", "drop", "blur", "wipe", "wipe-up", "iris", "glitch", "none",
];
export const ANIMS = ["fade", "fade-up", "fade-down", "zoom-in", "slide-left", "blur-in", "pop", "none"];

export interface SnippetDef {
  id: string;
  isBlock?: boolean;
  detail: string;
  doc: string;
  snippet: string;
}

/** Single canonical source of all block and element snippets for ::: and / triggers. */
export const SNIPPET_REGISTRY: SnippetDef[] = [
  {
    id: "anim",
    isBlock: true,
    detail: ":::anim — Built-in Tailwind Animation (typewriter, shimmer, stagger, float...)",
    doc: "### Animated Block\nAnimate any text or Markdown content with prebuilt Tailwind animations.\n```markdown\n:::anim style=typewriter speed=fast\nText to animate...\n:::\n```",
    snippet: ":::anim style=${1|typewriter,shimmer,stagger,gradient,float,pulse,wave,flip,bounce|} ${2:speed=fast}\n${3:Build interactive presentations with Tailwind CSS.}\n:::\n",
  },
  {
    id: "csv",
    isBlock: true,
    detail: ":::csv — CSV data table or charts (bar, column, line)",
    doc: "### CSV Block\nTurn raw CSV into an interactive styled data table or rendered chart.\n```markdown\n:::csv style=column\nQuarter,Revenue,Costs\nQ1 2025,1.2,0.8\n:::\n```",
    snippet: ":::csv style=${1|table,bar,column,line|}\n${2:Quarter,Revenue,Costs\nQ1 2025,1.2,0.8\nQ2 2025,1.8,0.9\nQ3 2025,2.4,1.1\nQ4 2025,3.1,1.3}\n:::\n",
  },
  {
    id: "counter",
    isBlock: true,
    detail: ":::counter — Live animated metric counters (up, flip)",
    doc: "### Counter Block\nAnimated count-up or flip numbers for KPIs and metrics.\n```markdown\n:::counter style=up\n99.9% | SLA Uptime | High Availability\n:::\n```",
    snippet: ":::counter style=${1|up,flip|}\n${2:99.98% | Uptime | Global SLA\n100M+ | Queries | Daily throughput}\n:::\n",
  },
  {
    id: "cards",
    isBlock: true,
    detail: ":::cards — Grid, glass, outline, numbered cards",
    doc: "### Cards Block\nResponsive card layout with icons, titles, and descriptions.\n```markdown\n:::cards style=glass cols=3\n- rocket | Launch | Fast delivery\n:::\n```",
    snippet: ":::cards style=${1|grid,glass,outline,numbered,iconLeft,accent|} cols=${2:3}\n- ${3:sparkle} | ${4:Title} | ${5:Description}\n- ${6:rocket} | ${7:Fast} | ${8:High performance}\n:::\n",
  },
  {
    id: "stats",
    isBlock: true,
    detail: ":::stats — Big metrics, boxed, plain, or accent bar",
    doc: "### Stats Block\nDisplay highlighted key statistics with trend badges.\n```markdown\n:::stats style=big\n- 4.9★ | User Rating | +15%\n:::\n```",
    snippet: ":::stats style=${1|boxed,plain,bar,big|}\n- ${2:42%} | ${3:Conversion Rate} | ${4:+12%}\n- ${5:1.2s} | ${6:Load Time} | ${7:-35%}\n:::\n",
  },
  {
    id: "flow",
    isBlock: true,
    detail: ":::flow — Pipeline, steps, stack, hub, cycle, funnel, pyramid",
    doc: "### Flow / Architecture Diagram\nVisual step-by-step pipeline or cycle diagram.\n```markdown\n:::flow style=pipeline\n- step 1 | Auth\n- step 2 | Process\n:::\n```",
    snippet: ":::flow style=${1|pipeline,steps,stack,hub,cycle,funnel,pyramid|}\n- ${2:rocket} | ${3:Step 1} | ${4:Initial setup}\n- ${5:gear} | ${6:Step 2} | ${7:Processing}\n- ${8:check} | ${9:Step 3} | ${10:Complete}\n:::\n",
  },
  {
    id: "timeline",
    isBlock: true,
    detail: ":::timeline — Horizontal or vertical timeline",
    doc: "### Timeline Block\nMilestones and chronological roadmap items.\n```markdown\n:::timeline style=h\n- Q1 | Design\n- Q2 | Release\n:::\n```",
    snippet: ":::timeline style=${1|h,v|}\n- ${2:Q1 2025} | ${3:Architecture & Prototype}\n- ${4:Q2 2025} | ${5:Beta launch with users}\n- ${6:Q3 2025} | ${7:General Availability}\n:::\n",
  },
  {
    id: "chart",
    isBlock: true,
    detail: ":::chart — Column, bar, line, donut, pie, or rings chart",
    doc: "### Chart Block\nVisualize data with customizable chart types.",
    snippet: ":::chart style=${1|column,bar,line,donut,pie,rings|}\n- ${2:Direct} | ${3:45}\n- ${4:Organic} | ${5:30}\n- ${6:Referral} | ${7:25}\n:::\n",
  },
  {
    id: "terminal",
    isBlock: true,
    detail: ":::terminal — Terminal window with syntax prompts",
    doc: "### Terminal Window\nMock shell window with prompt and command outputs.",
    snippet: ":::terminal ${1:bash}\n$ ${2:npm run build}\n✓ ${3:built in 1.2s}\n:::\n",
  },
  {
    id: "gallery",
    isBlock: true,
    detail: ":::gallery — Image grid, strip, circles, or mosaic",
    doc: "### Image Gallery\nArrange multiple images in modern layouts.",
    snippet: ":::gallery style=${1|grid,strip,circles,mosaic|}\n- ${2:https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe} | ${3:Caption}\n:::\n",
  },
  {
    id: "math",
    isBlock: true,
    detail: ":::math — LaTeX math equations via KaTeX",
    doc: "### Math Block\nRender high-precision LaTeX math formulas.",
    snippet: ":::math\n${1:f(x) = \\int_{-\\infty}^\\infty \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi}\n:::\n",
  },
  {
    id: "list",
    isBlock: true,
    detail: ":::list — Styled dot, check, number, or boxed list",
    doc: "### Styled List\nEnhanced list with custom bullet designs.",
    snippet: ":::list style=${1|dot,check,number,boxed|}\n- ${2:First highlight point}\n- ${3:Second key takeaway}\n- ${4:Third action item}\n:::\n",
  },
  {
    id: "table",
    isBlock: false,
    detail: "Table — Markdown data table",
    doc: "### Markdown Table\nStandard 3-column markdown table structure.",
    snippet: "| ${1:Feature} | ${2:Free} | ${3:Pro} |\n|---|---|---|\n| ${4:Unlimited Slides} | ${5:✓} | ${6:✓} |\n| ${7:Custom Styles} | ${8:—} | ${9:✓} |\n",
  },
  {
    id: "columns",
    isBlock: false,
    detail: "Columns — Two-column split with ||| divider",
    doc: "### Split Columns\nDivide content across two columns using `|||`.",
    snippet: "### ${1:Left Column}\n- ${2:Key insight A}\n- ${3:Key insight B}\n\n|||\n\n### ${4:Right Column}\n- ${5:Key insight C}\n- ${6:Key insight D}\n",
  },
  {
    id: "code",
    isBlock: false,
    detail: "Code — Fenced code block with file tab & line highlights",
    doc: "### Code Block\nSyntax highlighted code with filename and highlight line tags.",
    snippet: "```${1:typescript} ${2:app.ts} {${3:2}}\n${4:export function run() {\n  console.log('Hello world');\n}}\n```\n",
  },
  {
    id: "callout",
    isBlock: false,
    detail: "Callout — NOTE, TIP, WARNING, DANGER, SUCCESS box",
    doc: "### Callout Box\nGitHub-style colored callout box with icon.",
    snippet: "> [!${1|NOTE,TIP,WARNING,DANGER,SUCCESS|}]\n> ${2:Important highlight message goes here.}\n",
  },
  {
    id: "quote",
    isBlock: false,
    detail: "Quote — Pull quote with attribution",
    doc: "### Pull Quote\nBlockquote styled with attribution footnote.",
    snippet: "> ${1:Simplicity is the soul of efficiency.}\n— ${2:Austin Freeman}\n",
  },
  {
    id: "slide",
    isBlock: false,
    detail: "New Slide — Slide break (---) with title & kicker",
    doc: "### New Slide\nInsert a new slide separator with eyebrow kicker and heading.",
    snippet: "---\n^ ${1:Eyebrow Kicker}\n# ${2:Slide Title}\n\n${3:Start typing slide body here...}\n",
  },
  {
    id: "image",
    isBlock: false,
    detail: "Image — Media image with sizing attribute",
    doc: "### Image\nMarkdown image with `{w=...}` size controls.",
    snippet: "![${1:Description}](${2:https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe}){w=${3:80}}\n",
  },
  {
    id: "mermaid",
    isBlock: false,
    detail: "Mermaid Diagram — Flowchart, sequence, class, state diagram",
    doc: "### Mermaid Diagram\nRender vector diagrams directly from markdown.",
    snippet: "```mermaid\nflowchart LR\n  ${1:A[Client]} --> ${2:B[API Gateway]}\n  ${2:B[API Gateway]} --> ${3:C[(Database)]}\n```\n",
  },
  {
    id: "layout",
    isBlock: false,
    detail: "<!-- layout: ... --> Slide layout template",
    doc: "### Slide Layout\nChoose between center, statement, arch, circle, image-right, etc.",
    snippet: "<!-- layout: ${1|center,statement,image-left,image-right,image-full,image-top,diagonal,circle,arch|} -->\n",
  },
  {
    id: "transition",
    isBlock: false,
    detail: "<!-- transition: ... --> Slide transition effect",
    doc: "### Transition Effect\nSlide transition effect when presenting.",
    snippet: "<!-- transition: ${1|fade,slide,slide-right,slide-up,slide-down,push,zoom,zoom-out,flip,flip-x,cube,swing,rotate,skew,drop,blur,wipe,wipe-up,iris,glitch,none|} -->\n",
  },
];

export const DIRECTIVES = [
  { label: "layout:", snippet: "layout: ${1|center,statement,image-left,image-right,image-full,image-top,diagonal,circle,arch|} -->" },
  { label: "bg:", snippet: "bg: ${1:#111} -->" },
  { label: "color:", snippet: "color: ${1:#fff} -->" },
  { label: "accent:", snippet: "accent: ${1:#60a5fa} -->" },
  { label: "transition:", snippet: "transition: ${1|fade,slide,slide-right,slide-up,slide-down,push,zoom,zoom-out,flip,flip-x,cube,swing,rotate,skew,drop,blur,wipe,wipe-up,iris,glitch,none|} -->" },
  { label: "animate:", snippet: "animate: ${1|fade,fade-up,fade-down,zoom-in,slide-left,blur-in,pop,none|} -->" },
  { label: "fontSize:", snippet: "fontSize: ${1:1.2} -->" },
  { label: "fontScale:", snippet: "fontScale: ${1:1.15} -->" },
  { label: "titleSize:", snippet: "titleSize: ${1:3.2} -->" },
  { label: "clicks:", snippet: "clicks: ${1|true,false|} -->" },
  { label: "zoom:", snippet: "zoom: ${1:0.8} -->" },
];

export class SlideCompletionItemProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | vscode.CompletionList {
    const linePrefix = document.lineAt(position).text.slice(0, position.character);
    const items: vscode.CompletionItem[] = [];

    // 1. `style=` suggestions inside fenced blocks
    const styleMatch = linePrefix.match(/:::(anim|animation|motion|csv|counter|cards|stats|flow|chart|gallery|timeline|terminal|list|math)\b.*?style=([a-zA-Z0-9_-]*)$/i);
    if (styleMatch) {
      const blockType = styleMatch[1].toLowerCase();
      const variants = BLOCK_VARIANTS[blockType] || [];
      return variants.map((v) => {
        const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Value);
        item.detail = `md2slides ${blockType} style`;
        item.documentation = new vscode.MarkdownString(`Apply \`style=${v}\` to \`:::${blockType}\` block.`);
        return item;
      });
    }

    // 2. `template=` suggestions inside anim blocks
    const templateMatch = linePrefix.match(/:::(anim|animation|motion)\b.*?template=([a-zA-Z0-9_-]*)$/i);
    if (templateMatch) {
      return ANIM_TEMPLATES.map((t) => {
        const item = new vscode.CompletionItem(t, vscode.CompletionItemKind.Value);
        item.detail = "md2slides anim template preset";
        item.documentation = new vscode.MarkdownString(`Apply \`template=${t}\` style preset to animated block.`);
        return item;
      });
    }

    // 3. `<!-- layout: ` suggestions
    if (/<!--\s*layout:\s*([a-zA-Z0-9_-]*)$/i.test(linePrefix)) {
      return LAYOUTS.map((lay) => {
        const item = new vscode.CompletionItem(lay, vscode.CompletionItemKind.EnumMember);
        item.detail = "Slide Layout";
        item.insertText = `${lay} -->`;
        return item;
      });
    }

    // 4. `<!-- transition: ` suggestions
    if (/<!--\s*transition:\s*([a-zA-Z0-9_-]*)$/i.test(linePrefix)) {
      return TRANSITIONS.map((tr) => {
        const item = new vscode.CompletionItem(tr, vscode.CompletionItemKind.EnumMember);
        item.detail = "Slide Transition";
        item.insertText = `${tr} -->`;
        return item;
      });
    }

    // 5. `<!-- animate: ` suggestions
    if (/<!--\s*animate:\s*([a-zA-Z0-9_-]*)$/i.test(linePrefix)) {
      return ANIMS.map((an) => {
        const item = new vscode.CompletionItem(an, vscode.CompletionItemKind.EnumMember);
        item.detail = "Block Entrance Animation";
        item.insertText = `${an} -->`;
        return item;
      });
    }

    // 6. Directives trigger `<!-- `
    if (/<!--\s*([a-zA-Z]*)$/i.test(linePrefix)) {
      return DIRECTIVES.map((d) => {
        const item = new vscode.CompletionItem(d.label, vscode.CompletionItemKind.Keyword);
        item.insertText = new vscode.SnippetString(d.snippet);
        item.detail = "md2slides slide directive";
        return item;
      });
    }

    // 7. `:::` trigger - complete all fenced block types
    if (/^:::\w*$/i.test(linePrefix.trim())) {
      return SNIPPET_REGISTRY.filter((s) => s.isBlock).map((b) => {
        const item = new vscode.CompletionItem(`:::${b.id}`, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(b.snippet);
        item.detail = b.detail;
        item.documentation = new vscode.MarkdownString(b.doc);
        return item;
      });
    }

    // 8. `/` trigger - slash command insert menu
    const slashMatch = linePrefix.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (slashMatch) {
      const slashIndex = linePrefix.lastIndexOf("/");
      const slashRange = new vscode.Range(position.line, slashIndex, position.line, position.character);

      return SNIPPET_REGISTRY.map((opt) => {
        const item = new vscode.CompletionItem(`/${opt.id}`, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(opt.snippet);
        item.detail = opt.detail;
        item.documentation = new vscode.MarkdownString(opt.doc);
        item.range = slashRange;
        item.filterText = `/${opt.id}`;
        item.sortText = `0_${opt.id}`;
        return item;
      });
    }

    return items;
  }
}
