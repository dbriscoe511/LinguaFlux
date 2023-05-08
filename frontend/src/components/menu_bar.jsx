import React, { useState, Component } from "react";
import { saveAs } from "file-saver";
import "./Menu.css";
import blankDiagram from './blank-diagram.json';

import { NewProjectModal,SaveAsModal,LoadProjectModal } from "./modal";
import { saveLocal, listFiles, loadLocal } from "./routes";


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
      let data = editor.current.toJSON();
  
      // Add the project description to the editor data
      data.projectDescription = this.state.projectDescription;
  
      const fileName = this.state.projectName || 'diagram';
      const content = JSON.stringify(data, null, 2);
      saveLocal(`${fileName}.json`, content, "projects");
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
    this.handleSave();

    this.setState({ showSaveAsModal: false });
  };

  handleFetchFiles = async () => {
    const files = await listFiles("projects");
    this.setState({ fileList:files });
    this.setState({ showLoadModal: true });
  };
  
  handleLoad = async (fileName) => {
    const data = await loadLocal(fileName, "projects");
    
    // Set the project title based on the file name without the extension
    const projectNameWithoutExtension = fileName.replace(/\.json$/, '');
    this.setState({ projectName: projectNameWithoutExtension || '' });

    // Set the project description from the loaded data
    this.setState({ projectDescription: data.projectDescription || '' });

    await this.props.editor.current.fromJSON(data);
    this.setState({ showLoadModal: false });
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
          fileList={fileList}
          titleText="Load Project"
        />
        <div className="project-name">{projectName || 'Untitled Project'}</div>
      </div>
    );
  }
}




