//! Slidewise engine — the performance-critical core compiled to WebAssembly.
//! The same `.wasm` runs in the browser (live preview on every keystroke) and
//! in Vercel Functions (`src/app/api/*`), so parsing and template search
//! behave identically on both sides.

pub mod model;
pub mod mustache;
pub mod parser;
pub mod store;

use wasm_bindgen::prelude::*;

struct JsResolver(js_sys::Function);

impl parser::Resolver for JsResolver {
    fn resolve(&self, path: &str) -> Option<String> {
        self.0.call1(&JsValue::NULL, &JsValue::from_str(path)).ok().and_then(|v| v.as_string())
    }
}

/// Parse a deck. `resolve(path) => string | undefined` serves `<<<` imports.
/// Returns the deck model as a JSON string.
#[wasm_bindgen(js_name = parseDeck)]
pub fn parse_deck(src: &str, resolve: Option<js_sys::Function>) -> String {
    let deck = match resolve {
        Some(f) => parser::parse(src, &JsResolver(f)),
        None => parser::parse(src, &parser::NoFiles),
    };
    serde_json::to_string(&deck).unwrap_or_else(|_| "{}".into())
}

/// Render a custom layout's HTML slots with JSON slide data.
#[wasm_bindgen(js_name = fillTemplate)]
pub fn fill_template(html: &str, data_json: &str) -> String {
    let data = serde_json::from_str(data_json).unwrap_or(serde_json::Value::Null);
    mustache::fill(html, &data)
}

#[wasm_bindgen(js_name = engineVersion)]
pub fn engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn err(e: impl ToString) -> JsError {
    JsError::new(&e.to_string())
}

/// Template registry exposed to JS. All payloads are JSON strings so the
/// boundary stays cheap and schema-checked on the Rust side.
#[wasm_bindgen]
pub struct TemplateStore {
    inner: store::Store,
}

#[wasm_bindgen]
impl TemplateStore {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TemplateStore {
        TemplateStore { inner: store::Store::default() }
    }

    /// Restore from a binary snapshot produced by `snapshot()`.
    #[wasm_bindgen(js_name = fromSnapshot)]
    pub fn from_snapshot(bytes: &[u8]) -> Result<TemplateStore, JsError> {
        store::Store::restore(bytes).map(|inner| TemplateStore { inner }).map_err(err)
    }

    #[wasm_bindgen(getter)]
    pub fn size(&self) -> usize {
        self.inner.len()
    }

    /// Append a JSON array of templates (ids already present are replaced).
    #[wasm_bindgen(js_name = loadMany)]
    pub fn load_many(&mut self, json: &str) -> Result<usize, JsError> {
        let list: Vec<store::Template> = serde_json::from_str(json).map_err(err)?;
        let n = list.len();
        self.inner.extend(list);
        Ok(n)
    }

    pub fn upsert(&mut self, json: &str) -> Result<(), JsError> {
        let t: store::Template = serde_json::from_str(json).map_err(err)?;
        if t.id.trim().is_empty() {
            return Err(JsError::new("template id is required"));
        }
        self.inner.upsert(t);
        Ok(())
    }

    pub fn remove(&mut self, id: &str) -> bool {
        self.inner.remove(id)
    }

    /// JSON of one template, or an empty string when missing.
    pub fn get(&self, id: &str) -> String {
        self.inner.get(id).and_then(|t| serde_json::to_string(t).ok()).unwrap_or_default()
    }

    /// `{source, category, q, page, per}` → `{items, total, page, pages}`.
    pub fn query(&self, filter_json: &str) -> Result<String, JsError> {
        let f: store::Filter = serde_json::from_str(filter_json).map_err(err)?;
        serde_json::to_string(&self.inner.query(&f)).map_err(err)
    }

    pub fn categories(&self, source: &str) -> String {
        serde_json::to_string(&self.inner.categories(source)).unwrap_or_else(|_| "[]".into())
    }

    pub fn snapshot(&self) -> Vec<u8> {
        self.inner.snapshot()
    }
}

impl Default for TemplateStore {
    fn default() -> Self {
        Self::new()
    }
}
