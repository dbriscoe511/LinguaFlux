from app import app
import random
from flask import Flask, request, jsonify
from . import requirment_validator as rv


from langchain.chat_models import ChatOpenAI
from langchain import PromptTemplate, LLMChain
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage
)


def request_models(show_models_missing_requirements, mode):
    app.logger.info(f"requested models with mode {mode} and show_models_missing_requirements {show_models_missing_requirements}")
    models = app.config['AI_models']["LLMs"]

    response = []

    # Filter models with the specified mode
    filtered_models = {}
    for model_key, model_info in models.items():
        if mode in model_info['modes']:
            filtered_models[model_key] = model_info
        else:
            app.logger.info(f"model {model_key} does not have mode {mode}")

    # Sort models by the popularity of the specified mode
    sorted_models = sorted(filtered_models.items(), key=lambda x: x[1]['modes'][mode], reverse=True)


    for model_key, model_info in sorted_models:
        model = model_info.copy()
        model_name = model_key
        model["missing_requirements"] = rv.validate_requirements(model["requirements"], model["provider"])

        #log status of each model
        if not model["missing_requirements"] == []:
            app.logger.info(f"model {model_name} missing requirements {model['missing_requirements']}")
        else:
            app.logger.info(f"model {model_name} has no missing requirements")

        #add model to response if it is not test mode only and is not missing requirements
        if model["test_mode_only"] and app.config['LF_TEST_MODE'] or  not model["test_mode_only"]:
            if show_models_missing_requirements:
                # add each missing requirement to the model name
                model_name += "err" + ", ".join(model["missing_requirements"])
                response.append(model_name)
            elif model["missing_requirements"] == []:
                response.append(model_name)
        

    return response


def chat(model,input_messages):
    app.logger.info("chat request")

    #check the provider, and use the corresponding chat object
    provider = app.config['AI_models']["LLMs"][model]["provider"]
    model_name = app.config['AI_models']["LLMs"][model]["provider_model_name"]

    #put the message into the format requested by langchain
    messages = []
    for message in input_messages:
        if message['role'] == 'system':
            messages.append(SystemMessage(content=message['content']))
        elif message['role'] == 'user':
            messages.append(HumanMessage(content=message['content']))
        elif message['role'] == 'assistant':
            messages.append(AIMessage(content=message['content']))
        else:
            raise ValueError(f'role {message["role"]} not found.')

    #set the chat object based on the provider
    #this could maybe be optimized with a dictionary
    if provider == "OpenAI":
        chat_obj = ChatOpenAI(model=model_name)
        app.logger.info(f"chatting with OpenAI {model_name}")
    elif provider == "LF":
        chat_obj = ChatLF(model_name)
        app.logger.info(f"chatting with LF {model_name}")
    else:
        raise ValueError(f'provider {provider} not found.')
    
    response = chat_obj(messages)
    response.dict() #convert to dict to make it json serializable
    app.logger.info(f"recived chat response: {response}")

    return response.content

class ChatLF:
    def __init__(self,model_name):
        self.model_name = model_name
        if self.model_name == "fake_assistant":
            self.fake_responses = [
                "Wow, I can barely contain my excitement...\nMessage: {}\nTruly groundbreaking stuff.",
                "I'm just thrilled to receive this:\nMessage: {}\nHow did I get so lucky?",
                "My circuits are buzzing with joy:\nMessage: {}\nWhat a time to be alive!",
                "Astonishing! I've never seen this before:\nMessage: {}\nI can hardly contain my enthusiasm.",
                "Let me take a moment to appreciate this marvel:\nMessage: {}\nI'm truly humbled by your wisdom.",
            ]
        else:
            raise ValueError(f'LF model {self.model_name} not found.')

    def __call__(self, messages):
        if self.model_name == "fake_assistant":
            message = messages[-1]
            message.dict()
            return AIMessage(content= random.choice(self.fake_responses).format(message.content))
        else:
            raise ValueError(f'LF model {self.model_name} not found.')


