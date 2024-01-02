import { useState } from "react";
import SlateInput from "./components/SlateInput";

const App = () => {
  const [value, setValue] = useState("");
  const variables = ["broooo", "test", "another one", "demo", "demon", "decathlon", "brother", "bath"];

  console.log("value", value);

  return (
    <div>
      <div className="label">Label</div>
      <SlateInput variables={variables} onChange={setValue} placeholder="Add prompt here..." />
    </div>
  );
};

export default App;
