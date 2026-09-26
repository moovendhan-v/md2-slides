//! Block-level constructs: fences, code, callouts, quotes, images, tables, lists.

use super::code::{fence_header, import_line, make_code, mermaid};
use super::text::{is_attribution, is_check_item, is_numbered, list_marker, parse_args, word_prefix};
use super::Ctx;
use crate::model::{Args, Block, Severity};

pub const FENCES: [&str; 8] = ["cards", "stats", "flow", "timeline", "list", "terminal", "chart", "gallery"];
pub const CALLOUTS: [&str; 5] = ["NOTE", "TIP", "WARNING", "DANGER", "SUCCESS"];

/// Allowed `style=` values per fenced block (warn on anything else).
pub fn variants(kind: &str) -> &'static [&'static str] {
    match kind {
        "cards" => &["grid", "glass", "outline", "numbered", "iconLeft", "accent"],
        "stats" => &["boxed", "plain", "bar", "big"],
        "list" => &["dot", "check", "number", "boxed"],
        "flow" => &["pipeline", "steps", "stack", "hub", "cycle", "funnel", "pyramid"],
        "chart" => &["column", "bar", "line", "donut", "pie", "rings"],
        "gallery" => &["grid", "strip", "circles", "mosaic"],
        "timeline" => &["h", "v"],
        "terminal" => &["chrome", "bare"],
        _ => &[],
    }
}

pub fn heading(line: usize, text: String) -> Block {
    let mut b = Block::new("heading", line);
    b.text = Some(text);
    b
}

/// Dispatch a block line; returns the last line index consumed.
pub fn block(cx: &mut Ctx, i: usize, l: &str) -> usize {
    if let Some(rest) = l.strip_prefix(":::") {
        let kind = word_prefix(rest);
        if !kind.is_empty() {
            return fenced(cx, i, kind.to_string(), rest[kind.len()..].trim());
        }
    }
    if let Some(imp) = import_line(l) {
        return import(cx, i, imp);
    }
    if let Some(rest) = l.strip_prefix("```") {
        return code_fence(cx, i, rest);
    }
    if let Some(rest) = l.strip_prefix('>') {
        return quote_or_callout(cx, i, rest);
    }
    if let Some(b) = image(cx, i, l) {
        cx.push(b);
        return i;
    }
    if l.starts_with('|') {
        return table(cx, i, l);
    }
    if list_marker(l) {
        return list(cx, i, l);
    }
    let text = cx.sub(l, i);
    let s = cx.cur();
    if s.body.is_empty() && s.groups.len() == 1 && s.groups[0].is_empty() {
        s.body = text;
    } else {
        let mut b = Block::new("para", i);
        b.text = Some(text);
        cx.push(b);
    }
    i
}

fn fenced(cx: &mut Ctx, start: usize, kind: String, arg_str: &str) -> usize {
    let args = parse_args(arg_str);
    let mut rows = Vec::new();
    let mut closed = false;
    let mut i = start + 1;
    while i < cx.lines.len() {
        let t = cx.lines[i].trim();
        if t == ":::" {
            closed = true;
            break;
        }
        if t == "---" {
            break;
        }
        let raw = cx.lines[i];
        rows.push(cx.sub(raw, i));
        i += 1;
    }
    let end = if closed { i } else { i - 1 };
    if !closed {
        cx.problem(start, Severity::Error, format!("Unclosed :::{} block", kind));
    }
    if !FENCES.contains(&kind.as_str()) {
        cx.problem(start, Severity::Error, format!("Unknown block type \"{}\"", kind));
        return end;
    }
    if let Some(st) = args.get("style") {
        if !variants(&kind).contains(&st.as_str()) {
            cx.problem(start, Severity::Warn, format!("Unknown style \"{}\" for {}", st, kind));
        }
    }
    let mut b = Block::new(&kind, start);
    b.args = Some(args);
    b.rows = Some(rows.into_iter().filter(|r| !r.trim().is_empty()).collect());
    cx.push(b);
    end
}

fn import(cx: &mut Ctx, i: usize, imp: super::code::Import) -> usize {
    let Some(txt) = cx.resolver.resolve(imp.file) else {
        cx.problem(i, Severity::Error, format!("Snippet not found: {}", imp.file));
        return i;
    };
    let all: Vec<String> = txt.split('\n').map(String::from).collect();
    let a = imp.from.unwrap_or(1).max(1);
    let b = imp.to.unwrap_or(if imp.from.is_some() { a } else { all.len() });
    let slice: Vec<String> = all.iter().skip(a - 1).take(b.saturating_sub(a - 1)).cloned().collect();
    let ext = imp.file.rsplit('.').next().unwrap_or("txt");
    let name = imp.file.rsplit('/').next().unwrap_or(imp.file);
    let title = if imp.from.is_some() { format!("{} #L{}-{}", name, a, b) } else { name.to_string() };
    let block = make_code(i, imp.lang.unwrap_or(ext), title, slice, imp.spec, imp.magic, false, Some(imp.file.to_string()));
    cx.push(block);
    i
}

