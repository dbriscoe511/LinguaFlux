import Rete from "rete";
import axios from 'axios';
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import { MyNode } from './MyNode';
import {TextControl, textSocket, ParagraphControl, DropdownControl, dictSocket, ButtonControl} from "./controllers";

class TextComponent extends Rete.Component {
    //single line input, not super useful
    constructor() {
      super("Text input");
      this.data.component = MyNode
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
        this.data.component = MyNode
    }

    builder(node) {
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

class LLM_comp extends Rete.Component {
    constructor() {
        super("LLM completion");
        this.data.component = MyNode;
        
    }
    async builder(node) {
        // Fetch models from the API
        const modelsData = await this.fetchModels();
        console.log("Available models:", modelsData);
        let defaultModel = modelsData[0];    
        let default_system_msg = "You are a helpful assistant.";


        var response = new Rete.Output("text", "Last response", textSocket);
        var model = new Rete.Input("model", "Model", textSocket);
        var system_msg = new Rete.Input("system_msg", "System message", textSocket);
        var message = new Rete.Input("message", "Message", textSocket);

        model.addControl(new DropdownControl(this.editor, "model", node, modelsData, false, "model: ", defaultModel));
        system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
        message.addControl(new TextControl(this.editor, "message", node,false, "message: "));

        var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));


        return node
          .addOutput(response)
          .addInput(model)
          .addInput(system_msg)
          .addInput(message)
          .addControl(confirmButton);

    }

    fetchModels = async () =>{
      const apiUrl = "http://localhost:5000/api/"; //TODO: make this request compleqation specific models
      const response = await axios.get(apiUrl + "llm/request_models");
      console.log("Response from Flask backend on fetch models:", response);
      const models = response.data.models;
      return models;
    }  

    async onConfirmButtonClick(node) {
      const ai_model = node.data.model;
      const system_msg = node.data.system_msg;
      const message = node.data.message;
  

      this.set_node_state(node, 'node_waiting_for_backend');

      try{
        node.data.response = await this.callAPI(ai_model, system_msg, message);
      } catch  (error) {
        console.error("Error calling Flask backend:", error);
        this.set_node_state(node, 'node_processing_error');
        node.data.response = error.message;
      }
      this.editor.trigger("process");

      this.set_node_state(node, 'default');
    }
    
    async callAPI(ai_model, system_msg, message) {
      let api_url = "http://localhost:5000/api/";
      let api_endpoint = `llm/completion`;
      
      
      let query = { "message": message, "model": ai_model };
      console.log("Query to Flask backend:", query);
      console.log("API endpoint:", (api_url + api_endpoint));
  
      let stringy = "";
      try {
        const response = await axios.post((api_url + api_endpoint), query);
        console.log("Response from Flask backend:", response);
        stringy = response.data.output;
        console.log("Response from Flask backend data:", stringy);
      } catch (error) {
        console.error("Error calling Flask backend:", error);
      }

      
      return stringy;
    }

    set_node_state(node, state) {
      // this is a hack, but I dont know how else to do it
      let instance = this.editor.nodes.find((n) => n.id === node.id);;
      instance.setMeta({nodeState: state});
      instance.update();
    }
    get_node_state(node) {
      // this is a hack, but I dont know how else to do it
      let instance = this.editor.nodes.find((n) => n.id === node.id);;
      return instance.meta.nodeState;
    }

    async worker(node, inputs, outputs) {

      outputs["text"] = node.data.response || "";
      node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
      node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
      node.data.message = inputs["message"].length ? inputs["message"][0] : node.data.message;

      let state = this.get_node_state(node);
      if (state != 'node_waiting_for_backend' && state != 'node_processing_error') {
        this.set_node_state(node, 'node_waiting_for_confirmation');
      }

    }

}



class StaticTextComponent extends Rete.Component {
  constructor() {
    super("Text Display");
    this.data.component = MyNode
  }

  builder(node) {
    // Add an input to the component
    var input = new Rete.Input("text", "", textSocket);
    node.addInput(input);

    // Use the StaticTextControl
    var ctrl = new ParagraphControl(this.editor, "displayText", node, true, {width: 200, height: 100});
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