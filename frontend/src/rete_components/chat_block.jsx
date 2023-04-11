import Rete from "rete";
import axios from 'axios';
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import { MyNode } from './MyNode';
import {TextControl, textSocket, ParagraphControl, DropdownControl, dictSocket, ButtonControl, ChatControl} from "./controllers";


class ChatInputControl extends ParagraphControl {
    //just changes ClassName and default size
    static component = ({ value, onChange, readOnly, size = { width: "300px", height: "100px" } }) => (
      <textarea
        value={value}
        readOnly={readOnly}
        style={{
          width: size.width,
          height: size.height,
        }}
        className="chat-input-box"
        ref={(ref) => {
          ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  
    constructor(emitter, key, node, readonly = false, size = { width: "300px", height: "100px" }) {
      super(emitter, key, node, readonly, size);
      this.component = ChatInputControl.component;
    }

    setValue(val) {
        this.props.value = val;
        this.putData(this.key, val);
        this.update();
      }

    getValue(){
        return this.props.value;
    }
}

class ChatOutputControl extends ParagraphControl {
    static component = ({ value, readOnly, size = { width: "300px", height: "200px" } }) => (
      <textarea
        value={value}
        readOnly={readOnly}
        style={{
          width: size.width,
          height: size.height,
        }}
        className="chat-output-box"
        ref={(ref) => {
          ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
      />
    );
  
    constructor(emitter, key, node, size = { width: "300px", height: "200px" }) {
      super(emitter, key, node, true, size);
      this.component = ChatOutputControl.component;
    }


    getValue() {
        return this.getData(this.key);
    }
      
    parseDictionaryToText(messagesArray) {
        let text = "";
        for (const messageObj of messagesArray) {
          text += `${messageObj.username}: ${messageObj.message}\n---\n`;
        }
        return text;
    }
      
    setValue(messagesArray) {
        const parsedVal = this.parseDictionaryToText(messagesArray);
        this.props.value = parsedVal;
        this.putData(this.key, messagesArray);
        this.update();
    }
}
  
  

export class ChatControlComponent extends Rete.Component {
    constructor() {
      super("Chat Control");
      this.data.component = MyNode;
    }
  
    builder(node) {
      let default_system_msg = "You are a helpful assistant.";
      let availableAssistants = ["GPT3.5", "fake_assistant"];
      let defaultModel = availableAssistants[1];
  
      //add these back in once it is more mature. remeber to change the control to refernce the input, and not the node:
      // ex. node.addControl vs messages.addControl
      //var messages = new Rete.Input("messages", "Messages", dictSocket);
      //var userMessage = new Rete.Input("user_message", "User message", textSocket);
      var system_msg = new Rete.Input("system_msg", "System message", textSocket);
      var model = new Rete.Input("model", "Model", textSocket);
      var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));
  
      model.addControl(new DropdownControl(this.editor, "model", node, availableAssistants, false, "Model: ", defaultModel));
      node.addControl(new ChatOutputControl(this.editor, "chat-output-box", node));
      node.addControl(new ChatInputControl(this.editor, "chat-input-box", node, false, {width: 200, height: 100}));
  
      system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
  
  
  
      return node
        .addInput(model)
        .addInput(system_msg)
        .addControl(confirmButton);
    }
  
    async onConfirmButtonClick(node) {
        const ai_model = node.data.model;
        const system_msg = node.data.system_msg;
    
        // Update the chat-output-box control with the contents of chat-input-box
        const ctrl_out = this.editor.nodes
        .find((n) => n.id === node.id)
        .controls.get("chat-output-box");

        const ctrl_in = this.editor.nodes
        .find((n) => n.id === node.id)
        .controls.get("chat-input-box");

        if (ctrl_out && ctrl_in) {
            // Get the current array of messages
            let current_messages = ctrl_out.getValue();
            // If current_messages is null, undefined, or empty, set it to an empty array
            if (current_messages == null || current_messages == undefined || current_messages == "") {
              current_messages = [];
            }
            // Add the new message object to the array
            current_messages.push({ username: "User", message: ctrl_in.getValue() });
            var message = ctrl_in.getValue();
            // Update the chat-output-box control with the new array
            ctrl_out.setValue(current_messages);
            // Clear the chat-input-box control
            ctrl_in.setValue("");
        }
        this.editor.trigger("process");

        this.setNodeState(node, 'node_waiting_for_backend');
        console.log("message: ", message)
        try{
            node.data.response = await this.callAPI(ai_model, system_msg, message);
        } catch  (error) {
            console.error("Error calling Flask backend:", error);
            this.setNodeState(node, 'node_processing_error');
            node.data.response = error.message;
        }

        //update the chat-output-box control with the new message
        if(ctrl_out){
            let current_messages = ctrl_out.getValue();
            //Add the new message to the dictionary
            current_messages.push({ username: ai_model, message: node.data.response });
            //Update the chat-output-box control with the new dictionary
            ctrl_out.setValue(current_messages);
        }

        this.editor.trigger("process");
    
        this.setNodeState(node, 'default');
    }
  
    async callAPI(aiModel, system_msg, message) {
      let apiUrl = "http://localhost:5000/api/";
      let apiEndpoint = `llm/${aiModel}`;
  
      let query = { "system_msg": system_msg, "message": message };
      console.log("Query to Flask backend:", query);
      console.log("API endpoint:", (apiUrl + apiEndpoint));
  
      let updatedMessages = {};
      try {
        const response = await axios.post((apiUrl + apiEndpoint), query);
        console.log("Response from Flask backend:", response);
        updatedMessages = response.data.output;
      } catch (error) {
        console.error("Error calling Flask backend:", error);
      }
  
      return updatedMessages;
    }
  
    setNodeState(node, state) {
      let instance = this.editor.nodes.find((n) => n.id === node.id);;
      instance.setMeta({ nodeState: state });
      instance.update();
    }
  
    getNodeState(node) {
      let instance = this.editor.nodes.find((n) => n.id === node.id);;
      return instance.meta.nodeState;
    }
  
    async worker(node, inputs, outputs) {
      node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
      node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
  
      let state = this.getNodeState(node);
      if (state != 'node_waiting_for_backend' && state != 'node_processing_error') {
        this.setNodeState(node, 'node_waiting_for_confirmation');
      }
    }
  }