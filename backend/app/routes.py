from app import app
import numpy as np
import random
import openai
import json
import os
from flask import Flask, request, jsonify

#local imports
from . import llm_handler
#This file contains the routes for the API, and the logic to get and send data from them.
#all other functionaluity is handed off to other functions

@app.route('/api/add', methods=['POST'])
def add_numbers():
    data = request.get_json()
    numbers = data.get('numbers', 0)
    sum = int(np.sum(numbers))
    return jsonify({'sum': sum})

@app.route('/api/save-file', methods=['POST'])
def save_file():
    data = request.get_json()
    file_name = data.get('fileName', '')
    file_content = data.get('content', '')

    app.logger.info(f"File saveing: {file_name}")

    with open(f"projects/{file_name}", "w") as f:
        f.write(file_content)
        app.logger.info(f"File saved: {file_name}")

    return jsonify({'file': file_name})

@app.route('/api/list-files', methods=['GET'])
def list_files():
    directory = 'projects' 

    # List all the .json files in the directory
    file_names = [f for f in os.listdir(directory) if f.endswith('.json')]
    app.logger.info(f"grabbed current project list: {file_names}")

    return jsonify({'fileNames': file_names})


@app.route('/api/load-file', methods=['GET'])
def load_file():
    directory = 'projects'

    file_name = request.args.get('fileName', '')
    app.logger.info(f"File loading: {file_name}")
    if not file_name:
        app.logger.error(f"File name is required.")
        return jsonify({'error': 'File name is required.'}), 400

    try:
        with open(f"{directory}/{file_name}", 'r') as file:
            file_content = file.read()
    except FileNotFoundError:
        app.logger.error(f"File {directory}/{file_name} not found.")
        return jsonify({'error': f'File {directory}/{file_name} not found.'}), 404

    return jsonify({'content': json.loads(file_content)})

@app.route("/api/llm/request_models", methods=["GET"])
def request_models_api():
    return jsonify({'models': llm_handler.request_models()})

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
