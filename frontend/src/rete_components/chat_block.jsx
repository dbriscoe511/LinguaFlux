import Rete from "rete";
import { dynamic_output } from './dynamic_io';
import { baseComponent } from './base_nodes';
import {TextControl, textSocket, DropdownControl, dictSocket, ButtonControl,ChatControl} from "./controllers";
import {fetchModelsApi,chatApi} from "../components/routes";


export class ChatControlComponent extends baseComponent {
  constructor() {
    super("Chat Control");
    this.data.noContextMenu = true;
  }

  async builder(node) {
    super.builder(node);
    let default_system_msg = "You are a helpful assistant.";
    
    // Fetch models from the API
    const modelsData = await fetchModelsApi();
    console.log("Available models:", modelsData);


    //add these back in once it is more mature. remeber to change the control to refernce the input, and not the node:
    // ex. node.addControl vs messages.addControl
    var messages = new Rete.Input("messages", "Chat override", dictSocket);
    var userMessage = new Rete.Input("user_message", "message override", textSocket);
    var system_msg = new Rete.Input("system_msg", "System message", textSocket);
    var model = new Rete.Input("model", "Model", textSocket);
    var chat_output = new Rete.Output("chat_output", "Full Chat", dictSocket);
    var last_response = new Rete.Output("last_response", "Last response", textSocket);
    //var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));

    model.addControl(new DropdownControl(this.editor, "model", node, modelsData, false, "Model: "));

    system_msg.addControl(new TextControl(this.editor, "system_msg", node,false, "system_msg: ", default_system_msg));
    node.addControl(new ChatControl(this.editor, "chat-box", node, this.onChatSend.bind(this), this.addBreakPoint.bind(this)));

    node.addControl(new ButtonControl(this.editor, "Send chat overide", node, this.onChatOverrideClick.bind(this)), "Send chat overide");
    node.addControl(new ButtonControl(this.editor, "Send message overide", node, this.onMsgOverideClick.bind(this)),"Send message overide");
    node.addControl(new ButtonControl(this.editor, "Clear chat", node, this.onClearClick.bind(this)), "Clear-chat");

    //add all outputs before adding the dynamic ones
    node.addOutput(chat_output).addOutput(last_response);

    //create the names in the format "breakpoint {index}"
    if (node.data.breakpoints){
      let brake_names = [];
      for (let i = 0; i < node.data.breakpoints.length; i++) {
        brake_names.push("breakpoint " + node.data.breakpoints[i]);
      }
      dynamic_output(node,node.data.breakpoints.length,this.editor,dictSocket,brake_names,false);
    }

    return node
      .addInput(model)
      .addInput(system_msg)
      .addInput(userMessage)
      .addInput(messages);
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

  addBreakPoint(node,index) {
    console.log("Breakpoint added at index:", index);
    //create node.data.breakpoints if it doesn't exist
    if (!node.data.breakpoints) {
      node.data.breakpoints = [];
    }
    //add the breakpoint to the node if it doesn't already exist
    if (!node.data.breakpoints.includes(index)) {
      node.data.breakpoints.push(index);
    }
    //sort the breakpoints
    node.data.breakpoints.sort(function(a, b){return a-b});
    //create the names in the format "breakpoint {index}"
    let brake_names = [];
    for (let i = 0; i < node.data.breakpoints.length; i++) {
      brake_names.push("breakpoint " + node.data.breakpoints[i]);
    }
    //add the breakpoints as an output
    dynamic_output(node,node.data.breakpoints.length,this.editor,dictSocket,brake_names);

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

    //remove all the breakpoints
    node.data.breakpoints = [];
    //remove all the outputs
    dynamic_output(node.id,0,this.editor,dictSocket,[]);
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

    this.setNodeState( node, 'node_waiting_for_backend');
    
    node.data.response = await chatApi(ai_model, system_msg, current_messages);

    //update the chat-output-box control with the new message
    if(ctrl){
        let current_messages = ctrl.getValue();
        //Add the new message to the dictionary
        current_messages.push({ role: "assistant", content: node.data.response });
        //Update the chat-output-box control with the new dictionary
        ctrl.setValue(current_messages);
    }

    this.editor.trigger("process");

    this.setNodeState( node, 'default');
  }

  async worker(node, inputs, outputs) {

    // Update the chat-output-box control with the contents of chat-input-box
    const ctrl = this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("chat-box");

    if (ctrl) {
      outputs["chat_output"] = ctrl.getValue();
      outputs["last_response"] = node.data.response;

      // add data to the breakpoints. the breakpoint gets the chat output up to the index
      if (node.data.breakpoints) {
        for (let i = 0; i < node.data.breakpoints.length; i++) {
          outputs["dyn_out" + i] = ctrl.getValue().slice(0,node.data.breakpoints[i]+1);
        }
      }
    }
    node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
    node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
    node.data.overide_messages = inputs["messages"].length ? inputs["messages"][0] : node.data.overide_messages;
    node.data.overide_message = inputs["user_message"].length ? inputs["user_message"][0] : node.data.overide_message;

    let state = this.getNodeState( node);
    if (state != 'node_waiting_for_backend' && state != 'node_processing_error') {
      this.setNodeState( node, 'node_waiting_for_confirmation');
    }
  }
}

export class LLM_chat_comp extends baseComponent {
  constructor() {
      super("LLM chat completion");
      this.inputChanged = false;
  }
  async builder(node) {
      super.builder(node);
      let default_system_msg = "You are a helpful assistant.";
      // Fetch models from the API
      const modelsData = await fetchModelsApi();
      console.log("Available models:", modelsData); 


      var response = new Rete.Output("text", "Last response", textSocket);
      var model = new Rete.Input("model", "Model", textSocket);
      var system_msg = new Rete.Input("system_msg", "System message", textSocket);
      var chat_output = new Rete.Output("chat_output", "Full Chat", dictSocket);
      var messages = new Rete.Input("messages", "Chat", dictSocket);

      var message = new Rete.Input("message", "Message", textSocket);

      model.addControl(new DropdownControl(this.editor, "model", node, modelsData, false, "model: "));
      system_msg.addControl(new TextControl(this.editor, "system_msg", node, false, "system_msg: ", default_system_msg));

      var confirmButton = new ButtonControl(this.editor, "confirm", node, this.onConfirmButtonClick.bind(this));


      return node
        .addOutput(response)
        .addInput(model)
        .addInput(system_msg)
        .addInput(messages)
        .addInput(message)
        .addOutput(chat_output)
        .addControl(confirmButton);

  }

