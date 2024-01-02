/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useCallback, useRef, useEffect, useState, KeyboardEvent } from "react";
import { Editor, Transforms, Range, createEditor, Descendant } from "slate";
import { withHistory } from "slate-history";
import { Slate, Editable, ReactEditor, withReact, useSelected, useFocused } from "slate-react";
import ReactDOM from "react-dom";
import { RenderElementProps, RenderLeafProps } from "slate-react";
import "./styles.css";
import { CustomEditor, MentionElement, PortalProps, SlateInputProps } from "./types";

const Portal: React.FC<PortalProps> = ({ children }) => {
  return typeof document === "object" ? ReactDOM.createPortal(children, document.body) : null;
};

interface Mention {
  type: "mention";
  character: string;
  children: Array<{ text: string }>;
}

interface Paragraph {
  type: "paragraph";
  children: Array<{ text: string } | Mention>;
}

type Element = Paragraph;

function convertStringToArray(input: string): Element[] {
  const result: Element[] = [];
  const regex = /{{([^}]+)}}/g;
  let lastIndex = 0;

  input.replace(regex, (match, character, index) => {
    const beforeText = input.slice(lastIndex, index);
    if (beforeText) {
      result.push({
        type: "paragraph",
        children: [{ text: beforeText }],
      });
    }

    result.push({
      type: "paragraph",
      children: [
        {
          type: "mention",
          character: character.trim(),
          children: [{ text: "" }],
        },
      ],
    });

    lastIndex = index + match.length;

    return match;
  });

  const remainingText = input.slice(lastIndex);
  if (remainingText || result.length === 0) {
    result.push({
      type: "paragraph",
      children: [{ text: remainingText }],
    });
  }

  return result;
}

const initialValue: Descendant[] = convertStringToArray("");
console.log("initialValue", initialValue);

