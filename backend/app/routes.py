from app import app
import numpy as np
from flask import Flask, request, jsonify

@app.route('/api/add', methods=['POST'])
def add_numbers():
    data = request.get_json()
    numbers = data.get('numbers', 0)
    sum = int(np.sum(numbers))
    return jsonify({'sum': sum})