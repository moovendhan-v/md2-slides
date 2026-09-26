use super::*;
use crate::model::Severity;

fn p(src: &str) -> Deck {
    parse(src, &NoFiles)
}

#[test]
fn front_matter_and_vars() {
    let d = p("---\ntitle: Demo\nteam: Core\n---\n^ ${team}\n# Hello ${team}\nSub line");
    assert_eq!(d.meta.get("title").unwrap(), "Demo");
    assert_eq!(d.slides.len(), 1);
    let s = &d.slides[0];
    assert_eq!(s.kicker, "Core");
    assert_eq!(s.title, "Hello Core");
    assert_eq!(s.title_line, 5);
    assert_eq!(s.body, "Sub line");
}

#[test]
fn undefined_variable_is_error() {
    let d = p("# ${nope}");
    assert!(d.problems.iter().any(|x| x.sev == Severity::Error && x.msg.contains("nope")));
}

#[test]
fn slides_blocks_and_notes() {
    let d = p("# One\n:::cards style=grid cols=3\n- rocket | Fast | Very\n:::\nNote: say hi\nmore\n---\n# Two\n- a\n- b\n|||\n> [!TIP] ok");
    assert_eq!(d.slides.len(), 2);
    let c = &d.slides[0].groups[0][0];
    assert_eq!(c.kind, "cards");
    assert_eq!(c.rows.as_ref().unwrap().len(), 1);
    assert_eq!(d.slides[0].notes, "say hi\nmore");
    let two = &d.slides[1];
    assert_eq!(two.groups.len(), 2);
    assert_eq!(two.groups[0][0].kind, "list");
    assert_eq!(two.groups[1][0].callout.as_deref(), Some("TIP"));
}

#[test]
fn directives_and_layout() {
    let d = p("<!-- layout: center -->\n<!-- bg: #111; accent: #f472b6 -->\n# T");
    let s = &d.slides[0];
    assert_eq!(s.layout, "center");
    assert_eq!(s.dir.get("bg").unwrap(), "#111");
    assert_eq!(s.dir.get("accent").unwrap(), "#f472b6");
}

#[test]
fn code_table_quote_image() {
    let d = p("# C\n```ts a.ts {1|2}\nconst a = 1\nlet b\n```\n| A | B |\n|---|---|\n| x | **y** |\n> Quote\n— Me\n![alt](){w=60}");
    let g = &d.slides[0].groups[0];
    assert_eq!(g[0].kind, "code");
    assert_eq!(g[0].steps.as_ref().unwrap().len(), 2);
    assert_eq!(g[1].kind, "table");
    assert_eq!(g[1].table_rows.as_ref().unwrap()[0][1], "**y**");
    assert_eq!(g[2].by.as_deref(), Some("— Me"));
    assert_eq!(g[3].args.as_ref().unwrap().get("w").unwrap(), "60");
}

#[test]
fn unclosed_and_unknown() {
    let d = p("# X\n:::nope\n- a\n:::\n:::cards\n- a");
    assert!(d.problems.iter().any(|x| x.msg.contains("Unknown block type")));
    assert!(d.problems.iter().any(|x| x.msg.contains("Unclosed :::cards")));
}

#[test]
fn imports_use_resolver() {
    struct Files;
    impl Resolver for Files {
        fn resolve(&self, p: &str) -> Option<String> {
            (p == "src/a.ts").then(|| "l1\nl2\nl3".to_string())
        }
    }
    let d = parse("# I\n<<< @/src/a.ts#L2-3", &Files);
    let b = &d.slides[0].groups[0][0];
    assert_eq!(b.code.as_ref().unwrap(), &vec!["l2".to_string(), "l3".to_string()]);
}

#[test]
fn empty_slide_warns() {
    let d = p("# A\n---\n\n---\n# B");
    assert_eq!(d.slides.len(), 2);
    assert!(d.problems.iter().any(|x| x.msg == "Slide 2 is empty"));
}

#[test]
fn soft_wrapped_lines_join_into_one_paragraph() {
    let d = p("# T\nFirst body line\nstill body\n\nA para that\nwraps here\n- item\nafter list\nnote: n\nmore notes");
    let s = &d.slides[0];
    assert_eq!(s.body, "First body line still body");
    let g = &s.groups[0];
    assert_eq!(g[0].kind, "para");
    assert_eq!(g[0].text.as_deref(), Some("A para that wraps here"));
    assert_eq!(g[1].kind, "list");
    assert_eq!(s.notes, "n\nmore notes");
}
