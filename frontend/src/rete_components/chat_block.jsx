import Rete from "rete";
import axios from 'axios';
import { dynamic_input, StringSubstitutor } from './dynamic_io';
import { MyNode } from './MyNode';
import {TextControl, textSocket, ParagraphControl, DropdownControl, dictSocket, ButtonControl,ChatControl} from "./controllers";


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
    var messages = new Rete.Input("messages", "Chat override", dictSocket);
    var userMessage = new Rete.Input("user_message", "message override", textSocket);
    var system_msg = new Rete.Input("system_msg", "System message", textSocket);
    var model = new Rete.Input("model", "Model", textSocket);
    var chat_output = new Rete.Output("chat_output", "Full Chat", dictSocket);
    var last_response = new Rete.Output("last_response", "Last response", textSocket);
    //var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));

    model.addControl(new DropdownControl(this.editor, "model", node, availableAssistants, false, "Model: ", defaultModel));

    system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
    node.addControl(new ChatControl(this.editor, "chat-box", node, this.onChatSend.bind(this)));

    node.addControl(new ButtonControl(this.editor, "Send chat overide", node, this.onChatOverrideClick.bind(this)), "Send chat overide");
    node.addControl(new ButtonControl(this.editor, "Send message overide", node, this.onMsgOverideClick.bind(this)),"Send message overide");
    node.addControl(new ButtonControl(this.editor, "Clear chat", node, this.onClearClick.bind(this)), "Clear-chat");

    return node
      .addInput(model)
      .addInput(system_msg)
      .addInput(userMessage)
      .addInput(messages)
      .addOutput(chat_output)
      .addOutput(last_response);
  }

  onChatOverrideClick(node) {
    const overide_messages = node.data.overide_messages;

    const ctrl = this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("chat-box");

    // Only perform the update if the control exists and the overide_messages is not undefined or empty
    if (ctrl && overide_messages !== undefined ) {
      if (overide_messages.length > 0) {
        ctrl.setValue(overide_messages);
        console.log("Chat overide sent:", overide_messages);
      }
    }
  }
  
  onMsgOverideClick(node) {
    const overide_message = node.data.overide_message;
    console.log("Message overide sent:", overide_message);
    this.ChatSend(node,overide_message);
  }

  onClearClick(node) {
    const ctrl = this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("chat-box");

    if (ctrl) {
        ctrl.setValue([]);
    }
  }


  async onChatSend(node,message) {
    //seperate function to allow multiple ways to send a message
    this.ChatSend(node,message);
  } 

  async ChatSend(node,message) {
    const ai_model = node.data.model;
    const system_msg = node.data.system_msg;

    // Update the chat-output-box control with the contents of chat-input-box
    const ctrl = this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("chat-box");

    if (ctrl) {
        // Get the current array of messages
        var current_messages = ctrl.getValue();
        // Add the new message object to the array
        current_messages.push({ role: "user", content: message });
        // Update the chat-output-box control with the new array
        ctrl.setValue(current_messages);
    }
    this.editor.trigger("process");

    this.setNodeState(node, 'node_waiting_for_backend');
    
    try{
        node.data.response = await this.callAPI(ai_model, system_msg, current_messages);
    } catch  (error) {
        console.error("Error calling Flask backend:", error);
        this.setNodeState(node, 'node_processing_error');
        node.data.response = error.message;
    }

    
    //update the chat-output-box control with the new message
    if(ctrl){
        let current_messages = ctrl.getValue();
        //Add the new message to the dictionary
        current_messages.push({ role: "assistant", content: node.data.response });
        //Update the chat-output-box control with the new dictionary
        ctrl.setValue(current_messages);
    }

    this.editor.trigger("process");

    this.setNodeState(node, 'default');
  }

  async callAPI(aiModel, system_msg, message) {
    let apiUrl = "http://localhost:5000/api/";
    let apiEndpoint = `llm/${aiModel}`;

    let query = { "system_msg": system_msg, "messages": message };
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

    // Update the chat-output-box control with the contents of chat-input-box
    const ctrl = this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("chat-box");

    if (ctrl) {
      outputs["chat_output"] = ctrl.getValue();
      outputs["last_response"] = node.data.response;
    }
    node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
    node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
    node.data.overide_messages = inputs["messages"].length ? inputs["messages"][0] : node.data.overide_messages;
    node.data.overide_message = inputs["user_message"].length ? inputs["user_message"][0] : node.data.overide_message;

    let state = this.getNodeState(node);
    if (state != 'node_waiting_for_backend' && state != 'node_processing_error') {
      this.setNodeState(node, 'node_waiting_for_confirmation');
    }
  }
}