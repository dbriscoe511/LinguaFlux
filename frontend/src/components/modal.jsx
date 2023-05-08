import React, { Component } from "react";

class BaseModal extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        title: props.initialValues?.title || "",
        description: props.initialValues?.description || "",
      };
    }
  
    componentDidUpdate(prevProps) {
      if (prevProps.initialValues !== this.props.initialValues) {
        this.setState({
          title: this.props.initialValues?.title || "",
          description: this.props.initialValues?.description || "",
        });
      }
    }
    
    handleSubmit = () => {
      this.props.onSubmit({ title: this.state.title, description: this.state.description });
      this.props.onClose();
    };
  
    handleChange = (event) => {
      this.setState({ [event.target.name]: event.target.value });
    };
  
    renderForm() {
      const { titleText } = this.props;
      const { title, description } = this.state;
  
      return (
        <>
          <div className="modal-data">
            <h2>{titleText}</h2>
            <label htmlFor="title">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={title}
              onChange={this.handleChange}
              className="default-text-item"
            />
            <label htmlFor="description">Description</label>
            <textarea
              name="description"
              id="description"
              value={description}
              onChange={this.handleChange}
              className="default-text-item"
              style={{ height: "100px" }}
            />
          </div>
          <button onClick={this.handleSubmit} className="default-button">Create</button>
          <button onClick={this.props.onClose} className="default-button">Cancel</button>
        </>
      );
    }
  }
  
export class LoadProjectModal extends Component {
    handleSubmit = (fileName) => {
        this.props.onSubmit(fileName);
        this.props.onClose();
    };

    renderFileList() {
        const { fileList } = this.props;

        return (
        <ul className="load-box">
            {fileList.map((fileName, index) => (
            <li key={index} onClick={() => this.handleSubmit(fileName)} className="load-items">
                {fileName}
            </li>
            ))}
        </ul>
        );
    }

    render() {
        const { isOpen, onClose, titleText } = this.props;

        if (!isOpen) {
            return null;
        }

        return (
        <div className={`modal ${isOpen ? "is-active" : ""}`}>
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-content">
            <div className="modal-container">
                <h2>{titleText}</h2>
                <div>
                {this.renderFileList()}
                </div>
                <button onClick={onClose} className="default-button">
                Cancel
                </button>
            </div>
            </div>
        </div>
        );
    }
}
  
  
export class NewProjectModal extends BaseModal {
    constructor(props) {
      super(props);
    }
  
    render() {
      const { isOpen, onClose } = this.props;
  
      if (!isOpen) {
        return null;
      }
  
      return (
        <div className="modal">
          <div className="modal-content">
            {this.renderForm()}
          </div>
        </div>
      );
    }
}
  
export class SaveAsModal extends BaseModal {
    constructor(props) {
      super(props);
    }
  
    render() {
      const { isOpen, onClose } = this.props;
  
      if (!isOpen) {
        return null;
      }
  
      return (
        <div className="modal">
          <div className="modal-content">
            {this.renderForm()}
          </div>
        </div>
      );
    }
}