import React from "react";
import { saveAs } from "file-saver";

export function MenuBar({ editor }) {
  const handleSave = () => {
    //console.log("save editor", editor);
    console.log("save editor current", editor.current);
    if (editor) {
      const data = editor.current.toJSON();
      const blob = new Blob([JSON.stringify(data)], { type: "application/json;charset=utf-8" });
      saveAs(blob, "diagram.json");
    }
  };

  const handleLoad = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = JSON.parse(event.target.result);
      await editor.current.fromJSON(data);
    };

    reader.readAsText(file);
  };

  return (
    <div className="menu-bar">
      <button onClick={handleSave}>Save</button>
      <input type="file" id="file-input" onChange={handleLoad} />
    </div>
  );
}
