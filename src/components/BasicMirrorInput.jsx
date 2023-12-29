import { useState } from "react";
import { Controlled as MirrorEditor } from "react-codemirror2";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/anyword-hint";

CodeMirror.defineMode("customMode", () => {
  return {
    token: (stream) => {
      if (stream.match("@")) {
        stream.eatWhile(/[\w$]/);
        return "variable";
      }
      stream.next();
      return null;
    },
  };
});

export default function MirrorInput() {
  const [value, setValue] = useState("");
  const variables = ["@name", "@age", "@address", "@phone"];
  const initialState = {
    initStart: -1,
    firstChar: "",
  };

  const customHint = (editor) => {
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);

    if (initialState?.initStart === -1) {
      initialState.initStart = cursor.ch;
    }

    if (initialState?.firstChar?.trim() === "") {
      initialState.firstChar = token?.string?.trim();
    }

    const end = cursor.ch;
    const line = cursor.line;
    const currentWord = token.string;

    const list = variables.filter((variable) => variable.slice(1).startsWith(initialState?.firstChar) && variable.includes(currentWord));

    const hints = {
      list: list.length ? list : variables,
      from: CodeMirror.Pos(line, initialState?.initStart),
      to: CodeMirror.Pos(line, end),
    };

    return hints;
  };

  return (
    <>
      <MirrorEditor
        value={value}
        onBeforeChange={(editor, data, newValue) => {
          setValue(newValue);
          const lastChar = newValue.slice(-1);
          if (!lastChar.match(/[\w$@]/)) {
            initialState.initStart = -1;
            initialState.firstChar = "";
          }
        }}
        options={{
          theme: "material",
          mode: "customMode",
          lineWrapping: true,
          extraKeys: {
            "'@'": (cm) => {
              cm.showHint({
                hint: (editor) => customHint(editor),
                completeSingle: false,
              });
            },
          },
        }}
        className="codemirror-wrapper"
      />
    </>
  );
}
// import { useState } from "react";
// import { Controlled as MirrorEditor } from "react-codemirror2";
// import CodeMirror from "codemirror";
// import "codemirror/lib/codemirror.css";
// import "codemirror/theme/material.css";
// import "codemirror/addon/hint/show-hint";
// import "codemirror/addon/hint/javascript-hint";
// import "codemirror/addon/hint/show-hint.css";
// import "codemirror/addon/hint/anyword-hint";

// CodeMirror.defineMode("customMode", () => {
//   return {
//     token: (stream) => {
//       if (stream.match("@")) {
//         stream.eatWhile(/[\w$]/);
//         return "variable";
//       }
//       stream.next();
//       return null;
//     },
//   };
// });

// export default function MirrorInput() {
//   const [value, setValue] = useState("");
//   const variables = ["@name", "@age", "@address", "@phone"];
//   const initialState = {
//     initStart: -1,
//     firstChar: "",
//   };

//   const customHint = (editor) => {
//     const cursor = editor.getCursor();
//     const token = editor.getTokenAt(cursor);

//     if (initialState?.initStart === -1) {
//       initialState.initStart = cursor.ch;
//     }

//     if (initialState?.firstChar?.trim() === "" || initialState?.firstChar?.trim() === "@") {
//       initialState.firstChar = token?.string?.trim()?.slice(1);
//     }

//     const end = cursor.ch;
//     const line = cursor.line;
//     const currentWord = token.string;

//     const list = variables.filter((variable) => variable.slice(1).startsWith(initialState?.firstChar) && variable.includes(currentWord));

//     const hints = {
//       list: list.length ? list : variables,
//       from: CodeMirror.Pos(line, initialState?.initStart),
//       to: CodeMirror.Pos(line, end),
//     };

//     return hints;
//   };

//   return (
//     <>
//       <MirrorEditor
//         value={value}
//         onBeforeChange={(editor, data, newValue) => {
//           setValue(newValue);
//           const lastChar = newValue.slice(-1);
//           if (!lastChar.match(/[\w$@]/)) {
//             initialState.initStart = -1;
//             initialState.firstChar = "";
//           }
//         }}
//         options={{
//           theme: "material",
//           mode: "customMode",
//           lineWrapping: true,
//           extraKeys: {
//             "'@'": (cm) => {
//               setValue(value + "@");
//               cm.showHint({
//                 hint: (editor) => customHint(editor),
//                 completeSingle: false,
//               });
//             },
//           },
//         }}
//         className="codemirror-wrapper"
//       />
//     </>
//   );
// }
