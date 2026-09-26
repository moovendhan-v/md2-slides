//! Code fences and repository imports (`<<<`).

use super::text::{parse_steps, word_prefix};
use crate::model::{Args, Block};

pub struct CodeSpec<'a> {
    pub lang: &'a str,
    pub title: String,
    pub spec: Option<&'a str>,
    pub magic: bool,
    pub bare: bool,
}

/// Header of a ```` ```lang file.ts {1|2} magic ```` fence (after the backticks).
pub fn fence_header(rest: &str) -> CodeSpec<'_> {
    let lang = word_prefix(rest);
    let tail = rest[lang.len()..].trim();
    let (before, spec, after) = match (tail.find('{'), tail.rfind('}')) {
        (Some(a), Some(b)) if b > a => (&tail[..a], Some(&tail[a..=b]), &tail[b + 1..]),
        _ => (tail, None, ""),
    };
    let magic = after.trim() == "magic" || before.split_whitespace().any(|t| t == "magic");
    let bare = before.contains("nochrome");
    let title = before
        .split_whitespace()
        .filter(|t| *t != "magic" && *t != "nochrome")
        .collect::<Vec<_>>()
        .join(" ");
    CodeSpec { lang, title, spec, magic, bare }
}

pub fn make_code(line: usize, lang: &str, title: String, code: Vec<String>, spec: Option<&str>, magic: bool, bare: bool, imported: Option<String>) -> Block {
    let steps = spec.map(parse_steps).unwrap_or_default();
    let mut b = Block::new("code", line);
    b.lang = Some(if lang.is_empty() { "txt".into() } else { lang.to_string() });
    b.title = Some(title);
    b.code = Some(code);
    b.hl = Some(steps.first().cloned().flatten().unwrap_or_default());
    b.steps = if steps.len() > 1 { Some(steps) } else { None };
    b.magic = magic;
    b.imported = imported;
    let mut args = Args::new();
    args.insert("style".into(), if bare { "bare" } else { "chrome" }.into());
    b.args = Some(args);
    b
}

pub struct Import<'a> {
    pub file: &'a str,
    pub from: Option<usize>,
    pub to: Option<usize>,
    pub lang: Option<&'a str>,
    pub spec: Option<&'a str>,
    pub magic: bool,
}

/// `<<< @/src/file.ts#L3-12 ts {2|4} magic`
pub fn import_line(l: &str) -> Option<Import<'_>> {
    let rest = l.strip_prefix("<<<")?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let rest = rest.trim_start();
    let rest = rest.strip_prefix('@').unwrap_or(rest);
    let rest = rest.strip_prefix('/').unwrap_or(rest);
    let end = rest.find(|c: char| c.is_whitespace() || c == '#' || c == '{').unwrap_or(rest.len());
    let file = &rest[..end];
    if file.is_empty() {
        return None;
    }
    let mut tail = &rest[end..];
    let (mut from, mut to) = (None, None);
    if let Some(r) = tail.strip_prefix("#L") {
        let d = r.chars().take_while(|c| c.is_ascii_digit()).count();
        from = r[..d].parse().ok();
        let mut r2 = &r[d..];
        if let Some(x) = r2.strip_prefix('-') {
            let x = x.strip_prefix('L').unwrap_or(x);
            let d2 = x.chars().take_while(|c| c.is_ascii_digit()).count();
            to = x[..d2].parse().ok();
            r2 = &x[d2..];
        }
        tail = r2;
    }
    let (mut lang, mut spec, mut magic) = (None, None, false);
    let tail = tail.trim();
    let (words, sp) = match tail.find('{') {
        Some(a) => (&tail[..a], tail[a..].find('}').map(|b| &tail[a..=a + b])),
        None => (tail, None),
    };
    spec = spec.or(sp);
    for w in words.split_whitespace().chain(tail.rsplit('}').next().unwrap_or("").split_whitespace()) {
        if w == "magic" {
            magic = true;
        } else if lang.is_none() && !w.contains('}') {
            lang = Some(w);
        }
    }
    Some(Import { file, from, to, lang, spec, magic })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fence() {
        let s = fence_header("ts file.ts {2|3} magic");
        assert_eq!(s.lang, "ts");
        assert_eq!(s.title, "file.ts");
        assert!(s.magic);
        assert_eq!(s.spec, Some("{2|3}"));
    }

    #[test]
    fn import() {
        let i = import_line("<<< @/src/a.ts#L3-12 {2|4} magic").unwrap();
        assert_eq!(i.file, "src/a.ts");
        assert_eq!((i.from, i.to), (Some(3), Some(12)));
        assert!(i.magic);
        assert_eq!(i.spec, Some("{2|4}"));
    }
}
