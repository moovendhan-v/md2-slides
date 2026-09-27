import * as vscode from "vscode";

export const BLOCK_VARIANTS: Record<string, string[]> = {
  csv: ["table", "bar", "column", "line"],
  counter: ["up", "flip"],
  anim: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
  animation: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
  motion: ["typewriter", "shimmer", "glow", "stagger", "cascade", "gradient", "aurora", "bounce", "pop", "float", "levitate", "pulse", "radar", "wave", "flip", "spotlight"],
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

export class SlideCompletionItemProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | vscode.CompletionList {
    const linePrefix = document.lineAt(position).text.slice(0, position.character);
    const items: vscode.CompletionItem[] = [];

    // 1. `style=` auto-suggestions inside fenced blocks
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

    // 2. `template=` auto-suggestions inside anim blocks
    const templateMatch = linePrefix.match(/:::(anim|animation|motion)\b.*?template=([a-zA-Z0-9_-]*)$/i);
    if (templateMatch) {
      return ANIM_TEMPLATES.map((t) => {
        const item = new vscode.CompletionItem(t, vscode.CompletionItemKind.Value);
        item.detail = "md2slides anim template preset";
        item.documentation = new vscode.MarkdownString(`Apply \`template=${t}\` style preset to animated block.`);
        return item;
      });
    }

    // 3. `<!-- layout: ` auto-suggestions
    if (/<!--\s*layout:\s*([a-zA-Z0-9_-]*)$/i.test(linePrefix)) {
      return LAYOUTS.map((lay) => {
        const item = new vscode.CompletionItem(lay, vscode.CompletionItemKind.EnumMember);
        item.detail = "Slide Layout";
        item.insertText = `${lay} -->`;
        return item;
      });
    }

    // 4. `<!-- transition: ` auto-suggestions
    if (/<!--\s*transition:\s*([a-zA-Z0-9_-]*)$/i.test(linePrefix)) {
      return TRANSITIONS.map((tr) => {
        const item = new vscode.CompletionItem(tr, vscode.CompletionItemKind.EnumMember);
        item.detail = "Slide Transition";
        item.insertText = `${tr} -->`;
        return item;
      });
    }

    // 5. `<!-- animate: ` auto-suggestions
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
      const directives = [
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
      return directives.map((d) => {
        const item = new vscode.CompletionItem(d.label, vscode.CompletionItemKind.Keyword);
        item.insertText = new vscode.SnippetString(d.snippet);
        item.detail = "md2slides slide directive";
        return item;
      });
    }

    // 7. `:::` trigger - complete all block types with snippets!
    if (/^:::\w*$/i.test(linePrefix.trim())) {
      const blockSnippets = [
        {
          label: ":::csv",
          snippet: ":::csv style=${1|table,bar,column,line|}\n${2:Quarter,Revenue,Costs\nQ1,1.2,0.8\nQ2,1.8,0.9}\n:::\n",
          detail: "CSV Table or Chart block",
        },
        {
          label: ":::anim",
          snippet: ":::anim style=${1|typewriter,shimmer,stagger,gradient,float,pulse,wave,flip,bounce|} ${2:speed=fast}\n${3:Build fast presentations with Tailwind CSS.}\n:::\n",
          detail: "Built-in Animation block",
        },
        {
          label: ":::counter",
          snippet: ":::counter style=${1|up,flip|}\n${2:99.9% | Uptime | Global SLA\n100M | Requests | Handled per day}\n:::\n",
          detail: "Animated Counter block",
        },
        {
          label: ":::math",
          snippet: ":::math\n${1:E = mc^2}\n:::\n",
          detail: "LaTeX Math block (KaTeX)",
        },
        {
          label: ":::cards",
          snippet: ":::cards style=${1|grid,glass,outline,numbered,iconLeft,accent|} cols=${2:3}\n- ${3:sparkle} | ${4:Title} | ${5:Description}\n:::\n",
          detail: "Feature Cards block",
        },
        {
          label: ":::stats",
          snippet: ":::stats style=${1|boxed,plain,bar,big|}\n- ${2:42%} | ${3:Metric} | ${4:+12%}\n:::\n",
          detail: "Stats block",
        },
        {
          label: ":::flow",
          snippet: ":::flow style=${1|pipeline,steps,stack,hub,cycle,funnel,pyramid|}\n- ${2:rocket} | ${3:Step 1} | ${4:Detail}\n:::\n",
          detail: "Diagram / Flow block",
        },
        {
          label: ":::timeline",
          snippet: ":::timeline style=${1|h,v|}\n- ${2:Q1} | ${3:Milestone description}\n:::\n",
          detail: "Timeline block",
        },
        {
          label: ":::chart",
          snippet: ":::chart style=${1|column,bar,line,donut,pie,rings|}\n- ${2:Label} | ${3:42}\n:::\n",
          detail: "Chart block",
        },
        {
          label: ":::terminal",
          snippet: ":::terminal ${1:bash}\n$ ${2:npm run build}\n✓ ${3:built in 1.2s}\n:::\n",
          detail: "Terminal command window block",
        },
      ];

      return blockSnippets.map((b) => {
        const item = new vscode.CompletionItem(b.label, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(b.snippet);
        item.detail = b.detail;
        return item;
      });
    }

    return items;
  }
}
