//! Logic-less slot renderer for custom HTML + Tailwind layouts.
//! Supports `{{key}}`, `{{a.b}}`, `{{#list}}…{{/list}}` sections and
//! `{{^key}}…{{/key}}` inverted sections. Values are HTML-escaped.

use serde_json::Value;

fn escape(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => o.push_str("&amp;"),
            '<' => o.push_str("&lt;"),
            '>' => o.push_str("&gt;"),
            '"' => o.push_str("&quot;"),
            _ => o.push(c),
        }
    }
    o
}

fn lookup<'a>(scopes: &[&'a Value], key: &str) -> Option<&'a Value> {
    if key == "." {
        return scopes.last().copied();
    }
    for scope in scopes.iter().rev() {
        let mut cur = Some(*scope);
        for part in key.split('.') {
            cur = cur.and_then(|v| v.get(part));
        }
        if let Some(v) = cur {
            return Some(v);
        }
    }
    None
}

fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Array(a)) => !a.is_empty(),
        Some(Value::Number(n)) => n.as_f64() != Some(0.0),
        Some(Value::Object(_)) => true,
    }
}

fn to_text(v: Option<&Value>) -> String {
    match v {
        None | Some(Value::Null) => String::new(),
        Some(Value::String(s)) => s.clone(),
        Some(other) => other.to_string(),
    }
}

/// Find the matching `{{/name}}` for a section opened just before `from`.
fn section_end(tpl: &str, name: &str, from: usize) -> Option<(usize, usize)> {
    let close = format!("{{{{/{}}}}}", name);
    let start = tpl[from..].find(&close)? + from;
    Some((start, start + close.len()))
}

fn render(tpl: &str, scopes: &[&Value], out: &mut String) {
    let mut rest = 0;
    while let Some(open) = tpl[rest..].find("{{") {
        let open = rest + open;
        out.push_str(&tpl[rest..open]);
        let Some(close) = tpl[open..].find("}}") else {
            out.push_str(&tpl[open..]);
            return;
        };
        let tag = tpl[open + 2..open + close].trim();
        let after = open + close + 2;
        let (sigil, name) = match tag.chars().next() {
            Some(c @ ('#' | '^')) => (Some(c), tag[1..].trim()),
            _ => (None, tag),
        };
        match sigil {
            Some(s) => {
                let Some((inner_end, next)) = section_end(tpl, name, after) else {
                    rest = after;
                    continue;
                };
                let inner = &tpl[after..inner_end];
                let v = lookup(scopes, name);
                if s == '^' {
                    if !truthy(v) {
                        render(inner, scopes, out);
                    }
                } else if let Some(Value::Array(items)) = v {
                    for (i, item) in items.iter().enumerate() {
                        let mut merged = match item {
                            Value::Object(m) => Value::Object(m.clone()),
                            other => serde_json::json!({ ".": other }),
                        };
                        merged["index"] = Value::from(i + 1);
                        let mut inner_scopes = scopes.to_vec();
                        inner_scopes.push(&merged);
                        render(inner, &inner_scopes, out);
                    }
                } else if truthy(v) {
                    render(inner, scopes, out);
                }
                rest = next;
            }
            None => {
                out.push_str(&escape(&to_text(lookup(scopes, name))));
                rest = after;
            }
        }
    }
    out.push_str(&tpl[rest..]);
}

pub fn fill(tpl: &str, data: &Value) -> String {
    let mut out = String::with_capacity(tpl.len() * 2);
    render(tpl, &[data], &mut out);
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn fills_slots_sections_and_escapes() {
        let d = json!({ "title": "<Hi>", "items": [{ "t": "a" }, { "t": "b" }], "image": "" });
        let out = fill("{{title}}|{{#items}}{{index}}{{t}},{{/items}}|{{^image}}none{{/image}}", &d);
        assert_eq!(out, "&lt;Hi&gt;|1a,2b,|none");
    }
}
