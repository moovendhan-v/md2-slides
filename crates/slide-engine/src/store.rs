//! In-memory template registry with indexed search and a compact binary
//! snapshot format (`SWT1` framing) for persistence (IndexedDB, Blob, KV…).

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Template {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub cat: String,
    #[serde(default)]
    pub author: String,
    /// GitHub username of a community author (credited with avatar + profile link).
    #[serde(default, rename = "authorGithub", skip_serializing_if = "Option::is_none")]
    pub author_github: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub md: String,
    #[serde(default)]
    pub stars: u32,
    #[serde(default)]
    pub community: bool,
    #[serde(default)]
    pub single: bool,
    #[serde(default)]
    pub code: bool,
    #[serde(default)]
    pub look: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub html: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<Value>,
}

#[derive(Deserialize, Default)]
pub struct Filter {
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub q: Option<String>,
    #[serde(default)]
    pub page: usize,
    #[serde(default)]
    pub per: usize,
}

#[derive(Serialize)]
pub struct Page<'a> {
    pub items: Vec<&'a Template>,
    pub total: usize,
    pub page: usize,
    pub pages: usize,
}

struct Entry {
    t: Template,
    haystack: String,
}

impl Entry {
    fn new(t: Template) -> Self {
        let haystack = format!("{} {} {} {} {}", t.name, t.cat, t.author, t.author_github.as_deref().unwrap_or(""), t.md).to_lowercase();
        Entry { t, haystack }
    }

    fn in_source(&self, src: &str) -> bool {
        match src {
            "single" => self.t.single,
            "community" => self.t.community,
            "builtin" => !self.t.community && !self.t.single,
            _ => true,
        }
    }
}

#[derive(Default)]
pub struct Store {
    entries: Vec<Entry>,
}

const MAGIC: &[u8; 4] = b"SWT1";

impl Store {
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Insert or replace by id. New templates go first (newest-first listing).
    pub fn upsert(&mut self, t: Template) {
        match self.entries.iter().position(|e| e.t.id == t.id) {
            Some(i) => self.entries[i] = Entry::new(t),
            None => self.entries.insert(0, Entry::new(t)),
        }
    }

    /// Append many (keeps given order); existing ids are replaced in place.
    pub fn extend(&mut self, list: Vec<Template>) {
        for t in list {
            match self.entries.iter().position(|e| e.t.id == t.id) {
                Some(i) => self.entries[i] = Entry::new(t),
                None => self.entries.push(Entry::new(t)),
            }
        }
    }

    pub fn remove(&mut self, id: &str) -> bool {
        let before = self.entries.len();
        self.entries.retain(|e| e.t.id != id);
        before != self.entries.len()
    }

    pub fn get(&self, id: &str) -> Option<&Template> {
        self.entries.iter().find(|e| e.t.id == id).map(|e| &e.t)
    }

    pub fn query(&self, f: &Filter) -> Page<'_> {
        let src = f.source.as_deref().unwrap_or("all");
        let cat = f.category.as_deref().filter(|c| !c.is_empty() && *c != "All");
        let q = f.q.as_deref().map(str::to_lowercase).filter(|q| !q.is_empty());
        let hits: Vec<&Template> = self
            .entries
            .iter()
            .filter(|e| e.in_source(src))
            .filter(|e| cat.is_none_or(|c| e.t.cat == c))
            .filter(|e| q.as_ref().is_none_or(|q| e.haystack.contains(q.as_str())))
            .map(|e| &e.t)
            .collect();
        let total = hits.len();
        let per = if f.per == 0 { total.max(1) } else { f.per };
        let pages = total.div_ceil(per).max(1);
        let page = f.page.min(pages - 1);
        let items = hits.into_iter().skip(page * per).take(per).collect();
        Page { items, total, page, pages }
    }

    pub fn categories(&self, source: &str) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        for e in self.entries.iter().filter(|e| e.in_source(source)) {
            if !e.t.cat.is_empty() && !out.contains(&e.t.cat) {
                out.push(e.t.cat.clone());
            }
        }
        out
    }

    /// `SWT1 | u32 count | (u32 len | json)*` — little endian.
    pub fn snapshot(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(64 * self.entries.len());
        out.extend_from_slice(MAGIC);
        out.extend_from_slice(&(self.entries.len() as u32).to_le_bytes());
        for e in &self.entries {
            let bytes = serde_json::to_vec(&e.t).unwrap_or_default();
            out.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
            out.extend_from_slice(&bytes);
        }
        out
    }

    pub fn restore(bytes: &[u8]) -> Result<Store, String> {
        if bytes.len() < 8 || &bytes[..4] != MAGIC {
            return Err("not a template snapshot".into());
        }
        let read_u32 = |at: usize| -> Result<usize, String> {
            bytes.get(at..at + 4).map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]) as usize).ok_or_else(|| "truncated snapshot".to_string())
        };
        let count = read_u32(4)?;
        let mut at = 8;
        let mut store = Store::default();
        for _ in 0..count {
            let len = read_u32(at)?;
            at += 4;
            let chunk = bytes.get(at..at + len).ok_or("truncated snapshot")?;
            let t: Template = serde_json::from_slice(chunk).map_err(|e| e.to_string())?;
            store.entries.push(Entry::new(t));
            at += len;
        }
        Ok(store)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn t(id: &str, cat: &str, single: bool) -> Template {
        serde_json::from_value(serde_json::json!({ "id": id, "name": id.to_uppercase(), "cat": cat, "md": "# body", "single": single })).unwrap()
    }

    #[test]
    fn query_filters_and_pages() {
        let mut s = Store::default();
        s.extend(vec![t("a", "Business", false), t("b", "Engineering", false), t("c", "Cards", true)]);
        let f = Filter { source: Some("builtin".into()), per: 1, ..Default::default() };
        let p = s.query(&f);
        assert_eq!((p.total, p.pages, p.items[0].id.as_str()), (2, 2, "a"));
        let f = Filter { q: Some("B".into()), source: Some("builtin".into()), ..Default::default() };
        assert_eq!(s.query(&f).total, 2);
        assert_eq!(s.categories("single"), vec!["Cards".to_string()]);
    }

    #[test]
    fn keeps_and_searches_community_author() {
        let mut s = Store::default();
        let c: Template = serde_json::from_value(serde_json::json!({ "id": "c1", "name": "Incident", "author": "Ada", "authorGithub": "ada-l", "description": "Postmortem", "community": true })).unwrap();
        s.upsert(c);
        let json = serde_json::to_value(s.get("c1").unwrap()).unwrap();
        assert_eq!(json["authorGithub"], "ada-l");
        assert_eq!(json["description"], "Postmortem");
        let f = Filter { q: Some("ada-l".into()), source: Some("community".into()), ..Default::default() };
        assert_eq!(s.query(&f).total, 1);
        let r = Store::restore(&s.snapshot()).unwrap();
        assert_eq!(r.get("c1").unwrap().author_github.as_deref(), Some("ada-l"));
    }

    #[test]
    fn snapshot_roundtrip() {
        let mut s = Store::default();
        s.upsert(t("x", "Custom", true));
        let r = Store::restore(&s.snapshot()).unwrap();
        assert_eq!(r.get("x").unwrap().cat, "Custom");
        assert!(Store::restore(b"nope").is_err());
    }
}
