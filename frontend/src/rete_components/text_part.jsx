import Rete from "rete";
import axios from 'axios';
import {TextControl, textSocket, ParagraphControl, StaticTextControl} from "./controllers";

class TextComponent extends Rete.Component {
    //single line input, not super useful
    constructor() {
      super("Text input");
    }
  
    builder(node) {  
      // Create an output with the text socket
      const out1 = new Rete.Output("text", "Text", textSocket);
      const ctrl = new TextControl(this.editor, "text", node);
  
      return node.addControl(ctrl).addOutput(out1);
    }
  
    worker(node, inputs, outputs) {
      outputs["text"] = node.data.text;
    }
}

class ParagraphInput extends Rete.Component {
    constructor() {
        super("Paragraph input");
    }

    builder(node) {
        const out1 = new Rete.Output("text", "Text", textSocket);
        const ctrl = new ParagraphControl(this.editor, "text", node);
        return node.addControl(ctrl).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs["text"] = node.data.text;
    }
}

class StaticTextComponent extends Rete.Component {
  constructor() {
    super("Text Display");
  }

  builder(node) {
    // Add an input to the component
    const input = new Rete.Input("text", "", textSocket);
    node.addInput(input);

    // Use the StaticTextControl
    const ctrl = new StaticTextControl(this.editor, "displayText", node);
    node.addControl(ctrl);

    return node;
  }

  worker(node, inputs) {
    // Get the input text
    const inputText = inputs["text"].length ? inputs["text"][0] : "";

    // Update the displayText control with the input text
    const ctrl = this.editor.nodes
      .find((n) => n.id === node.id)
      .controls.get("displayText");

    if (ctrl) {
      ctrl.setValue(inputText);
    }
  }
}


export {TextComponent,ParagraphInput,StaticTextComponent};