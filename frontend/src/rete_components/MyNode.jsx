import React from "react";
import { Node, Socket, Control } from "rete-react-render-plugin";

export class MyNode extends Node {
  render() {
    const { node, bindSocket, bindControl} = this.props;
    const { outputs, controls, inputs, selected} = this.state;

      // Helper function to determine the color of a socket based on its type
      const getSocketColor = (socket) => {
        switch (socket.name) {
          case 'String value':
            return 'orange';
          case 'Number value':
            return 'purple';
          default:
            return 'grey';
        }
      };
      

    const getNodeColor = (nodeState) => {
      switch (nodeState) {
        case 'node_processing_error':
          return 'red';
        case 'node_waiting_for_backend':
          return 'yellow';
        case 'node_waiting_for_confirmation':
          return 'blue';
        case 'ghost_node':
          return 'lightgrey';
        default:
          return 'orange';
      }
    };
    return (
      <div className={`node ${selected}`} style={{ background: getNodeColor(node.meta.nodeState) }}>
        <div className="title">
          {"<<"} {node.name} {">>"}
        </div>
        {/* Outputs */}
        {outputs.map((output) => (
          <div className="output" key={output.key}>
            <div className="output-title">{output.name}</div>
            <Socket
              type="output"
              socket={output.socket}
              io={output}
              innerRef={bindSocket}
              color={getSocketColor(output.socket)}
            />
          </div>
        ))}
        {/* Controls */}
        {controls.map((control) => (
          <Control
            className="control"
            key={control.key}
            control={control}
            innerRef={bindControl}
          />
        ))}
        {/* Inputs */}
        {inputs.map((input) => (
          <div className="input" key={input.key}>
            <Socket
              type="input"
              socket={input.socket}
              io={input}
              innerRef={bindSocket}
              color={getSocketColor(input.socket)}
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
    );
  }
}
