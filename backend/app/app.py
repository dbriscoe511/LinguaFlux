from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import logging
from logging.handlers import RotatingFileHandler



app = Flask(__name__)
CORS(app)

load_dotenv()

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

app.logger.info("App started")
if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
