import React, { useState, useEffect, useCallback, useRef } from "react";
import Rete from "rete";
import { createRoot } from "react-dom/client";
import ReactRenderPlugin from "rete-react-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
import AreaPlugin from "rete-area-plugin";
import HistoryPlugin from "rete-history-plugin";
import Context from "efficy-rete-context-menu-plugin";
import KeyboardPlugin from 'rete-keyboard-plugin';


//import custom parts
import { AddComponent, NumComponent } from "./rete_components/math_part";
import { TextComponent, ParagraphInput, StaticTextComponent, LLM_comp} from "./rete_components/text_part";
import { ChatControlComponent, LLM_chat_comp } from "./rete_components/chat_block";





export async function createEditor(container) {
  var components = [
    new NumComponent(),
    new AddComponent(),
    new TextComponent(),
    new ParagraphInput(), 
    new StaticTextComponent(), 
    new LLM_comp(), 
    new LLM_chat_comp(),
    new ChatControlComponent()
  ];

  var editor = new Rete.NodeEditor("demo@0.1.0", container);
  editor.use(ConnectionPlugin);
  editor.use(ReactRenderPlugin, { createRoot });
  editor.use(HistoryPlugin, { keyboard: true, limit: 50 });
  editor.use(KeyboardPlugin);
  editor.use(Context);

  var engine = new Rete.Engine("demo@0.1.0");

  components.map((c) => {
    editor.register(c);
    engine.register(c);
  });

  add_text_test_blocks(components, editor)

  editor.on(
    "process nodecreated noderemoved connectioncreated connectionremoved",
    async () => {
      console.log("process");
      await engine.abort();
      await engine.process(editor.toJSON());
    }
  );

  editor.on('showcontextmenu', ({e,node}) => {
    return !e.node || !editor.components.get(e.node.name).data.noContextMenu;
  });
  


  editor.view.resize();
  editor.trigger("process");
  AreaPlugin.zoomAt(editor, editor.nodes);

  console.log("editor created:", editor);
  return editor;
}

export function useRete() {
  const [container, setContainer] = useState(null);
  const editorRef = useRef();

  useEffect(() => {
    if (container) {
      createEditor(container).then((value) => {
        console.log("created editor", value);
        editorRef.current = value;
      });
    }
  }, [container]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        console.log("destroy");
        editorRef.current.destroy();
      }
    };
  }, []);
  let editor2 = editorRef.current;

  return [setContainer, editorRef];
}

async function add_number_test_blocks(components, editor){
  var n1 = await components[0].createNode({ num: 2 });
  var n2 = await components[0].createNode({ num: 3 });
  var add = await components[1].createNode({ inp_inp: 2 });

  n1.position = [80, 200];
  n2.position = [80, 400];
  add.position = [500, 240];


  editor.addNode(n1);
  editor.addNode(n2);
  editor.addNode(add);

  //editor.connect(n1.outputs.get("num"), add.inputs.get("dyn_inp0"));
  //editor.connect(n2.outputs.get("num"), add.inputs.get("dyn_inp1"));

}

async function add_text_test_blocks(components, editor){
  console.log("adding text test blocks");
  var disp = await components[4].createNode();
  var disp2 = await components[4].createNode();
  var text_in = await components[2].createNode({ text: "skirt steak" });
  var text_in2 = await components[2].createNode({ text: "chinese" });
  var main_input = await components[3].createNode({ text: "Create a recipe with {ingredient} as the star, inspired by {culture} food" });
  var llm = await components[5].createNode();

  console.log("moving nodes")

  disp.position = [1000, 500];
  disp2.position = [1600, 300];
  text_in.position = [-180, 400];
  text_in2.position = [-180, 600];
  main_input.position = [220, 240];
  llm.position = [1000, 200];

  console.log("adding nodes")
  editor.addNode(disp);
  editor.addNode(disp2);
  editor.addNode(text_in);
  editor.addNode(text_in2);
  editor.addNode(main_input);
  editor.addNode(llm);

  console.log("connecting nodes")
  //editor.connect(text_in.outputs.get("text"), main_input.inputs.get("dyn_inp0"));
  editor.connect(main_input.outputs.get("text"), disp.inputs.get("text"));
  editor.connect(main_input.outputs.get("text"), llm.inputs.get("message"));
  editor.connect(llm.outputs.get("text"), disp2.inputs.get("text"));
}