fn code_fence(cx: &mut Ctx, start: usize, header: &str) -> usize {
    let spec = fence_header(header);
    let mut code = Vec::new();
    let mut closed = false;
    let mut i = start + 1;
    while i < cx.lines.len() {
        if cx.lines[i].trim().starts_with("```") {
            closed = true;
            break;
        }
        code.push(cx.lines[i].to_string());
        i += 1;
    }
    if !closed {
        cx.problem(start, Severity::Error, "Unclosed code fence");
    }
    let end = i.min(cx.lines.len() - 1);
    if spec.lang.eq_ignore_ascii_case("mermaid") {
        match mermaid(&code) {
            Some((rows, style)) => {
                let mut b = Block::new("flow", start);
                b.mermaid = true;
                let mut a = Args::new();
                a.insert("style".into(), style.into());
                b.args = Some(a);
                b.rows = Some(rows);
                cx.push(b);
            }
            None => cx.problem(start, Severity::Warn, "Mermaid: no edges found (use A[Label] --> B[Label])"),
        }
        return end;
    }
    let block = make_code(start, spec.lang, spec.title.clone(), code, spec.spec, spec.magic, spec.bare, None);
    cx.push(block);
    end
}

fn quote_or_callout(cx: &mut Ctx, start: usize, rest: &str) -> usize {
    let r = rest.trim_start();
    if let Some(after) = r.strip_prefix("[!") {
        let kind = word_prefix(after);
        if !kind.is_empty() && after[kind.len()..].starts_with(']') {
            let t = kind.to_ascii_uppercase();
            if !CALLOUTS.contains(&t.as_str()) {
                cx.problem(start, Severity::Warn, format!("Unknown callout {}", t));
            }
            let body = after[kind.len() + 1..].trim_start();
            let mut b = Block::new("callout", start);
            b.callout = Some(t);
            b.text = Some(cx.sub(body, start));
            cx.push(b);
            return start;
        }
    }
    let mut text = rest.strip_prefix(' ').unwrap_or(rest).to_string();
    let mut i = start;
    while i + 1 < cx.lines.len() && cx.lines[i + 1].trim().starts_with('>') {
        i += 1;
        let t = cx.lines[i].trim().trim_start_matches('>');
        text.push(' ');
        text.push_str(t.strip_prefix(' ').unwrap_or(t));
    }
    let mut by = String::new();
    if i + 1 < cx.lines.len() && is_attribution(cx.lines[i + 1].trim()) {
        i += 1;
        by = cx.lines[i].trim().to_string();
    }
    let mut b = Block::new("quote", start);
    b.text = Some(cx.sub(&text, start));
    b.by = Some(cx.sub(&by, start));
    cx.push(b);
    i
}

fn image(cx: &mut Ctx, i: usize, l: &str) -> Option<Block> {
    let r = l.strip_prefix("![")?;
    let close = r.find("](")?;
    let alt = &r[..close];
    let after = &r[close + 2..];
    let end = after.find(')')?;
    let src = &after[..end];
    let tail = &after[end + 1..];
    let args = match (tail.starts_with('{'), tail.rfind('}')) {
        (true, Some(e)) => parse_args(&tail[1..e]),
        _ => parse_args(""),
    };
    if src.is_empty() {
        cx.problem(i, Severity::Info, "Image has no src — placeholder shown");
    }
    let mut b = Block::new("image", i);
    b.alt = Some(alt.to_string());
    b.src = Some(src.to_string());
    b.args = Some(args);
    Some(b)
}

fn table(cx: &mut Ctx, start: usize, first: &str) -> usize {
    let mut tl = vec![first.to_string()];
    let mut i = start;
    while i + 1 < cx.lines.len() && cx.lines[i + 1].trim().starts_with('|') {
        i += 1;
        tl.push(cx.lines[i].trim().to_string());
    }
    let is_rule = |r: &str| r.chars().all(|c| matches!(c, '|' | ':' | '-' | ' ' | '\t'));
    let body: Vec<&String> = tl.iter().enumerate().filter(|(k, r)| *k != 1 || !is_rule(r)).map(|(_, r)| r).collect();
    let cells = |r: &str| -> Vec<String> {
        let r = r.strip_prefix('|').unwrap_or(r);
        let r = r.strip_suffix('|').unwrap_or(r);
        r.split('|').map(|c| c.trim().to_string()).collect::<Vec<_>>()
    };
    let head = cells(body[0]);
    let rows: Vec<Vec<String>> = body[1..].iter().map(|r| cells(r)).collect();
    let mut b = Block::new("table", start);
    b.head = Some(head.iter().map(|c| cx.sub(c, start)).collect());
    b.table_rows = Some(rows.iter().map(|r| r.iter().map(|c| cx.sub(c, start)).collect()).collect());
    cx.push(b);
    i
}

fn list(cx: &mut Ctx, start: usize, first: &str) -> usize {
    let mut items = vec![first.to_string()];
    let mut i = start;
    while i + 1 < cx.lines.len() && list_marker(cx.lines[i + 1].trim_start()) {
        i += 1;
        items.push(cx.lines[i].trim().to_string());
    }
    let style = if is_numbered(first) {
        "number"
    } else if items.iter().any(|x| is_check_item(x)) {
        "check"
    } else {
        "dot"
    };
    let mut a = Args::new();
    a.insert("style".into(), style.into());
    let mut b = Block::new("list", start);
    b.args = Some(a);
    b.rows = Some(items.iter().map(|x| cx.sub(x, start)).collect());
    b.bare = true;
    cx.push(b);
    i
}
