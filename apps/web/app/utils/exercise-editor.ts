import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export async function editorLanguage(language: string): Promise<Extension> {
  switch (language) {
    case "javascript":
    case "typescript":
    case "jsx":
    case "tsx":
      return (await import("@codemirror/lang-javascript")).javascript({
        typescript: language === "typescript" || language === "tsx",
        jsx: language === "jsx" || language === "tsx",
      });
    case "html":
      return (await import("@codemirror/lang-html")).html();
    case "css":
      return (await import("@codemirror/lang-css")).css();
    case "python":
      return (await import("@codemirror/lang-python")).python();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    case "json":
      return (await import("@codemirror/lang-json")).json();
    default:
      return [];
  }
}

const highlight = HighlightStyle.define([
  { tag: tags.comment, color: "var(--s-code-comment)", fontStyle: "italic" },
  { tag: [tags.keyword, tags.tagName], color: "var(--s-code-keyword)" },
  { tag: [tags.string, tags.regexp, tags.attributeValue], color: "var(--s-code-string)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--s-code-constant)" },
  { tag: [tags.function(tags.variableName), tags.typeName], color: "var(--s-code-function)" },
  { tag: [tags.propertyName, tags.attributeName], color: "var(--s-code-parameter)" },
  { tag: tags.punctuation, color: "var(--s-code-punctuation)" },
]);

export function mountEditor(
  parent: HTMLElement,
  doc: string,
  language: Extension,
  label: string,
  keyboardHelp: string,
  onEdit: (value: string) => void,
) {
  return new EditorView({
    parent,
    doc,
    extensions: [
      language,
      syntaxHighlighting(highlight),
      lineNumbers(),
      EditorView.lineWrapping,
      EditorState.tabSize.of(2),
      indentOnInput(),
      closeBrackets(),
      history(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.contentAttributes.of({ "aria-label": label, "aria-description": keyboardHelp }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onEdit(update.state.doc.toString());
      }),
    ],
  });
}
