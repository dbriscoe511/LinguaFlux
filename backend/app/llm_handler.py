from app import app
import random
from flask import Flask, request, jsonify


# from langchain.chat_models import ChatOpenAI
# from langchain import PromptTemplate, LLMChain
# from langchain.prompts.chat import (
#     ChatPromptTemplate,
#     SystemMessagePromptTemplate,
#     AIMessagePromptTemplate,
#     HumanMessagePromptTemplate,
# )
# from langchain.schema import (
#     AIMessage,
#     HumanMessage,
#     SystemMessage
# )


def request_models():
    app.logger.info("requested models")
    show_models_missing_requirements = request.args.get(
        "show_models_missing_requirements", "false"
    ).lower() == "true"
    models = app.config['AI_models']["LLMs"]

    response = []

    for model_key, model_info in models.items():
        model = model_info.copy()
        model_name = model_key
        model["missing_requirements"] = validate_requirements(model["requirements"])

        #log status of each model
        if not model["missing_requirements"] == []:
            app.logger.info(f"model {model_name} missing requirements {model['missing_requirements']}")
        else:
            app.logger.info(f"model {model_name} has no missing requirements")

        #add model to response if it is not test mode only and is not missing requirements
        #if not model["test_mode_only"] and not app.config['LF_TEST_MODE']:
            if show_models_missing_requirements:
                # add each missing requirement to the model name
                model_name += "err" + ", ".join(model["missing_requirements"])
                response.append(model_name)
            elif model["missing_requirements"] == []:
                response.append(model_name)
        

    return response


def chat(model,messages):
    app.logger.info("chat request")

    #check the provider, and use the corresponding chat object
    provider = app.config['AI_models']["LLMs"][model]["provider"]
    model_name = app.config['AI_models']["LLMs"][model]["provider_model_name"]
    if provider == "OpenAI":
        #chat_obj = ChatOpenAI(model=model_name)
        app.logger.info("chatting with OpenAI {model_name}")
    elif provider == "LF":
        chat_obj = ChatLF(model_name)
        app.logger.info("chatting with LF {model_name}")
    else:
        #error
        app.logger.error(f"provider {provider} not found")
        raise ValueError(f'provider {provider} not found.')
    
    response = chat_obj(messages)
    app.logger.info(f"recived chat response: {response}")

    return response

class ChatLF:
    def __init__(self,model_name):
        self.model_name = model_name
        if self.model_name == "fake_assistant":
            self.fake_responses = [
                "Wow, I can barely contain my excitement...\nMessages: {}\nTruly groundbreaking stuff.",
                "I'm just thrilled to receive this:\nMessages: {}\nHow did I get so lucky?",
                "My circuits are buzzing with joy:\nMessages: {}\nWhat a time to be alive!",
                "Astonishing! I've never seen this before:\nMessages: {}\nI can hardly contain my enthusiasm.",
                "Let me take a moment to appreciate this marvel:\nMessages: {}\nI'm truly humbled by your wisdom.",
            ]
        else:
            raise ValueError(f'LF model {self.model_name} not found.')

    def __call__(self, messages):
        if self.model_name == "fake_assistant":
            return random.choice(self.fake_responses).format(messages[-1])
        else:
            raise ValueError(f'LF model {self.model_name} not found.')

def validate_requirements(model_requirements):
    app.logger.info("validating requirements")
    # Replace this with your actual validation logic
    validations = {
        "has_provider_api_key": True,
        "has_OpenAI_GPT4_access": False,
        "has_gpu_passthrough": False,
        "has_vram": lambda x: x >= 8,
        "none": True, # This is just a placeholder
    }
    failed_requirements = []

    for req in model_requirements:
        if isinstance(req, dict):
            key, value = list(req.items())[0]
            if not validations[key](value):
                failed_requirements.append(req)
        elif not validations[req]:
            failed_requirements.append(req)
    return failed_requirements
