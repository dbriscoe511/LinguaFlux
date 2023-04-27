from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import logging
import yaml
from logging.handlers import RotatingFileHandler



app = Flask(__name__)
CORS(app)

load_dotenv()

#set test mode (for development)
app.config['LF_TEST_MODE'] = os.getenv("TEST_MODE", "false").lower() == "true"

# Set up logging
handler = RotatingFileHandler("logs/app.log", maxBytes=100000, backupCount=3)
log_format = logging.Formatter(
    "%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)s - %(funcName)s()] - %(message)s"
)

handler.setFormatter(log_format)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)


# Set your secret API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# list contents of current directory
app.logger.info(f"current directory: {os.listdir()}")

# Load AI models
with open("AI_models.yaml", "r") as file:
    app.config['AI_models'] = yaml.safe_load(file)
    #log the names of each model
    for key, value in app.config['AI_models'].items():
        if isinstance(value, dict):
            #print(f"key: {key}, value: {value}")
            item_names = ', '.join(value.keys())
            app.logger.info(f"Loaded {key}: [{item_names}]")


app.logger.info("App started")
if __name__ == "__main__":
    app.logger.info(f"Starting app in test mode: {app.config['LF_TEST_MODE']}")
    app.run(host="0.0.0.0", debug=True)
