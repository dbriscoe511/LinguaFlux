from app import app
import os

def save_file(file_name, file_content, directory):
    app.logger.info(f"File saveing: {file_name}")

    with open(f"{directory}/{file_name}", "w") as f:
        f.write(file_content)
        app.logger.info(f"File saved: {file_name}")

    return True

def list_files(directory):
    app.logger.info(f"File listing: {directory}")

    # List all the .json files in the directory
    file_names = [f for f in os.listdir(directory) if f.endswith('.json')]

    return file_names

def load_file(file_name, directory):
    app.logger.info(f"File loading: {file_name}")

    try:
        with open(f"{directory}/{file_name}", 'r') as file:
            file_content = file.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"File {directory}/{file_name} not found.")

    return file_content