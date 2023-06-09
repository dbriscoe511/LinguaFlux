import Rete from "rete";
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import { baseComponent } from './base_nodes';
import {TextControl, textSocket, ParagraphControl, DropdownControl, ButtonControl} from "./controllers";
import {fetchModelsApi,completeApi} from "../components/routes";

class TextComponent extends baseComponent {
    //single line input, not super useful
    constructor() {
      super("Text input");
    }
  
    builder(node) {
      node.data.tooltip = "A basic component to enter a single line of text[More info](https://github.com/dbriscoe511/LinguaFlux/tree/main/frontend/src/rete_components#Single-Line-Text-Input)";  
      super.builder(node);
      // Create an output with the text socket
      var out1 = new Rete.Output("text", "Text", textSocket);
      var ctrl = new TextControl(this.editor, "text", node);
  
      return node.addControl(ctrl).addOutput(out1);
    }
  
    worker(node, inputs, outputs) {
      outputs["text"] = node.data.text;
    }
}
class codeInput extends baseComponent {
    constructor() {
        super("Code");
    }

    builder(node) {
        var out1 = new Rete.Output("text", "Text", textSocket);
        var ctrl = new ParagraphControl(this.editor, "text", node, false);
        return node.addOutput(out1).addControl(ctrl);
    }

    worker(node, inputs, outputs) {
      outputs["text"] = node.data.text;
    }
}

class ParagraphInput extends baseComponent {
    constructor() {
        super("Paragraph input");
    }

    builder(node) {
        node.data.tooltip = "A component to enter and combine text. add a placeholder in curly brakets to create a new input, `{like this}` [More info](https://github.com/dbriscoe511/LinguaFlux/tree/main/frontend/src/rete_components#Paragraph-Input)";
        super.builder(node);

        var out1 = new Rete.Output("text", "Text", textSocket);
        var ctrl = new ParagraphControl(this.editor, "text", node, false);

        node.addControl(ctrl); // this control needs to be added before the dynamic_io_manager is called
        this.dynamic_io_manager(node, false);
        

        return node.addOutput(out1);
    }

    dynamic_io_manager(node, runtime=true) {
      // get items in brackets
      const substitutor = new StringSubstitutor();
      let to_replace = substitutor.extractItemsInBrackets(node.data.text);
      console.log("replace:",to_replace);

      // add dynamic inputs
      let num_inputs = to_replace.length;
      dynamic_input(node, num_inputs, this.editor, textSocket, TextControl, to_replace, runtime);
      return num_inputs;
    }

    worker(node, inputs, outputs) {
        let num_inputs=this.dynamic_io_manager(node);

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
        const substitutor = new StringSubstitutor();
        let replaced = substitutor.substituteItems(node.data.text, input_values);
        outputs["text"] = replaced;
    }
}

class LLM_comp extends baseComponent {
    constructor() {
        super("LLM completion");
        this.inputChanged = false;
    }
    async builder(node) {
        node.data.tooltip = "A component to use the LLM API to complete text. Does not provide a chat output [More info](https://github.com/dbriscoe511/LinguaFlux/tree/main/frontend/src/rete_components#LLM-Completion)";
        super.builder(node);
        // Fetch models from the API
        const modelsData = await fetchModelsApi();
        console.log("Available models:", modelsData);


        var response = new Rete.Output("text", "Last response", textSocket);
        var model = new Rete.Input("model", "Model", textSocket);
        var message = new Rete.Input("message", "Message", textSocket);

        model.addControl(new DropdownControl(this.editor, "model", node, modelsData, false, "model: "));
        message.addControl(new TextControl(this.editor, "message", node,false, "message: "));

        var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));


        return node
          .addOutput(response)
          .addInput(model)
          .addInput(message)
          .addControl(confirmButton);

    }

    async onConfirmButtonClick(node) {
      const ai_model = node.data.model;
      const message = node.data.message;
      this.inputChanged = false;

      this.setNodeState( node, 'node_waiting_for_backend');

      node.data.response = await completeApi(ai_model, message);

      this.editor.trigger("process");

      this.setNodeState( node, 'default');
    }
    
    async worker(node, inputs, outputs) {

      outputs["text"] = node.data.response || "";

      node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
      node.data.message = inputs["message"].length ? inputs["message"][0] : node.data.message;

      this.checkNodeUpdatedState( node, node.data.model+node.data.message);
    }

}



class StaticTextComponent extends baseComponent {
  constructor() {
    super("Text Display");
  }

  builder(node) {
    node.data.tooltip = "A component to display text [More info](https://github.com/dbriscoe511/LinguaFlux/tree/main/frontend/src/rete_components#Text-display)";
    super.builder(node);

    // Add an input to the component
    var input = new Rete.Input("text", "", textSocket);
    node.addInput(input);

    // Use the StaticTextControl
    var ctrl = new ParagraphControl(this.editor, "displayText", node, true, {width: 300, height: 100});
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





export {TextComponent,codeInput,ParagraphInput,StaticTextComponent,LLM_comp};