import React from "react";
import { Node, Socket, Control } from "rete-react-render-plugin";
import "./node_style.css"

export class MyNode extends Node {
  render() {
    const { node, bindSocket, bindControl} = this.props;
    const { outputs, controls, inputs, selected} = this.state;

    const getNodeColor = (nodeState) => {
      switch (nodeState) {
        case 'node_processing_error':
          return 'red';
        case 'node_waiting_for_backend':
          return 'rgb(247, 153, 110)';
        case 'node_waiting_for_confirmation':
          return 'rgb(167, 196, 181)';
        case 'ghost_node':
          return 'rgb(116, 148, 234)';
        default:
          return 'rgb(247, 153, 110)';
      }
    };
    return (
      <div className={`node ${selected}`} >
        <div className="title" style={{ background: getNodeColor(node.meta.nodeState) }}>
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
