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
    let apiUrl = "http://localhost:5000/api/";
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
    let api_url = "http://localhost:5000/api/";
    let api_endpoint = `llm/completion`;
      
    let query = { "message": message, "model": ai_model };

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
