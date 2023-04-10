import Rete from "rete";
import axios from 'axios';
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import { MyNode } from './MyNode';
import {TextControl, textSocket, ParagraphControl, StaticTextControl, DropdownControl, ButtonControl} from "./controllers";

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
        this.data.component = MyNode; // optional
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
        this.data.component = MyNode; // optional
        
    }
    builder(node) {
        //todo: move these to a config file       
        let default_system_msg = "You are a helpful assistant.";
        let avalible_assistants = ["GPT3.5","fake_assistant"]
        let default_model = avalible_assistants[1];

        var response = new Rete.Output("text", "Last response", textSocket);
        var model = new Rete.Input("model", "Model", textSocket);
        var system_msg = new Rete.Input("system_msg", "System message", textSocket);
        var message = new Rete.Input("message", "Message", textSocket);

        model.addControl(new DropdownControl(this.editor, "model", node, avalible_assistants, false, "model: ", default_model));
        system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
        message.addControl(new TextControl(this.editor, "message", node,false, "message: "));

        var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));

        // Create a reference to the MyNode instance
        node.data.myNodeInstance = new this.data.component(node);
        console.log("node.myNodeInstance:", node.data.myNodeInstance);


        return node
          .addOutput(response)
          .addInput(model)
          .addInput(system_msg)
          .addInput(message)
          .addControl(confirmButton);

    }
    async onConfirmButtonClick(node) {
      const ai_model = node.data.model;
      const system_msg = node.data.system_msg;
      const message = node.data.message;
  
      // Call the API and update the output
      //node.data.component.setNodeState('node_waiting_for_backend');

      node.state = {nodeState: 'node_waiting_for_backend'}

      try{
        node.data.response = await this.callAPI(ai_model, system_msg, message);
      } catch  (error) {
        console.error("Error calling Flask backend:", error);
        // Set the node state to 'node_processing_error'
        //node.data.component.setNodeState('node_processing_error');
        node.state = {nodeState: 'node_processing_error'}
        // Set the error message
        node.data.response = error.message;
      }
      this.editor.trigger("process");
    }
    
    async callAPI(ai_model, system_msg, message) {
      let api_url = "http://localhost:5000/api/";
      let api_endpoint = `llm/${ai_model}`;
  
      let query = { "system_msg": system_msg, "message": message };
      console.log("Query to Flask backend:", query);
      console.log("API endpoint:", (api_url + api_endpoint));
  
      let stringy = "";
      try {
        const response = await axios.post((api_url + api_endpoint), query);
        console.log("Response from Flask backend:", response);
        stringy = response.data.output;
      } catch (error) {
        console.error("Error calling Flask backend:", error);
      }
      return stringy;
    }
    async worker(node, inputs, outputs) {
      // Just pass the output value through
      //if (!node.myNodeInstance) {
        //node.myNodeInstance = this.editor.nodes.find((n) => n.id === node.id).component;
        
      //}
      console.log("node.myNodeInstance:", this.data.component);

      outputs["text"] = node.data.response || "";
      node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
      node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
      node.data.message = inputs["message"].length ? inputs["message"][0] : node.data.message;

      //when the inputs are updated, the node is waiting for the user to confirm
      //node.data.component.setNodeState('node_waiting_for_confirmation');
      //node.data.myNodeInstance.setNodeState('node_waiting_for_confirmation');
      this.data.component.MyNode.setNodeState('node_waiting_for_confirmation');
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