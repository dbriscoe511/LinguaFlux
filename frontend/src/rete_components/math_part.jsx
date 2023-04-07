import Rete from "rete";
import axios from 'axios';
import { NumControl, numSocket } from "./controllers";
import { dynamic_input } from './dynamic_io';

class AddComponent extends Rete.Component {
    constructor() {
        super("Add");
    }

    builder(node) {
        console.log("AddComponent builder called with node:", node);
        var inp0 = new Rete.Input("num0", "Number", numSocket);
        var inp1 = new Rete.Input("num1", "Number2", numSocket);
        var inp_inp = new Rete.Input("inputs", "Inputs", numSocket);
        var out = new Rete.Output("num", "Number", numSocket);

        inp0.addControl(new NumControl(this.editor, "num0", node));
        inp1.addControl(new NumControl(this.editor, "num1", node));
        inp_inp.addControl(new NumControl(this.editor, "inputs", node));

        return node
        .addInput(inp0)
        .addInput(inp1)
        .addInput(inp_inp)
        .addControl(new NumControl(this.editor, "preview", node, true))
        .addOutput(out);
    }

    async worker(node, inputs, outputs) {
        const num_inputs = inputs["inputs"].length ? inputs["inputs"][0] : node.data.inputs;
        const numbers = [];
      
        for (let i = 0; i <= num_inputs; i++) {
            try {
                const inputValue = inputs["dyn_inp" + i].length ? inputs["dyn_inp" + i][0] : node.data["dyn_inp" + i];
                numbers.push(inputValue);
            } catch (error) {
                console.log("input at index", i, "is not defined");
            }
        }
      
        let sum = -1;
      
        try {
          const response = await axios.post("http://localhost:5000/api/add", { numbers });
          console.log("Response from Flask backend:", response);
          sum = response.data.sum;
        } catch (error) {
          console.error("Error calling Flask backend:", error);
        }
      
        this.editor.nodes
          .find((n) => n.id === node.id)
          .controls.get("preview")
          .setValue(sum);
        outputs["num"] = sum;
      
        //const nodeInstance = this.editor.nodes.find((n) => n.id === node.id);
        //dynamic_input(node.id, num_inputs, this.editor, numSocket, NumControl);
        
    }

}

class NumComponent extends Rete.Component {
    constructor() {
        super("Number input");
    }

    builder(node) {
        var out1 = new Rete.Output("num", "Number", numSocket);
        var ctrl = new NumControl(this.editor, "num", node);

        return node.addControl(ctrl).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs["num"] = node.data.num;
    }
}

export { AddComponent, NumComponent };
  