  async onConfirmButtonClick(node) {
    const ai_model = node.data.model;
    const message = node.data.message;
    const system_msg = node.data.system_msg;
    this.inputChanged = false;


    this.setNodeState( node, 'node_waiting_for_backend');
    //set the current messages to the overide messages, umless the overide messages is empty set it to an empyt array
    let current_messages = node.data.messages ? node.data.messages : [];
    //if message is not empty add it to the current messages
    if (message) {
      let formatted_message = { "role": "user", "content": message}
      current_messages.push(formatted_message);
    } else{
      //error if message is empty
      this.setNodeState( node, 'node_processing_error');
      node.data.response = "Error: message is empty";
      this.editor.trigger("process");
      return;
    }

    node.data.response = await chatApi(ai_model,system_msg, current_messages);

    this.editor.trigger("process");
    let formatted_response = { "role": "assistant", "content": node.data.response}
    current_messages.push(formatted_response)
    node.data.outmessages = current_messages;

    this.setNodeState( node, 'default');
  }

  async worker(node, inputs, outputs) {

    outputs["text"] = node.data.response || "";
    outputs["chat_output"] = node.data.outmessages|| [];

    const oldModel = node.data.model;
    const oldMessage = node.data.message;
    const oldMessages = node.data.messages;
    const oldSystemMsg = node.data.system_msg;


    node.data.model = inputs["model"].length ? inputs["model"][0] : node.data.model;
    node.data.message = inputs["message"].length ? inputs["message"][0] : node.data.message;
    node.data.system_msg = inputs["system_msg"].length ? inputs["system_msg"][0] : node.data.system_msg;
    node.data.messages = inputs["messages"].length ? inputs["messages"][0] : node.data.messages;


    this.inputChanged = 
      oldModel !== node.data.model || 
      oldMessage !== node.data.message || 
      oldSystemMsg !== node.data.system_msg ||
      oldMessages !== node.data.messages;

    let state = this.setNodeState( node);
    if (state != 'node_waiting_for_backend' && state != 'node_processing_error') {
      if (this.inputChanged) {
        this.setNodeState( node, 'node_waiting_for_confirmation');
      }
    }

  }

}
