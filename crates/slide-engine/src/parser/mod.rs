//! Markdown → deck model. The syntax is documented in `public/llms-full.txt`.

mod blocks;
pub mod code;
pub mod text;

use crate::model::{Deck, Problem, Severity, Slide};
use std::collections::BTreeMap;

/// Resolves repository files for `<<< @/path` imports (dependency inversion:
/// the parser never knows whether files come from JS, disk or a test map).
pub trait Resolver {
    fn resolve(&self, path: &str) -> Option<String>;
}

pub struct NoFiles;
impl Resolver for NoFiles {
    fn resolve(&self, _: &str) -> Option<String> {
        None
    }
}

pub(crate) struct Ctx<'a> {
    pub lines: Vec<&'a str>,
    pub vars: BTreeMap<String, String>,
    pub problems: Vec<Problem>,
    pub slides: Vec<Slide>,
    pub resolver: &'a dyn Resolver,
}

impl Ctx<'_> {
    pub fn problem(&mut self, line: usize, sev: Severity, msg: impl Into<String>) {
        self.problems.push(Problem { line, sev, msg: msg.into() });
    }

    /// Substitute `${var}` references, reporting undefined ones.
    pub fn sub(&mut self, t: &str, ln: usize) -> String {
        if !t.contains("${") {
            return t.to_string();
        }
        let mut out = String::with_capacity(t.len());
        let mut rest = t;
        while let Some(i) = rest.find("${") {
            out.push_str(&rest[..i]);
            let after = &rest[i + 2..];
            let name = text::word_prefix(after);
            if !name.is_empty() && after[name.len()..].starts_with('}') {
                match self.vars.get(name).cloned() {
                    Some(v) => out.push_str(&v),
                    None => {
                        self.problem(ln, Severity::Error, format!("Undefined variable ${{{}}}", name));
                        out.push_str(&rest[i..i + 3 + name.len()]);
                    }
                }
                rest = &after[name.len() + 1..];
            } else {
                out.push_str("${");
                rest = after;
            }
        }
        out.push_str(rest);
        out
    }

    pub fn cur(&mut self) -> &mut Slide {
        self.slides.last_mut().expect("at least one slide")
    }

    pub fn push(&mut self, b: crate::model::Block) {
        self.cur().groups.last_mut().expect("group").push(b);
    }
}

fn front_matter(lines: &[&str]) -> (BTreeMap<String, String>, usize) {
    let mut meta = BTreeMap::new();
    if lines.first().map(|l| l.trim()) != Some("---") {
        return (meta, 0);
    }
    let mut j = 1;
    while j < lines.len() && lines[j].trim() != "---" {
        if let Some((k, v)) = text::meta_pair(lines[j]) {
            meta.insert(k, v);
        }
        j += 1;
    }
    if j < lines.len() {
        (meta, j + 1)
    } else {
        (BTreeMap::new(), 0)
    }
}

pub fn parse(src: &str, resolver: &dyn Resolver) -> Deck {
    let lines: Vec<&str> = src.split('\n').collect();
    let (meta, start) = front_matter(&lines);
    let mut cx = Ctx { vars: meta.clone(), lines, problems: Vec::new(), slides: vec![Slide::new(start)], resolver };
    let mut in_notes = false;
    let mut i = start;
    while i < cx.lines.len() {
        let raw = cx.lines[i];
        let l = raw.trim();
        if l == "---" {
            cx.slides.push(Slide::new(i + 1));
            in_notes = false;
        } else if in_notes {
            let s = cx.cur();
            if !s.notes.is_empty() {
                s.notes.push('\n');
            }
            s.notes.push_str(raw);
        } else if l.len() >= 5 && l[..5].eq_ignore_ascii_case("note:") {
            in_notes = true;
            cx.cur().notes = l[5..].trim_start().to_string();
        } else if !l.is_empty() {
            i = line(&mut cx, i, l);
        }
        i += 1;
    }
    finish(meta, cx)
}

/// Parse one non-empty, non-separator line; returns the last consumed index.
fn line(cx: &mut Ctx, i: usize, l: &str) -> usize {
    if let Some(inner) = text::html_comment(l) {
        if text::starts_with_pair(inner) {
            for (k, v) in text::parse_directives(inner) {
                if k == "layout" {
                    cx.cur().layout = v;
                } else {
                    let v = cx.sub(&v, i);
                    cx.cur().dir.insert(k, v);
                }
            }
        }
        return i;
    }
    if l.starts_with("<!--") {
        return i;
    }
    if l == "|||" {
        cx.cur().groups.push(Vec::new());
        return i;
    }
    if let Some(k) = l.strip_prefix('^').filter(|r| r.starts_with(char::is_whitespace)) {
        let k = cx.sub(k.trim_start(), i);
        cx.cur().kicker = k;
        return i;
    }
    if let Some(t) = text::heading(l, 1, 2) {
        let t = cx.sub(t, i);
        if cx.cur().title.is_empty() {
            let s = cx.cur();
            s.title = t;
            s.title_line = i as i64;
        } else {
            cx.push(blocks::heading(i, t));
        }
        return i;
    }
    if let Some(t) = text::heading(l, 3, 6) {
        let t = cx.sub(t, i);
        cx.push(blocks::heading(i, t));
        return i;
    }
    blocks::block(cx, i, l)
}

/// True when trimmed, non-empty `l` would be parsed as plain paragraph text
/// (it starts no block, heading, directive, separator or notes).
pub(super) fn is_plain_text(l: &str) -> bool {
    !(l == "---"
        || l == "|||"
        || l.starts_with("<!--")
        || l.starts_with(":::")
        || l.starts_with("```")
        || l.starts_with('>')
        || l.starts_with('|')
        || l.starts_with("![")
        || (l.len() >= 5 && l[..5].eq_ignore_ascii_case("note:"))
        || l.strip_prefix('^').is_some_and(|r| r.starts_with(char::is_whitespace))
        || text::heading(l, 1, 6).is_some()
        || text::list_marker(l)
        || code::import_line(l).is_some())
}

fn finish(meta: BTreeMap<String, String>, mut cx: Ctx) -> Deck {
    let mut extra = Vec::new();
    for (k, s) in cx.slides.iter().enumerate() {
        let has_quote = s.groups.iter().flatten().any(|b| b.kind == "quote");
        if s.title.is_empty() && !s.has_blocks() && s.body.is_empty() {
            extra.push(Problem { line: s.start_line, sev: Severity::Warn, msg: format!("Slide {} is empty", k + 1) });
        } else if s.title.is_empty() && !has_quote {
            extra.push(Problem { line: s.start_line, sev: Severity::Info, msg: format!("Slide {} has no title", k + 1) });
        }
    }
    cx.problems.extend(extra);
    cx.problems.sort_by_key(|p| p.line);
    let slides = cx
        .slides
        .into_iter()
        .filter(|s| !s.title.is_empty() || !s.body.is_empty() || !s.kicker.is_empty() || s.has_blocks())
        .collect();
    Deck { meta, slides, problems: cx.problems }
}

#[cfg(test)]
mod tests;
