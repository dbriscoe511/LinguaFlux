import React, { useEffect, useRef } from 'react';
import Rete from 'rete';
import ConnectionPlugin from 'rete-connection-plugin';
import ReactRenderPlugin from 'rete-react-render-plugin';

class AddComponent extends Rete.Component {
  constructor() {
    super('Add');
  }

  builder(node) {
    const input1 = new Rete.Input('input1', 'Input 1', Rete.numSocket);
    const input2 = new Rete.Input('input2', 'Input 2', Rete.numSocket);
    const result = new Rete.Output('result', 'Result', Rete.numSocket);

    node.addInput(input1).addInput(input2).addOutput(result);
  }

  worker(node, inputs) {
    const input1 = inputs.input1.length ? inputs.input1[0] : 0;
    const input2 = inputs.input2.length ? inputs.input2[0] : 0;

    return { result: input1 + input2 };
  }
}

const ReteEditor = () => {
  const reteRef = useRef();

  useEffect(() => {
    async function initRete() {
      const container = reteRef.current;
      const editor = new Rete.NodeEditor('demo@0.1.0', container);

      editor.use(ConnectionPlugin);
      editor.use(ReactRenderPlugin);

      const addComponent = new AddComponent();

      editor.register(addComponent);

      editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await editor.trigger('process');
      });

      const engine = new Rete.Engine('demo@0.1.0');

      engine.register(addComponent);

      editor.view.resize();
      editor.trigger('process');
    }

    initRete();
  }, []);

  return <div ref={reteRef} style={{ width: '100%', height: '100%' }} />;
};

export default ReteEditor;
