from app import app
from flask import Flask, request, jsonify

@app.route('/api/add', methods=['POST'])
def add_numbers():
    data = request.get_json()
    num1 = data.get('num1', 0)
    num2 = data.get('num2', 0)
    sum = num1 + num2
    return jsonify({'sum': sum})