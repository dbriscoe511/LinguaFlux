import Rete from "rete";


export function dynamic_output(node, desired_outputs, editor, socket, output_titles = [], runtime = true) {
  /**
   * This function dynamically updates the outputs of a node based on the desired number of outputs.
   * It adds new outputs or removes extra outputs accordingly, and updates the node's appearance in the editor.
   *
   * @param {string|number} nodeId - The ID of the node to update.
   * @param {number} desired_outputs - The desired number of outputs for the node.
   * @param {Rete.Editor} editor - The Rete.js editor instance.
   * @param {Rete.Socket} socket - The socket to use for the new outputs.
   * @param {Array} output_titles - An array of output titles. Default is an empty array.
   * @param {boolean} runtime - Whether this function is being called at runtime. Default is true.
   */

  //if this is running when the editor is running, we need to find the node instance
  //if it is running in the buldier, inputs need to be added to the node object
  if (runtime) {
    var nodeInstance = editor.nodes.find((n) => n.id === node.id);
  }else {
    var nodeInstance = node;
  }

  // Count the existing dynamic outputs
  let existingDynamicOutputs = 0;
  nodeInstance.outputs.forEach((output, key) => {
      if (key.startsWith("dyn_out")) {
        existingDynamicOutputs += 1;
      }
  });

  // Create output titles if needed
  if (output_titles.length < desired_outputs) {
      for (let i = output_titles.length; i < desired_outputs; i++) {
          output_titles.push("Output " + i);
      }
  }

  // Add new dynamic outputs if needed
  for (let i = 0; i < desired_outputs; i++) {
    let outputKey = "dyn_out" + i;
    if (i < existingDynamicOutputs) {
      // Rename existing output
      let existingOutput = nodeInstance.outputs.get(outputKey);
      existingOutput.name = output_titles[i];
      
    } else {
        const out = new Rete.Output("dyn_out" + i, output_titles[i], socket);
        nodeInstance.addOutput(out);
    }
  }

  // Remove extra dynamic outputs if needed
  for (let i = existingDynamicOutputs; i > desired_outputs; i--) {
      const outputToRemove = nodeInstance.outputs.get("dyn_out" + (i - 1));
      console.log("output to remove", outputToRemove);

      // Manually remove connections before removing the output
      outputToRemove.connections.forEach((connection) => {
          // Remove connection from the output side
          outputToRemove.removeConnection(connection);
          
          // Remove connection from the input side
          const inputNode = connection.input.node;
          const inputKey = connection.input.key;
          inputNode.inputs.get(inputKey).removeConnection(connection);

          // Force a re-render
          editor.trigger('process');
      });

      nodeInstance.removeOutput(outputToRemove);
  }

  // Update the node's appearance in the editor, and force a re-render
  nodeInstance.update();
}

export function dynamic_input(node, desired_inputs, editor, socket, ControlConstructor, input_titles = [], runtime = true) {
    /**
     * This function dynamically updates the inputs of a node based on the desired number of inputs.
     * It adds new inputs or removes extra inputs accordingly, and updates the node's appearance in the editor.
     *
     * @param {string|number} nodeId - The ID of the node to update.
     * @param {number} desired_inputs - The desired number of inputs for the node.
     * @param {Rete.Editor} editor - The Rete.js editor instance.
     * @param {Rete.Socket} socket - The socket to use for the new inputs.
     * @param {Function} controlConstructor - The constructor function for the control to be added to the new inputs.
     * @param {Array} input_titles - An array of input titles. Default is an empty array. will create input titles in the format Input 1, Input 2, etc. if undefined
     */

    //if this is running when the editor is running, we need to find the node instance
    //if it is running in the buldier, inputs need to be added to the node object
    if (runtime) {
      var nodeInstance = editor.nodes.find((n) => n.id === node.id);
    }else {
      var nodeInstance = node;
    }

    // Count the existing dynamic inputs
    let existingDynamicInputs = 0;
    nodeInstance.inputs.forEach((input, key) => {
        if (key.startsWith("dyn_inp")) {
          existingDynamicInputs += 1;
        }
    });

    //create input titles if needed
    if (input_titles.length < desired_inputs) {
        for (let i = input_titles.length; i < desired_inputs; i++) {
            input_titles.push("Input " + i);
        }
    }

    // Add new dynamic inputs if needed, or rename existing inputs
    for (let i = 0; i < desired_inputs; i++) {
      let inputKey = "dyn_inp" + i;
      if (i < existingDynamicInputs) {
          // Rename existing input
          let existingInput = nodeInstance.inputs.get(inputKey);
          existingInput.name = input_titles[i];
      } else {
          // Add new input
          let inp = new Rete.Input(inputKey, input_titles[i], socket);
          
          //add control to input
          //right now this looks kind of ugly, and does not seem useful. could add back in later
          //inp.addControl(new ControlConstructor(editor, "dyn_inp" + i, nodeInstance, false, (input_titles[i]+": ") ));
          
          nodeInstance.addInput(inp);
          console.log("dynamic_io added input", inp);
      }
    }


    // Remove extra dynamic inputs if needed
    for (let i = existingDynamicInputs; i > desired_inputs; i--) {
        let inputToRemove = nodeInstance.inputs.get("dyn_inp" + (i - 1));
        console.log("input to remove", inputToRemove);

        // Manually remove connections before removing the input.
        // removeInput is supposed to handle this but doesnt handle the output side, causing crashes
        inputToRemove.connections.forEach((connection) => {
            // Remove connection from the input side
            inputToRemove.removeConnection(connection);
            
            // Remove connection from the output side
            const outputNode = connection.output.node;
            const outputKey = connection.output.key;
            outputNode.outputs.get(outputKey).removeConnection(connection);

            // force a re-render
            editor.trigger('process');
        });

        nodeInstance.removeInput(inputToRemove);
    }

    // Update the node's appearance in the editor, and force a re-render
    nodeInstance.update();
}

export class StringSubstitutor {
    extractItemsInBrackets(str) {
      const regex = /{(.*?)}/g;
      let matches = [];
      let match;
  
      while ((match = regex.exec(str)) !== null) {
        matches.push(match[1]);
      }
  
      return matches;
    }
  
    substituteItems(str, substitutionArray) {
      const itemsInBrackets = this.extractItemsInBrackets(str);
      let result = str;
  
      itemsInBrackets.forEach((item, index) => {
        if (substitutionArray[index] !== undefined) {
          const regex = new RegExp(`{${item}}`, 'g');
          result = result.replace(regex, substitutionArray[index]);
        }
      });
  
      return result;
    }
  }

  