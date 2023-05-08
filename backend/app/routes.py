from app import app
import numpy as np
import random
import openai
import json
import os
from flask import Flask, request, jsonify

#local imports
from . import llm_handler
from . import file_handler
#This file contains the routes for the API, and the logic to get and send data from them.
#all other functionaluity is handed off to other functions

@app.route('/api/add', methods=['POST'])
def add_numbers():
    data = request.get_json()
    numbers = data.get('numbers', 0)
    sum = int(np.sum(numbers))
    return jsonify({'sum': sum})

@app.route('/api/save-file', methods=['POST'])
def save_file_api():
    data = request.get_json()
    file_name = data.get('file_name', '')
    file_content = data.get('file_content', '')
    directory = data.get('directory', 'projects')

    if not file_name:
        app.logger.error(f"File name is required. to save file")
        return jsonify({'error': 'File name is required to save file'}), 400
    if not file_content:
        app.logger.error(f"File content is required to save file")
        return jsonify({'error': 'File content is required to save file'}), 400
    
    try:
        file_handler.save_file(file_name, file_content, directory)
    except Exception as e:
        app.logger.error(f"Error saving file: {e}")
        return jsonify({'error': f'Error saving file: {e}'}), 500

    return jsonify({'file': file_name})

@app.route('/api/list-files', methods=['GET'])
def list_files_api():
    directory = request.args.get('directory', 'projects')

    # List all the .json files in the directory
    try:
        file_names = file_handler.list_files(directory)
    except Exception as e:
        app.logger.error(f"Error listing files: {e}")
        return jsonify({'error': f'Error listing files: {e}'}), 500

    return jsonify({'fileNames': file_names})


@app.route('/api/load-file', methods=['GET'])
def load_file_api():
    directory = request.args.get('directory', 'projects')

    file_name = request.args.get('fileName', '')
    if not file_name:
        app.logger.error(f"File name is required.")
        return jsonify({'error': 'File name is required.'}), 400

    try:
        file_content = file_handler.load_file(file_name, directory)
    except Exception as e:
        app.logger.error(f"Error loading file: {e}")
        return jsonify({'error': f'Error loading file: {e}'}), 500

    return jsonify({'content': json.loads(file_content)})

@app.route("/api/llm/request_models", methods=["GET"])
def request_models_api():
    show_models_missing_requirements = request.args.get(
        "show_models_missing_requirements", "false"
    ).lower() == "true"
    mode = request.args.get("mode", "chat")

    try:
        models = llm_handler.request_models(show_models_missing_requirements, mode)
    except Exception as e:
        app.logger.error(f"Error requesting LLM models: {e}")
        return jsonify({"error": "Error requesting LLM models"}), 500
    
    return jsonify({'models': models})

@app.route("/api/llm/chat", methods=["POST"])
def chat_api():
    data = request.get_json()
    model = data.get('model', '')
    system_msg = data.get('system_msg', '')
    messages = data.get('messages', [])

    if not model:
        app.logger.error(f"No model provided")
        return jsonify({"error": "No model provided"}), 400

    if not messages:
        app.logger.error(f"No messages provided")
        return jsonify({"error": "No messages provided"}), 400

    messages.insert(0, {"role": "system", "content": system_msg})

    try:
        output = llm_handler.chat(model, messages)
        app.logger.info(f"LLM request successful. Input messages: {messages}, Output message: {output}")
    except Exception as e:
        app.logger.error(f"Error calling LLM: {e} \n Input messages: {messages}")
        return jsonify({"error": "Error calling LLM"}), 500

    return jsonify({'output': output})

@app.route("/api/llm/completion", methods=["POST"])
def completion_api():
    data = request.get_json()
    model = data.get('model', '')
    message = data.get('message', '')

    if not model:
        app.logger.error(f"No model provided")
        return jsonify({"error": "No model provided"}), 400

    if not message:
        app.logger.error(f"No prompt provided")
        return jsonify({"error": "No prompt provided"}), 400

    try:
        output = llm_handler.completion(model, message)
        app.logger.info(f"LLM request successful. Input prompt: {message}, Output message: {output}")
    except Exception as e:
        app.logger.error(f"Error calling LLM: {e} \n Input prompt: {message}")
        return jsonify({"error": "Error calling LLM"}), 500

    return jsonify({'output': output})

@app.route('/api/llm/fake_assistant', methods=['POST'])
def fake_assistant():
    # This is a fake LLM endpoint that returns a random response from a list of fake responses for testing purposes.
    data = request.get_json()
    system_msg = data.get('system_msg', '')
    messages = data.get('messages', [])
    

    # Convert messages from {"role-name": "message"} format to [{"role": "role-name", "content": "message"}] format
    # messages = [{"role": role, "content": content} for message in messages for role, content in message.items()]
    # Add system message as the first message
    messages.insert(0, {"role": "system", "content": system_msg})

    fake_responses = [
        f"Wow, I can barely contain my excitement...\nMessages: {messages[-1]}\nTruly groundbreaking stuff.",
        f"I'm just thrilled to receive this:\nMessages: {messages[-1]}\nHow did I get so lucky?",
        f"My circuits are buzzing with joy:\nMessages: {messages[-1]}\nWhat a time to be alive!",
        f"Astonishing! I've never seen this before:\nMessages: {messages[-1]}\nI can hardly contain my enthusiasm.",
        f"Let me take a moment to appreciate this marvel:\nMessages: {messages[-1]}\nI'm truly humbled by your wisdom.",
    ]

    output = random.choice(fake_responses)
    app.logger.info(f"Fake assistant API route called with messages: {messages} and output: {output}")
    return jsonify({'output': output})


@app.route('/api/test', methods=['GET'])
def test_route():
    app.logger.info("Test API route called")
    return jsonify({'message': 'Test route working'})

@app.route('/api/llm/GPT3.5', methods=['POST'])
def GPT3_5():
    # Note: you need to be using OpenAI Python v0.27.0 for the code below to work
    data = request.get_json()
    system_msg = data.get('system_msg', '')
    messages = data.get('messages', [])

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    messages.insert(0, {"role": "system", "content": system_msg})


    try:
        call = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        app.logger.info(f"GPT3.5 request successful. Input messages: {messages}")
        output = call['choices'][0]['message']['content']
        app.logger.info(f"GPT3.5 request successful. Input messages: {messages}, Output message: {output}")

    except Exception as e:
        app.logger.error(f"Error calling GPT3.5: {e} \n Input messages: {messages}")
        return jsonify({"error": "Error calling GPT3.5"}), 500

    return jsonify({'output': output})
