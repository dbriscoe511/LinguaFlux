import React from "react";
import { Node, Socket, Control } from "rete-react-render-plugin";
import Rete from "rete";
import "./node_style.css"

export class MyNode extends Node {
  render() {
    const { node, bindSocket, bindControl} = this.props;
    const { outputs, controls, inputs, selected} = this.state;

    const getNodeClass = (nodeState) => {
      switch (nodeState) {
        case 'node_processing_error':
          return 'node-processing-error';
        case 'node_waiting_for_backend':
          return 'node-waiting-for-backend';
        case 'node_waiting_for_confirmation':
          return 'node-waiting-for-confirmation';
        case 'ghost_node':
          return 'ghost-node';
        default:
          return 'default-node';
      }
    };
    
    return (
      <div className={`node ${selected}`} >
        <div className={`title ${getNodeClass(node.meta.nodeState)}`}>
          {node.name}
        </div>
        <div className="node-content" style={{ display: "flex" }}> {/* Add this container div */}
         {/* Inputs */}
         <div className="inputs">
            {inputs.map((input) => (
              <div className="input" key={input.key}>
                <Socket
                  type="input"
                  socket={input.socket}
                  io={input}
                  innerRef={bindSocket}
                />
                {!input.showControl() && (
                  <div className="input-title">{input.name}</div>
                )}
                {input.showControl() && (
                  <Control
                    className="input-control"
                    control={input.control}
                    innerRef={bindControl}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="controls">
            {controls.map((control) => (
              <Control
                className="control"
                key={control.key}
                control={control}
                innerRef={bindControl}
              />
            ))}
          </div>

          {/* Outputs */}
          <div className="outputs">
            {outputs.map((output) => (
              <div className="output" key={output.key}>
                <div className="output-title">{output.name}</div>
                <Socket
                  type="output"
                  socket={output.socket}
                  io={output}
                  innerRef={bindSocket}
                />
              </div>
            ))}
          </div>
        </div> {/* Close the container div */}
      </div>
    );
    
  }
}

export class baseComponent extends Rete.Component {
  constructor(name) {
      super(name);
      this.data.component = MyNode
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
}
