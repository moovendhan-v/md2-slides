//! Small, allocation-light text helpers used by the line parser.
//! Hand-written instead of `regex` to keep the Wasm binary small.

use crate::model::Args;

pub fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// Leading run of word characters.
pub fn word_prefix(s: &str) -> &str {
    let end = s.char_indices().find(|(_, c)| !is_word(*c)).map(|(i, _)| i).unwrap_or(s.len());
    &s[..end]
}

/// `key: value` where key is `\w[\w-]*` — used by front-matter.
pub fn meta_pair(line: &str) -> Option<(String, String)> {
    let first = line.chars().next()?;
    if !is_word(first) {
        return None;
    }
    let colon = line.find(':')?;
    let key = &line[..colon];
    if !key.chars().all(|c| is_word(c) || c == '-') {
        return None;
    }
    let val = line[colon + 1..].trim_start();
    Some((key.to_string(), strip_quotes(val).to_string()))
}

fn strip_quotes(v: &str) -> &str {
    let v = v.strip_prefix(['"', '\'']).unwrap_or(v);
    v.strip_suffix(['"', '\'']).unwrap_or(v)
}

/// `key: value` where key is `\w+` (directive pairs). Both sides trimmed.
pub fn directive_pair(kv: &str) -> Option<(String, String)> {
    let kv = kv.trim();
    let colon = kv.find(':')?;
    let key = kv[..colon].trim();
    if key.is_empty() || !key.chars().all(is_word) {
        return None;
    }
    Some((key.to_string(), kv[colon + 1..].trim().to_string()))
}

/// Parses multiple `key: value; key2: value2` directives from inside `<!-- ... -->`.
/// Handles values that contain embedded semicolons (like base64 data URLs `data:image/png;base64,...`).
pub fn parse_directives(inner: &str) -> Vec<(String, String)> {
    let mut pairs = Vec::new();
    let s = inner.trim();
    if s.is_empty() {
        return pairs;
    }

    let is_key_at = |pos: usize| -> Option<(&str, usize)> {
        if pos >= s.len() {
            return None;
        }
        let rest = &s[pos..];
        let trimmed_start_len = rest.len() - rest.trim_start().len();
        let trimmed = &rest[trimmed_start_len..];
        let w = word_prefix(trimmed);
        if w.is_empty() {
            return None;
        }
        let after_w = &trimmed[w.len()..];
        let trimmed_after = after_w.trim_start();
        if trimmed_after.starts_with(':') {
            let colon_offset = pos + trimmed_start_len + w.len() + (after_w.len() - trimmed_after.len());
            Some((w, colon_offset + 1))
        } else {
            None
        }
    };

    let bytes = s.as_bytes();
    let len = bytes.len();
    let (mut cur_key, mut val_start, mut i) = match is_key_at(0) {
        Some((k, after_colon)) => (Some(k.to_string()), after_colon, after_colon),
        None => return pairs,
    };

    while i < len {
        if bytes[i] == b';' {
            if let Some((k, after_colon)) = is_key_at(i + 1) {
                if let Some(prev_k) = cur_key.take() {
                    let val = s[val_start..i].trim();
                    pairs.push((prev_k, val.to_string()));
                }
                cur_key = Some(k.to_string());
                val_start = after_colon;
                i = after_colon;
                continue;
            }
        }
        i += 1;
    }

    if let Some(prev_k) = cur_key {
        let val = s[val_start..].trim();
        pairs.push((prev_k, val.to_string()));
    }

    pairs
}


/// Inner text of `<!-- ... -->` when the whole line is one comment.
pub fn html_comment(l: &str) -> Option<&str> {
    let inner = l.strip_prefix("<!--")?.strip_suffix("-->")?;
    Some(inner.trim())
}

/// True when `s` starts with `\w+\s*:`.
pub fn starts_with_pair(s: &str) -> bool {
    let w = word_prefix(s);
    !w.is_empty() && s[w.len()..].trim_start().starts_with(':')
}

