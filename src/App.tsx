import { useState } from "react";
import VariableInput from "./components/VariableInput";

const App = () => {
  const [value, setValue] = useState("");
  const variables = ["@name", "@age", "@address", "@phone"];

  return (
    <div>
      <div style={{ marginBottom: 5, fontSize: 16, fontWeight: 500, opacity: 0.8 }}>Prompt</div>
      <VariableInput value={value} onChange={setValue} variables={variables} />
    </div>
  );
};

export default App;
