import Rete from "rete";



export function dynamic_input(nodeId, desired_inputs, editor, socket, ControlConstructor, input_titles = []) {
    /**
     * This function dynamically updates the inputs of a node based on the desired number of inputs.
     * It adds new inputs or removes extra inputs accordingly, and updates the node's appearance in the editor.
     *
     * @param {string|number} nodeId - The ID of the node to update.
     * @param {number} desired_inputs - The desired number of inputs for the node.
     * @param {Rete.Editor} editor - The Rete.js editor instance.
     * @param {Rete.Socket} socket - The socket to use for the new inputs.
     * @param {Function} controlConstructor - The constructor function for the control to be added to the new inputs.
     */

    // Count the existing dynamic inputs
    const nodeInstance = editor.nodes.find((n) => n.id === nodeId);

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

    // Add new dynamic inputs if needed
    for (let i = existingDynamicInputs; i < desired_inputs; i++) {
        let inp = new Rete.Input("dyn_inp" + i, input_titles[i], socket);
        inp.addControl(new ControlConstructor(editor, "dyn_inp" + i, nodeInstance, false, (input_titles[i]+": ") ));
        nodeInstance.addInput(inp);
        console.log("dynamic_io added input", inp);
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

  