/// Strip a heading marker of exactly `n` hashes followed by whitespace.
pub fn heading(l: &str, min: usize, max: usize) -> Option<&str> {
    let hashes = l.chars().take_while(|c| *c == '#').count();
    if hashes < min || hashes > max {
        return None;
    }
    let rest = &l[hashes..];
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    Some(rest.trim_start())
}

/// `- item`, `* item` or `12. item` marker (on an already trimmed line).
pub fn list_marker(l: &str) -> bool {
    if let Some(r) = l.strip_prefix(['-', '*']) {
        return r.starts_with(char::is_whitespace) && !r.trim().is_empty();
    }
    let digits = l.chars().take_while(|c| c.is_ascii_digit()).count();
    digits > 0 && l[digits..].starts_with('.') && l[digits + 1..].starts_with(char::is_whitespace)
}

pub fn is_numbered(l: &str) -> bool {
    l.chars().next().is_some_and(|c| c.is_ascii_digit())
}

/// `- [ ] x` / `- [x] x` checklist detection.
pub fn is_check_item(l: &str) -> bool {
    let r = match l.strip_prefix(['-', '*']) {
        Some(r) => r.trim_start(),
        None => return false,
    };
    let lower = r.to_ascii_lowercase();
    lower.starts_with("[ ]") || lower.starts_with("[x]")
}

/// `style=grid cols=3 Some title` → args with `_title`.
pub fn parse_args(s: &str) -> Args {
    let mut o = Args::new();
    let mut title: Vec<&str> = Vec::new();
    for tok in s.split_whitespace() {
        match tok.find('=') {
            Some(i) if i > 0 && tok[..i].chars().all(is_word) => {
                o.insert(tok[..i].to_string(), tok[i + 1..].to_string());
            }
            _ => title.push(tok),
        }
    }
    o.insert("_title".into(), title.join(" "));
    o
}

/// `{2|3-4,6|all}` → highlight step groups (None = all lines).
pub fn parse_steps(spec: &str) -> Vec<Option<Vec<u32>>> {
    let inner = spec.trim_start_matches('{').trim_end_matches('}');
    inner
        .split('|')
        .map(|st| {
            let st = st.trim();
            if st.is_empty() || st == "all" {
                return None;
            }
            let mut set: Vec<u32> = Vec::new();
            for part in st.split(',') {
                let mut it = part.trim().splitn(2, '-');
                let a: u32 = it.next().and_then(|x| x.trim().parse().ok()).unwrap_or(0);
                if a == 0 {
                    continue;
                }
                let b: u32 = it.next().and_then(|x| x.trim().parse().ok()).unwrap_or(a);
                for x in a..=b.max(a) {
                    if !set.contains(&x) {
                        set.push(x);
                    }
                }
            }
            Some(set)
        })
        .collect()
}

/// Quote attribution line: `— Name`, `– Name`, `- Name`, `-- Name`.
pub fn is_attribution(l: &str) -> bool {
    let dashes = l.chars().take_while(|c| matches!(c, '—' | '–' | '-')).count();
    if dashes == 0 || dashes > 2 {
        return false;
    }
    let skip: usize = l.chars().take(dashes).map(char::len_utf8).sum();
    l[skip..].starts_with(char::is_whitespace)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn steps_parse() {
        assert_eq!(parse_steps("{2|3-4|all}"), vec![Some(vec![2]), Some(vec![3, 4]), None]);
    }

    #[test]
    fn args_parse() {
        let a = parse_args("style=grid cols=3 2.8M");
        assert_eq!(a.get("style").unwrap(), "grid");
        assert_eq!(a.get("_title").unwrap(), "2.8M");
    }

    #[test]
    fn markers() {
        assert!(list_marker("- a"));
        assert!(list_marker("12. a"));
        assert!(!list_marker("-a"));
        assert!(is_attribution("— Kent Beck"));
        assert!(heading("## Hi", 1, 2).is_some());
        assert!(heading("### Hi", 1, 2).is_none());
    }
}
