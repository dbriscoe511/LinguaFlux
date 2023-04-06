from flask import request, jsonify
from backend.app import app

@app.route("/api/my_function", methods=["POST"])
def my_function():
    # Process the request and call your Python function
    # Return a JSON response
    return jsonify({"result": "success"})
