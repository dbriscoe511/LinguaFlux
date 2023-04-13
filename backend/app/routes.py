from app import app
import numpy as np
import random
import openai
from flask import Flask, request, jsonify

@app.route('/api/add', methods=['POST'])
def add_numbers():
    data = request.get_json()
    numbers = data.get('numbers', 0)
    sum = int(np.sum(numbers))
    return jsonify({'sum': sum})



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

    # Convert messages from {"role-name": "message"} format to [{"role": "role-name", "content": "message"}] format
    #messages = [{"role": role, "content": content} for message in input_messages for role, content in message.items()]
    # Add system message as the first message
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
