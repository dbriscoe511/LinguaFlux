import Rete from "rete";
import React, { useState, useRef } from 'react';
import {Control} from 'rete';
import { HistoryPlugin, Action} from "rete-history-plugin";


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
      <button
        className="default-button"
        onClick={onClick}
        ref={(ref) => {
          ref &&
            ref.addEventListener("pointerdown", (e) => e.stopPropagation());
        }}
      >
        {label}
      </button>
    </div>
  );

  constructor(emitter, key, node, onClick, label) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    label = label || key;
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

  constructor(emitter, key, node, options, readonly = false, label = null) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = DropdownControl.component;

    const initial = node.data[key] || options[0];

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
  static component = ({ value, onChange, readOnly, size, onResize }) => (
    <textarea
      value={value}
      readOnly={readOnly}
      style={{
        width: size.width,
        height: size.height,
      }}
      className="default-text-item"
      ref={(ref) => {
        if (ref) {
          ref.addEventListener("pointerdown", (e) => e.stopPropagation());
          ref.addEventListener("contextmenu", (e) => e.stopPropagation()); // prevent context menu, allow spellchecking

          // Add a resize event listener
          // this stores the size in the component state, so it does not change on a load
          ref.addEventListener("mouseup", (e) => {
            const newSize = {
              width: `${ref.offsetWidth}px`,
              height: `${ref.offsetHeight}px`,
            };
            onResize(newSize);
          });
        }
      }}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  constructor(emitter, key, node, readonly = false, defaultSize = { width: "300px", height: "200px" }) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ParagraphControl.component;
    this.sizeKey = "size";

    const initial = node.data[key] || '';
    node.data[key] = initial;

    // Load size from node data or use the default size
    const size = node.data[this.sizeKey] || defaultSize;
    node.data[this.sizeKey] = size;

    this.props = {
      readonly,
      value: initial,
      size: size,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
      },
      onResize: (newSize) => {
        this.putData(this.sizeKey, newSize);
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
  static component = ({ messages, onSubmit, addBreakPoint, size, onResize }) => {
    const [userText, setUserText] = useState('');
    const [editedMessageIndex, setEditedMessageIndex] = useState(null);
    const [editedMessageValue, setEditedMessageValue] = useState('');


    const handleMessageSubmit = (e) => {
      e.preventDefault();
      onSubmit(userText);
      setUserText('');

      // Adjust the height of the user-input textarea
      setTimeout(() => {
        const userInput = document.querySelector('.user-input');
        if (userInput) {
          adjustHeight(userInput);
        }
      }, 10);
    };

    const handleEditButtonClick = (index) => {
      //console.log("Edit button clicked for user message at index:", index);
      setEditedMessageIndex(index);
      setEditedMessageValue(messages[index].content);

      //wait for the edit input to appear, then adjust its height
      setTimeout(() => {
        const editInput = document.querySelector('.edit-input');
        if (editInput) {
          adjustHeight(editInput);
        }
      }, 10);
    };
    
    const handleIndexButtonClick = (index) => {
      //console.log("Index button clicked for assistant message at index:", index);
      addBreakPoint(index);
    };

    const handleEditSubmit = () => {
      //this button pops up when the user clicks the edit button
      const updatedMessages = messages;
      //updatedMessages[editedMessageIndex].content = editedMessageValue;
      console.log("editedMessageValue: ", editedMessageValue);

      //remove any messages after the edited message
      messages = updatedMessages.splice(editedMessageIndex);

      //add the edited message
      onSubmit(editedMessageValue);
      setEditedMessageIndex(null);
      setEditedMessageValue('');
    };
    
    const handleEditCancel = () => {
      //this button pops up when the user clicks the edit button
      setEditedMessageIndex(null);
      setEditedMessageValue('');
    };

    const adjustHeight = (textarea) => {
      //css cannot do this automatically, so we have to do it manually
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };
    
    

    return (
      <div 
        className={`chat-control`}
        ref={(ref) => {
          if (ref) {
            ref.addEventListener("pointerdown", (e) => e.stopPropagation());
            ref.addEventListener("contextmenu", (e) => e.stopPropagation()); // prevent context menu, allow spellchecking

            // Add a resize event listener
            // this stores the size in the component state, so it does not change on a load
            ref.addEventListener("mouseup", (e) => {
              const newSize = {
                width: `${ref.offsetWidth}px`,
                height: `${ref.offsetHeight}px`,
              };
              onResize(newSize);
            });
          }
        }}
        style={{
          width: size.width,
          height: size.height,
        }}
      >
        <div className="messages-wrapper">
          <div className="messages">
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <div className="message">
                  {editedMessageIndex === index ? (
                    <div className="edit-area">
                      <textarea
                        type="text"
                        value={editedMessageValue}
                        onChange={(e) => setEditedMessageValue(e.target.value)}
                        onInput={(e) => adjustHeight(e.target)}
                        className="edit-input"
                      />
                      <button className="default-button" onClick={handleEditSubmit}>
                        Submit
                      </button>
                      <button className="default-button" onClick={handleEditCancel}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <strong>{message.role}:</strong> {message.content}
                    </div>
                  )}
                  {message.role === "user" ? (
                    <button
                      className="edit-button"
                      onClick={() => handleEditButtonClick(index)}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      className="index-button"
                      onClick={() => handleIndexButtonClick(index)}
                    >
                      {index}
                    </button>
                  )}
                </div>
                {index < messages.length - 1 && <hr className="message-divider" />}
              </React.Fragment>
          ))}

          </div>
        </div>
        <form className="input-area" onSubmit={handleMessageSubmit}>
          <div className="input-wrapper">
            <textarea
              type="text"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              onInput={(e) => adjustHeight(e.target)}
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

  constructor(emitter, key, node, onSubmit, addBreakPoint) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ChatControl.component;
    this.sizeKey = "size";

    const defaultSize = {
      width: "600px",
      height: "400px",
    };

    // Load size from node data or use the default size
    const size = node.data[this.sizeKey] || defaultSize;
    node.data[this.sizeKey] = size;

    const initial = node.data[key] || [];
    node.data[key] = initial;
    this.props = {
      messages: initial,
      size: size,
      onSubmit: (message) => {
        onSubmit(node, message);
        this.emitter.trigger("process");
      },
      addBreakPoint: (index) => {
        addBreakPoint(node, index);
        this.emitter.trigger("process");
      },
      onResize: (newSize) => {
        this.putData(this.sizeKey, newSize);
        console.log("Resized to", newSize);
      }
      
    };
  }

  setValue(val) {
    this.emitter.trigger('addhistory', new FieldChangeAction(this.props.messages, val, (v) => this.set(v)));
    this.props.messages = val;
    this.putData(this.key, val);
    this.update();
  }

  set(val) {
    //internal method for redo/undo
    this.props.messages = val;
    this.putData(this.key, val);
    this.update();
  }

  getValue() {
    return this.props.messages;
  }
}


class FieldChangeAction extends Action {
  constructor(prev, next, set) {
      super();
      this.prev = prev;
      this.next = next;
      this.set = set;
  }
  undo = () =>{
      this.set(this.prev);
  }
  redo = () =>{
      this.set(this.next);
  }
}


//Create all of the sockets here. A weird way to do it, but rete does not work if you create sockets in the builder function.
const numSocket = new Rete.Socket("Number value");  
const textSocket = new Rete.Socket("String value");  
const dictSocket = new Rete.Socket("Dictionary value");

export { NumControl, numSocket, TextControl, ParagraphControl, textSocket, DropdownControl, dictSocket, ButtonControl, ChatControl};