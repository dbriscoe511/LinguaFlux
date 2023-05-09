import React from "react";
import { Node, Socket, Control } from "rete-react-render-plugin";
import { ButtonControl } from "./controllers";
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
    
    const titleBarControls = ['rename','delete','tooltip']; 
    const controlsInTitleBar = controls.filter(control => titleBarControls.includes(control.key));
    const otherControls = controls.filter(control => !titleBarControls.includes(control.key));


    return (
      <div className={`node ${selected}`} >
        <div className={`title ${getNodeClass(node.meta.nodeState)}`}>
        <span className="node-name">{node.data.editname}</span>
          {controlsInTitleBar.map(control => (
            <Control
              className={`titlebar-control ${selected}`}
              key={control.key}
              control={control}
              innerRef={bindControl}
            />
          ))}
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
            {otherControls.map((control) => (
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
      const node_name = name || "base";
      super(node_name);
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

  toggleTooltip(node) {
    node.data.showTooltip = !node.data.showTooltip;
    node.controls.get('tooltipContent').setVisible(node.data.showTooltip);
    console.log("tooltip",node.controls.get('tooltipContent'))
    node.update();
  }

  builder(node) {
    //set the editable name
    //just changeing the name confuses the rete engine
    //node.data.tooltip = "This is a tooltip";
    if (node.data.editname === undefined) {
      node.data.editname = node.name;
    }
    if (node.data.showTooltip === undefined) {
      node.data.showTooltip = false;
    }
    // Add the title bar controls
    const renameControl = new RenameControl(this.editor,"rename",node,false,"Rename",node.data.editname);
    node.addControl(renameControl);

    const tooltipControl = new TitlebarButton(this.editor,"tooltip",node,() => {this.toggleTooltip(node);},"?",);
    node.addControl(tooltipControl);

    const tooltipContentControl = new TooltipContentControl(this.editor,"tooltipContent",node,node.data.tooltip);
    node.addControl(tooltipContentControl);

    const deleteControl = new TitlebarButton(this.editor, "delete", node,() => {this.editor.removeNode(node);},"X");
    node.addControl(deleteControl);
  }
  worker(node, inputs, outputs) {} // rete requires this to exist
}

class TitlebarButton extends ButtonControl {
  constructor(emitter, key, node, readonly = false, label = null) {
    super(emitter, key, node, readonly, label);
  }
}

class TooltipContentControl extends Rete.Control {
  static component = ({ visible, value }) => {

    // make the text area auto resize to fit the content
    const textareaRef = React.useRef(null);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    };

    React.useEffect(() => {
      if (visible) {
        adjustHeight();
      }
    }, [visible, value]);

    return (
      visible ? (
        <textarea
          ref={textareaRef}
          className="tooltip-content"
          value={value}
          readOnly={true}
        />
      ) : null
    );
  };

  constructor(emitter, key, node, initialValue = "") {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = TooltipContentControl.component;
    this.node = node;
 
    const initial = node.data[key] || initialValue;

    node.data[key] = initial;
    this.props = {
      visible: node.data.showTooltip,
      value: initial,
    };
  }

  setVisible(visible) {
    this.props.visible = visible;
    this.update();
  }
}

class RenameControl extends Rete.Control {
  static component = ({ label, value, onChange, onRename, onCancel, readonly, editing }) => (
    <div>
      {editing ? (
        <>
          {label && <label className="input-title">{label}</label>}
          <input
            className="default-text-item"
            type="text"
            value={value}
            readOnly={readonly}
            ref={(ref) => {
              ref &&
                ref.addEventListener("pointerdown", (e) => e.stopPropagation());
            }}
            onChange={(e) => onChange("value", e.target.value)}
          />
          <button
            onClick={() => onRename()}
            className="default-button"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="default-button"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => onChange("editing", true)}
          className="default-button"
        >
          E
        </button>
      )}
    </div>
  );

  constructor(emitter, key, node, readonly = false, label = null, initialValue = "") {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = RenameControl.component;

    const initial = node.data[key] || initialValue;

    node.data[key] = initial;
    this.props = {
      readonly,
      label,
      value: initial,
      editing: false,
      onChange: (k, v) => {
        if (k === "editing") {
          this.setEditing(v);
        } else {
          this.setValue(v);
        }
        this.emitter.trigger("process");
      },
      onRename: () => {
        node.data.editname = this.props.value;
        node.update();
        this.setEditing(false);
      },
      onCancel: () => {
        this.setEditing(false);
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }

  setEditing(val) {
    this.props.editing = val;
    this.update();
  }
}

