import Rete from "rete";
import axios from 'axios';
import { NumControl, numSocket } from "./controllers";

class AddComponent extends Rete.Component {
    constructor() {
        super("Add");
    }

    builder(node) {
        console.log("AddComponent builder called with node:", node);
        var inp1 = new Rete.Input("num1", "Number", numSocket);
        var inp2 = new Rete.Input("num2", "Number2", numSocket);
        var out = new Rete.Output("num", "Number", numSocket);

        inp1.addControl(new NumControl(this.editor, "num1", node));
        inp2.addControl(new NumControl(this.editor, "num2", node));

        return node
        .addInput(inp1)
        .addInput(inp2)
        .addControl(new NumControl(this.editor, "preview", node, true))
        .addOutput(out);
    }

    async worker(node, inputs, outputs) {
        var n1 = inputs["num1"].length ? inputs["num1"][0] : node.data.num1;
        var n2 = inputs["num2"].length ? inputs["num2"][0] : node.data.num2;
        var sum = -1;

        try {
            const response = await axios.post('http://localhost:5000/api/add', { num1: n1, num2: n2 });
            console.log('Response from Flask backend:', response);
            sum = response.data.sum;
        } catch (error) {
            console.error('Error calling Flask backend:', error);
        }
        this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("preview")
            .setValue(sum);
        outputs["num"] = sum;
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
  