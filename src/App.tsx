import { useState } from "react";
import VariableInput from "./components/VariableInput";

const App = () => {
  const [value, setValue] = useState("");
  const variables = ["@name", "@age", "@address", "@phone"];

  return (
    <div>
      <div className="label">Label</div>
      <VariableInput value={value} onChange={setValue} variables={variables} />
    </div>
  );
};

export default App;