const SlateInput = ({ onChange, placeholder = "Your text here...", variables }: SlateInputProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);
  const chars = variables.filter((c: string) => c.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (target && chars.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            setIndex(index >= chars.length - 1 ? 0 : index + 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            setIndex(index <= 0 ? chars.length - 1 : index - 1);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            console.log(" target", target, " chars", chars, " index", index);
            Transforms.select(editor, target);
            insertMention(editor, chars[index]);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [chars, editor, index, target]
  );

  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      if (el) {
        el.style.top = `${rect.top + window.scrollY + 24}px`;
        el.style.left = `${rect.left + window.scrollX}px`;
      }
    }
  }, [chars.length, editor, index, search, target]);

  const onChangeBrace = (value: Descendant[]) => {
    onChange(
      // @ts-expect-error children mightn't exist
      value[0]?.children?.reduce((acc: string, v: any) => {
        if (v?.type === "mention") {
          acc += `{{${v?.character}}}`;
        } else {
          acc += v?.text;
        }

        return acc;
      }, "")
    );

    console.log("value", value);

    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const [cursorPoint] = Range.edges(selection);

      const currentBefore = Editor.before(editor, cursorPoint, { unit: "word" });
      const wordRange = currentBefore && Editor.range(editor, currentBefore, cursorPoint);
      const currentText = wordRange && Editor.string(editor, wordRange);
      const currentMatch = currentText && currentText.match(/\{$/);

      const wordBefore = Editor.before(editor, start, { unit: "word" });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/^{(\w*)$/);

      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      console.log("currentBefore: ", currentBefore);
      console.log("wordRange: ", wordRange);

      //   if (currentText) {
      //     const lastChar = currentText[currentText.length - 1];
      //     const lastTwoChars = currentText.slice(-2);

      //     if (lastChar === "{") {
      //       const point = Editor.end(editor, selection);
      //       const afterPoint = Editor.after(editor, point);
      //       const afterRange = Editor.range(editor, point, afterPoint);
      //       const afterText = Editor.string(editor, afterRange);

      //       if (afterText.charAt(0) !== "}") {
      //         Transforms.insertText(editor, "}", { at: point });
      //         Transforms.move(editor, { distance: 1, unit: "character", reverse: true });
      //       }

      //       if (lastTwoChars === "{{") {
      //         console.log("inside last two afterText", afterText);

      //         if (afterText.slice(-2) !== "}}") {
      //           console.log("inside slice");
      //           Transforms.insertText(editor, "}}", { at: point });
      //           Transforms.move(editor, { distance: 1, unit: "character", reverse: true });
      //         }
      //       }
      //     }

      //     console.log("lastTwoChars", lastTwoChars);
      //   }

      //   if (currentText) {
      //     const lastChar = currentText[currentText.length - 1];
      //     const lastTwoChars = currentText.slice(-2);

      //     if (lastChar === "{" && !autoInserted) {
      //       const point = Editor.end(editor, selection);
      //       const afterPoint = Editor.after(editor, point);
      //       const afterRange = Editor.range(editor, point, afterPoint);
      //       const afterText = Editor.string(editor, afterRange);

      //       if (lastTwoChars === "{{" && afterText.slice(0, 2) !== "}}") {
      //         Transforms.insertText(editor, "}}", { at: point });
      //         Transforms.move(editor, { distance: 2, unit: "character", reverse: true });
      //         setAutoInserted(true);
      //       } else if (afterText.charAt(0) !== "}") {
      //         Transforms.insertText(editor, "}", { at: point });
      //         Transforms.move(editor, { distance: 1, unit: "character", reverse: true });
      //         setAutoInserted(true);
      //       }
      //     } else {
      //       setAutoInserted(false);
      //     }
      //   }

      if (currentMatch && wordRange) {
        setTarget(wordRange);
        setSearch("");
        setIndex(0);
        return;
      }
      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);
  };

  console.log("editor", editor);

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={onChangeBrace}>
      <Editable renderElement={renderElement} renderLeaf={renderLeaf} onKeyDown={onKeyDown} placeholder={placeholder} className="editor" />
      {target && chars.length > 0 && (
        <Portal>
          <div
            ref={ref}
            style={{
              top: "-9999px",
              left: "-9999px",
              position: "absolute",
              zIndex: 1,
              padding: "3px",
              background: "white",
              borderRadius: "4px",
              boxShadow: "0 1px 5px rgba(0,0,0,.2)",
            }}
            data-cy="mentions-portal"
          >
            {/* <div style={{ marginBlock: 10 }}>
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
              <button>Add new</button>
            </div> */}

            {chars.map((char, i) => (
              <div
                key={char}
                onClick={() => {
                  Transforms.select(editor, target);
                  insertMention(editor, char);
                  setTarget(null);
                }}
                style={{
                  padding: "1px 3px",
                  borderRadius: "3px",
                  background: i === index ? "rgba(0,0,255,0.2)" : "transparent",
                }}
              >
                {char}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </Slate>
  );
};

const withMentions = (editor: CustomEditor): CustomEditor => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  editor.markableVoid = (element) => {
    return element.type === "mention" || markableVoid(element);
  };

  return editor;
};

const insertMention = (editor: CustomEditor, character: string): void => {
  const mention: MentionElement = {
    type: "mention",
    character,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const Element: React.FC<RenderElementProps> = (props) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case "mention":
      return <Mention {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Mention: React.FC<any> = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const style: React.CSSProperties = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-block",
    borderRadius: "4px",
    backgroundColor: "rgba(0, 0, 255, 0.08)",
    color: "rgb(0, 0, 255)",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };
  // See if our empty text child has any styling marks applied and apply those
  if (element.children[0].bold) {
    style.fontWeight = "bold";
  }
  if (element.children[0].italic) {
    style.fontStyle = "italic";
  }
  return (
    <span {...attributes} contentEditable={false} data-cy={`mention-${element.character.replace(" ", "-")}`} style={style}>
      {`{{${element.character}}}`}
      {children}
    </span>
  );
};

export default SlateInput;
