import axios from 'axios';

export async function fetchModelsApi(){
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "llm/request_models";

    let models = [];
    try {
        const response = await axios.get(apiUrl + apiEndpoint);
        console.log("Response from fetchModels:", response);
        models = response.data.models;
    }
    catch (error){
        console.log("Error in fetchModels API:", error);
        return false;
    }
    return models;
}  

export async function chatApi(aiModel,system_msg,messages){
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = `llm/chat`;

    const query = { "system_msg": system_msg, "messages": messages, "model": aiModel };

    let updatedMessages = {};
    try {
      const response = await axios.post((apiUrl + apiEndpoint), query);
      console.log("Response from chat API:", response);
      updatedMessages = response.data.output;
    } catch (error) {
      console.error("Error in chat API:", error);
      return false;
    }

    return updatedMessages;
  }

export async function completeApi(ai_model, message) {
    const api_url = "http://localhost:5000/api/";
    const api_endpoint = `llm/completion`;
      
    const query = { "message": message, "model": ai_model };

    let response_message = "";
    try {
      const response = await axios.post((api_url + api_endpoint), query);
      console.log("Response from complete API:", response);
      response_message = response.data.output;
    } catch (error) {
      console.error("Error calling complete API:", error);
      return false;
    }

    return response_message;
}

export async function saveLocal(file_name, file_content,directory) {
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "save-file";

    const query = { "file_name": file_name, "file_content": file_content, "directory": directory };

    try {
      const response = await axios.post((apiUrl + apiEndpoint), query);
      console.log("Response from local save API:", response);
    } catch (error) {
      console.error("Error calling local save API:", error);
      return false;
    }
    return true;
}

export async function listFiles(directory) {
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "/list-files";

    const query = { params: { directory: directory } };

    let fileList = [];
    try {
      const response = await axios.get((apiUrl + apiEndpoint), query);
      console.log("Response from file list API:", response);
      fileList = response.data.fileNames;
    } catch (error) {
      console.error("Error calling lo:", error);
      return false;
    }
    return fileList;
}

export async function loadLocal(file_name,directory) {
    // Replace the URL and endpoint with your own backend details
    const apiUrl = "http://localhost:5000/api/";
    const apiEndpoint = "load-file";

    const query = { params: { fileName: file_name, directory:directory } };
  
    let data = {};
    try {
      const response = await axios.get((apiUrl + apiEndpoint), query);
      console.log("Response from load API:", response);
      data = response.data.content;
    } catch (error) {
      console.error("Error calling load local API:", error);
      return false;
    }
    return data;

}