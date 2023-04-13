import Rete from "rete";
import React, { useState } from 'react';
import {Control} from 'rete';

class NumControl extends Rete.Control {
    static component = ({ value, onChange }) => (
      <input
        className="default-text-item"
        type="number"
        value={value}
        ref={(ref) => {
          ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
        onChange={(e) => onChange(+e.target.value)}
      />
    );
  
    constructor(emitter, key, node, readonly = false) {
      super(key);
      this.emitter = emitter;
      this.key = key;
      this.component = NumControl.component;
  
      const initial = node.data[key] || 0;
  
      node.data[key] = initial;
      this.props = {
        readonly,
        value: initial,
        onChange: (v) => {
          this.setValue(v);
          this.emitter.trigger("process");
        }
      };
    }
  
    setValue(val) {
      this.props.value = val;
      this.putData(this.key, val);
      this.update();
    }
  }

class ButtonControl extends Rete.Control {
  static component = ({ label, onClick }) => (
    <div>
      {label && <label>{label}</label>}
      <button
        className="default-text-item"
        onClick={onClick}
        ref={(ref) => {
          ref &&
            ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
      >
        Confirm
      </button>
    </div>
  );

  constructor(emitter, key, node, onClick, label = null) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ButtonControl.component;

    this.props = {
      label,
      onClick: () => {
        onClick(node);
        this.emitter.trigger("process");
      },
    };
  }
}
  
class TextControl extends Rete.Control {
  static component = ({ label, value, onChange, readonly }) => (
    <div>
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
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  constructor(emitter, key, node, readonly = false, label = null, initialValue = "") {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = TextControl.component;

    const initial = node.data[key] || initialValue;

    node.data[key] = initial;
    this.props = {
      readonly,
      label,
      value: initial,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}

class DropdownControl extends Rete.Control {
  static component = ({ label, value, onChange, readonly, options }) => (
    <div>
      {label && <label className="input-title">{label}</label>}
      <select
        className="default-text-item"
        value={value}
        disabled={readonly}
        ref={(ref) => {
          ref &&
            ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  constructor(emitter, key, node, options, readonly = false, label = null, initialValue = "") {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = DropdownControl.component;

    const initial = node.data[key] || initialValue;

    node.data[key] = initial;
    this.props = {
      readonly,
      label,
      value: initial,
      options,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}

  


class ParagraphControl extends Control {
  static component = ({ value, onChange, readOnly, size = { width: "300px", height: "200px" } }) => (
    <textarea
      value={value}
      readOnly={readOnly}
      style={{
        width: size.width,
        height: size.height,
      }}
      className="default-text-item"
      ref={(ref) => {
        ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
      }}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  constructor(emitter, key, node, readonly = false, size = { width: "300px", height: "200px" }) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ParagraphControl.component;

    const initial = node.data[key] || '';
    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
      }
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}

class ChatControl extends Control {
  static component = ({ messages, onSubmit }) => {
    const [userText, setUserText] = useState('');

    const handleMessageSubmit = (e) => {
      e.preventDefault();
      onSubmit(userText);
      setUserText('');
    };

    return (
      <div className="chat-control">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <strong>{message.role}:</strong> {message.content}
            </div>
          ))}
        </div>
        <form className="input-area" onSubmit={handleMessageSubmit}>
          <div className="input-wrapper">
            <textarea
              type="text"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              className="user-input"
            />
            <button type="submit" className="send-button">
              Send
            </button>
          </div>
        </form>
      </div>
    );
  };
  

  constructor(emitter, key, node, onSubmit) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ChatControl.component;

    const initial = node.data[key] || [];
    node.data[key] = initial;
    this.props = {
      messages: initial,
      onSubmit: (message) => {
        // Implement message submission logic here
        // ...
        onSubmit(node, message);
        this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    this.props.messages = val;
    this.putData(this.key, val);
    this.update();
  }

  getValue() {
    return this.props.messages;
  }
}



//Create all of the sockets here. A weird way to do it, but rete does not work if you create sockets in the builder function.
const numSocket = new Rete.Socket("Number value");  
const textSocket = new Rete.Socket("String value");  
const dictSocket = new Rete.Socket("Dictionary value");

export { NumControl, numSocket, TextControl, ParagraphControl, textSocket, DropdownControl, dictSocket, ButtonControl, ChatControl};