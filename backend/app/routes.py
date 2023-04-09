from app import app
import numpy as np
import random
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
    message = data.get('message', '')

    fake_responses = [
        f"Wow, I can barely contain my excitement...\nSystem message: \"{system_msg}\"\nMessage: \"{message}\"\nTruly groundbreaking stuff.",
        f"I'm just thrilled to receive this:\nSystem message: \"{system_msg}\"\nMessage: \"{message}\"\nHow did I get so lucky?",
        f"My circuits are buzzing with joy:\nSystem message: \"{system_msg}\"\nMessage: \"{message}\"\nWhat a time to be alive!",
        f"Astonishing! I've never seen this before:\nSystem message: \"{system_msg}\"\nMessage: \"{message}\"\nI can hardly contain my enthusiasm.",
        f"Let me take a moment to appreciate this marvel:\nSystem message: \"{system_msg}\"\nMessage: \"{message}\"\nI'm truly humbled by your wisdom.",
    ]

    output = random.choice(fake_responses)
    return jsonify({'output': output})

@app.route('/api/test', methods=['GET'])
def test_route():
    return jsonify({'message': 'Test route working'})

@app.route('/api/llm/GPT3.5', methods=['POST'])
def GPT3_5():
    return jsonify({'output': 'This is a fake response from GPT3.5.'})