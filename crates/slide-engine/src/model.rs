//! Serializable deck model shared with the TypeScript renderer (`src/engine/types.ts`).

use serde::Serialize;
use std::collections::BTreeMap;

pub type Args = BTreeMap<String, String>;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warn,
    Info,
}

#[derive(Serialize, Clone, Debug)]
pub struct Problem {
    pub line: usize,
    pub sev: Severity,
    pub msg: String,
}

/// One renderable block. Optional fields are omitted from JSON so the
/// TypeScript side sees the same shape the original design engine produced.
#[derive(Serialize, Clone, Debug, Default)]
pub struct Block {
    #[serde(rename = "type")]
    pub kind: String,
    pub line: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub args: Option<Args>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rows: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(rename = "kind", skip_serializing_if = "Option::is_none")]
    pub callout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub src: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head: Option<Vec<String>>,
    #[serde(rename = "tableRows", skip_serializing_if = "Option::is_none")]
    pub table_rows: Option<Vec<Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lang: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hl: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<Vec<Option<Vec<u32>>>>,
    #[serde(skip_serializing_if = "is_false")]
    pub magic: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub imported: Option<String>,
    #[serde(skip_serializing_if = "is_false")]
    pub bare: bool,
    #[serde(skip_serializing_if = "is_false")]
    pub mermaid: bool,
}

fn is_false(b: &bool) -> bool {
    !*b
}

impl Block {
    pub fn new(kind: &str, line: usize) -> Self {
        Block { kind: kind.to_string(), line, ..Default::default() }
    }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Slide {
    pub start_line: usize,
    pub title: String,
    /// -1 when the slide has no title (kept signed for JS parity).
    pub title_line: i64,
    pub kicker: String,
    pub body: String,
    pub groups: Vec<Vec<Block>>,
    pub notes: String,
    pub layout: String,
    pub dir: BTreeMap<String, String>,
}

impl Slide {
    pub fn new(start_line: usize) -> Self {
        Slide {
            start_line,
            title: String::new(),
            title_line: -1,
            kicker: String::new(),
            body: String::new(),
            groups: vec![Vec::new()],
            notes: String::new(),
            layout: String::new(),
            dir: BTreeMap::new(),
        }
    }

    pub fn has_blocks(&self) -> bool {
        self.groups.iter().any(|g| !g.is_empty())
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct Deck {
    pub meta: BTreeMap<String, String>,
    pub slides: Vec<Slide>,
    pub problems: Vec<Problem>,
}
