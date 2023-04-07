import Rete from "rete";
import axios from 'axios';
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import {TextControl, textSocket, ParagraphControl, StaticTextControl, DropdownControl} from "./controllers";

class TextComponent extends Rete.Component {
    //single line input, not super useful
    constructor() {
      super("Text input");
    }
  
    builder(node) {  
      // Create an output with the text socket
      var out1 = new Rete.Output("text", "Text", textSocket);
      var ctrl = new TextControl(this.editor, "text", node);
  
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
        var out1 = new Rete.Output("text", "Text", textSocket);
        var ctrl = new ParagraphControl(this.editor, "text", node);
        return node.addControl(ctrl).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        // get items in brackets
        const substitutor = new StringSubstitutor();
        let to_replace = substitutor.extractItemsInBrackets(node.data.text);
        console.log("replace:",to_replace);

        // add dynamic inputs
        let num_inputs = to_replace.length;
        dynamic_input(node.id, num_inputs, this.editor, textSocket, TextControl, to_replace);

        // get dynamic input values
        let input_values = [];
        for (let i = 0; i < num_inputs; i++) {
            let input = "";
            try{
                input = inputs["dyn_inp" + i].length ? inputs["dyn_inp" + i][0] : node.data["dyn_inp" + i];
            } catch {
                // when the input is first created, it is undefined and throws an error
                // this may be a bad way to handle it
                input = "";
            }

            if (input.length) {
                input_values.push(input);
            } else {
                input_values.push("");
            }
        }

        // replace items in brackets with dynamic input values
        let replaced = substitutor.substituteItems(node.data.text, input_values);
        outputs["text"] = replaced;
    }
}

class LLM_comp extends Rete.Component {
    constructor() {
        super("LLM completion");
    }
    builder(node) {
        //todo: move these to a config file       
        let default_system_msg = "You are a helpful assistant.";
        let avalible_assistants = ["GPT3.5","fake_assistant"]
        let default_model = avalible_assistants[0];

        var response = new Rete.Output("text", "Last response", textSocket);
        var model = new Rete.Input("model", "Model", textSocket);
        var system_msg = new Rete.Input("system_msg", "System message", textSocket);
        var message = new Rete.Input("message", "Message", textSocket);

        model.addControl(new DropdownControl(this.editor, "model", node, avalible_assistants, false, "model: ", default_model));
        system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
        message.addControl(new TextControl(this.editor, "message", node,false, "message: "));
        

        return node
          .addOutput(response)
          .addInput(model)
          .addInput(system_msg)
          .addInput(message);

    }
    worker(node, inputs, outputs) {
    }
}



class StaticTextComponent extends Rete.Component {
  constructor() {
    super("Text Display");
  }

  builder(node) {
    // Add an input to the component
    var input = new Rete.Input("text", "", textSocket);
    node.addInput(input);

    // Use the StaticTextControl
    var ctrl = new StaticTextControl(this.editor, "displayText", node);
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


export {TextComponent,ParagraphInput,StaticTextComponent,LLM_comp};