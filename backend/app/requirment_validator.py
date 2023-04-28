from app import app
import requests
import os
from functools import lru_cache

def validate_requirements(model_requirements,provider):
    app.logger.info("validating requirements")
    validations = {
        "has_provider_api_key": check_provider_api_key(provider),
        "has_OpenAI_GPT4_access": check_OpenAI_GPT4_access(provider),
        "has_gpu_passthrough": False, # code does not exist yet
        "has_vram": False, # code does not exist yet
        "none": True, # no requirments, always true
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

@lru_cache(maxsize=None)
def check_provider_api_key(provider):
    if provider == "OpenAI":
        response = requests.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"})
        app.logger.info(f"OpenAI API response: {response.status_code}")
        if response.status_code == 200:
            return True
    elif provider == "LF":
        return True #built in
    else:
        app.logger.info(f"Provider {provider} not supported")
        return False
    return False

@lru_cache(maxsize=None)
def check_OpenAI_GPT4_access(provider):
    if not provider == "OpenAI":
        app.logger.info(f"Provider: {provider} is not OpenAI, so GPT4 check skipped")
        return False
    #need to confirm this works, no GPT4 for me yet
    response = requests.get("https://api.openai.com/v1/models/gpt-4", headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"})
    app.logger.info(f"OpenAI GPT-4 API response: {response.status_code}")
    if response.status_code == 200:
        return True
    return False
