import { Controlled as MirrorEditor } from "react-codemirror2";
import CodeMirror, { Editor } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/anyword-hint";
import "./styles.css";

type PropsD = {
  value: string;
  onChange: (value: string) => void;
  variables?: string[];
};

export default function VariableInput({ value, onChange, variables = [] }: PropsD) {
  const initialState = {
    initStart: -1,
    firstChar: "",
  };

  CodeMirror.defineMode("customMode", () => {
    return {
      token: (stream) => {
        if (stream.match("@")) {
          stream.eatWhile(/[\w$]/);
          const currentWord = stream.current();
          if (variables.includes(currentWord)) {
            return "variable";
          }
        }
        stream.next();
        return null;
      },
    };
  });

  const customHint = (editor: Editor, isCtrlSpace?: boolean) => {
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);
    const value = editor.getValue();

    if (initialState?.initStart === -1) {
      initialState.initStart = cursor.ch;
    }

    if (initialState?.firstChar?.trim() === "" || initialState?.firstChar?.trim() === "@" || token?.string?.trim() === "@") {
      initialState.firstChar = token?.string?.trim()?.slice(1);
    }

    const end = cursor.ch;
    const line = cursor.line;
    const currentWord = token.string;

    const list = isCtrlSpace
      ? currentWord?.length
        ? variables.filter((variable) => variable?.includes(currentWord))
        : []
      : variables.filter((variable) => variable?.slice(1)?.startsWith(initialState?.firstChar) && variable?.includes(currentWord));

    const lastAtPosition = value?.lastIndexOf("@");

    const hints = {
      list: list,
      from: isCtrlSpace ? CodeMirror.Pos(line, lastAtPosition !== -1 ? lastAtPosition : initialState?.initStart) : CodeMirror.Pos(line, initialState?.initStart),
      to: CodeMirror.Pos(line, end),
    };

    return hints;
  };

  return (
    <MirrorEditor
      value={value}
      onBeforeChange={(_editor, _data, newValue) => {
        onChange(newValue);
        const lastChar = newValue.slice(-1);
        if (!lastChar.match(/[\w$@]/)) {
          initialState.initStart = -1;
          initialState.firstChar = "";
        }
      }}
      options={{
        mode: "customMode",
        lineWrapping: true,
        extraKeys: {
          "'@'": (cm) => {
            const cursor = cm.getCursor();
            cm.replaceRange("@", cursor);
            cm.showHint({
              hint: (editor: Editor) => customHint(editor),
              completeSingle: false,
            });
          },
          "Ctrl-Space": (cm) => {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            const value = cm.getValue();

            if (value?.trim()?.length === 0 || token?.string?.trim()?.length === 0 || !token?.string?.startsWith("@")) {
              return;
            }

            cm.showHint({
              hint: (editor: Editor) => customHint(editor, true),
              completeSingle: false,
            });
          },
        },
      }}
      className="codemirror-wrapper"
    />
  );
}
