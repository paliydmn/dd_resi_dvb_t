# Define the name of the virtual environment
VENV_NAME = venv

# Define the path to the requirements file
REQUIREMENTS_FILE = requirements.txt

# Define the path to the entry point of your FastAPI app
ENTRY_POINT = app.main:app

# Define the host and port for the FastAPI server
HOST = 0.0.0.0
PORT = 8008

# Determine the OS-specific activation script path
ACTIVATE_CMD = $(shell if [ "$$(uname)" = "Linux" ] || [ "$$(uname)" = "Darwin" ]; then echo ". $(VENV_NAME)/bin/activate"; else echo "$(VENV_NAME)/Scripts/activate"; fi)

# Create and activate the virtual environment, and install requirements
install:
	@echo "Creating virtual environment..."
	python -m venv $(VENV_NAME)
	@echo "Activating virtual environment..."
	@bash -c '$(ACTIVATE_CMD) && pip install --upgrade pip'
	@echo "Installing dependencies..."
	@bash -c '$(ACTIVATE_CMD) && pip install -r $(REQUIREMENTS_FILE)'
	@echo "Virtual environment setup and dependencies installed."

# Run the FastAPI server
run:
	@echo "Starting FastAPI server..."
	@bash -c '$(ACTIVATE_CMD) && uvicorn $(ENTRY_POINT) --host $(HOST) --port $(PORT) --reload'
