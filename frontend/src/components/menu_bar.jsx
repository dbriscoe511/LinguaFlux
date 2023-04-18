import React, { useState, Component } from "react";
import { saveAs } from "file-saver";
import "./MenuBar.css";
import blankDiagram from './blank-diagram.json';
import axios from 'axios';


export class MenuBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showFileMenu: false,
      showOptionsMenu: false,
      showNewProjectModal: false,
      showSaveAsModal: false,
      showLoadModal: false,
      projectName: '',
      projectDescription: '',
      fileList: []
    };
  }

  handleDownload = () => {
    const { editor } = this.props;
    if (editor) {
      const data = editor.current.toJSON();

      // Add the project description to the editor data
      data.projectDescription = this.state.projectDescription;

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json;charset=utf-8",
      });

      const fileName = this.state.projectName || 'diagram';
      saveAs(blob, `${fileName}.json`);
    }
  };

  handleSave = async () => {
    const { editor } = this.props;
    if (editor) {
      const data = editor.current.toJSON();
  
      // Add the project description to the editor data
      data.projectDescription = this.state.projectDescription;
  
      const fileName = this.state.projectName || 'diagram';
  
      // Prepare the object to be sent to the backend
      const fileData = {
        fileName: `${fileName}.json`,
        content: JSON.stringify(data, null, 2),
      };
  
      const apiUrl = "http://localhost:5000/api/";
      const apiEndpoint = "save-file";
  
      try {
        const response = await axios.post(apiUrl + apiEndpoint, fileData);
        console.log("Response from backend:", response);
        // Handle the response as needed, e.g., show a success message
      } catch (error) {
        console.error("Error calling backend:", error);
        // Handle the error as needed, e.g., show an error message
      }
    }
  };

  handleSupport = () => {
    const supportUrl = "https://ko-fi.com/linguaflux";
    window.open(supportUrl, "_blank");
  };

  handleSaveAsSubmit = async (projectData) => {
    console.log('Save As project data:', projectData);
  
    // Update the project name and description state
    await new Promise((resolve) =>
      this.setState(
        {
          projectName: projectData.title,
          projectDescription: projectData.description,
        },
        () => {
          console.log('Save As project name:', this.state.projectName);
          resolve();
        }
      )
    );

    // Save the project
    this.handleSave();

    // Close the Save As modal
    this.setState({ showSaveAsModal: false });
  };

  handleFetchFiles = async () => {
    // Replace the URL and endpoint with your own backend details
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "/list-files";
  
    try {
      const response = await axios.get(apiUrl + apiEndpoint);
      console.log("Response from backend for file list:", response);
  
      const fileList = response.data.fileNames;
  
      this.setState({ fileList:fileList });
    } catch (error) {
      console.error("Error calling backend:", error);
    }
    this.setState({ showLoadModal: true });
  };
  
  handleLoad = async (fileName) => {
    // Replace the URL and endpoint with your own backend details
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "load-file";
  
    try {
      const response = await axios.get(apiUrl + apiEndpoint, { params: { fileName: fileName } });
      console.log("Response from backend:", response);
  
      const data = response.data.content;
  
      
      // Set the project title based on the file name without the extension
      const projectNameWithoutExtension = fileName.replace(/\.json$/, '');
      // Set the project description from the loaded data
      this.setState({ projectName: projectNameWithoutExtension ,projectDescription: data.projectDescription || '' });
  
      await this.props.editor.current.fromJSON(data);
    } catch (error) {
      console.error("Error calling backend:", error);
    }
  };  

  handleLoad_from_pc = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = JSON.parse(event.target.result);

      // Set the project title based on the file name without the extension
      const projectNameWithoutExtension = file.name.replace(/\.json$/, '');
      this.setState({ projectName: projectNameWithoutExtension || '' });

      // Set the project description from the loaded data
      this.setState({ projectDescription: data.projectDescription || '' });

      await this.props.editor.current.fromJSON(data);
    };

    reader.readAsText(file);
  };

  handleNewProject = () => {
    this.setState({ showNewProjectModal: true });
  };

  handleNewProjectSubmit = async (projectData) => {
    //console.log('New project data:', projectData);

    // Update the project name and description state
    this.setState({
      projectName: projectData.title,
      projectDescription: projectData.description
    });

    // Clear the editor
    if (this.props.editor && this.props.editor.current) {
      await this.props.editor.current.fromJSON(blankDiagram);
    }
  };

  render() {
    const {
      showFileMenu,
      showOptionsMenu,
      showNewProjectModal,
      showSaveAsModal,
      showLoadModal,
      projectName,
      projectDescription,
      fileList
    } = this.state;

    return (
      <div className="menu-container">
          <div
            className="menu-bar"
            onMouseEnter={() => this.setState({ showFileMenu: true })}
            onMouseLeave={() => this.setState({ showFileMenu: false })}
          >
            <span>File</span>
            {showFileMenu && (
              <ul className="menu">
                <li onClick={this.handleNewProject}>New Project</li>
                <li onClick={this.handleSave}>Save</li>
                <li onClick={() => this.setState({ showSaveAsModal: true })}>Save As</li>
                <li onClick={this.handleFetchFiles}>Load</li>
                <li className="separator" />
                <li onClick={this.handleDownload}>Download Project</li>
                <li onClick={() => document.getElementById("file-input").click()}>Load from PC</li>
              </ul>
            )}
          </div>
          <div
            className="menu-bar"
            onMouseEnter={() => this.setState({ showOptionsMenu: true })}
            onMouseLeave={() => this.setState({ showOptionsMenu: false })}
          >
            <span>Options</span>
            {showOptionsMenu && (
              <ul className="menu">
                <li>Preferences</li>
                <li className="separator" />
                <li onClick={this.handleSupport}>Support this project</li>
              </ul>
            )}
          
          
          <input
            type="file"
            id="file-input"
            style={{ display: "none" }}
            onChange={this.handleLoad_from_pc}
          />
        </div>
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => this.setState({ showNewProjectModal: false })}
          onSubmit={this.handleNewProjectSubmit}
          initialValues={{ title: '', description: '' }}
          titleText="Create New Project"
        />
        <SaveAsModal
          isOpen={showSaveAsModal}
          onClose={() => this.setState({ showSaveAsModal: false })}
          onSubmit={this.handleSaveAsSubmit}
          initialValues={{ title: projectName, description: projectDescription }}
          titleText="Save As"
        />
        <LoadProjectModal
          isOpen={showLoadModal}
          onClose={() => this.setState({ showLoadModal: false })}
          onSubmit={this.handleLoad}
          fileList={this.state.fileList}
          titleText="Load Project"
        />
        <div className="project-name">{projectName || 'Untitled Project'}</div>
      </div>
    );
  }
}




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

class LoadProjectModal extends Component {
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


class NewProjectModal extends BaseModal {
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

class SaveAsModal extends BaseModal {
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