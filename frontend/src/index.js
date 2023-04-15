import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useRete } from "./rete";
import { MenuBar } from "./components/menu_bar";

import "./styles.css";

function Editor() {
  const [setContainer, editorRef] = useRete();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh"
      }}
      ref={(ref) => ref && setContainer(ref)}
    >
      <MenuBar editor={editorRef} />
    </div>
  );
}

function App() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="App">
      {visible && <Editor />}
    </div>
  );
}

const rootElement = document.getElementById("root");
createRoot(rootElement).render(<App />);
