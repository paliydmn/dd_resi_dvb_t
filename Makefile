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
	@echo "Checking for Python..."
	@if ! command -v python3 &> /dev/null; then \
		echo "Python is not installed. Installing Python..."; \
		if [ "$$(uname)" = "Linux" ]; then \
			sudo apt-get update && sudo apt-get install -y python3 python3-venv; \
		elif [ "$$(uname)" = "Darwin" ]; then \
			brew install python3; \
		else \
			echo "Please install Python manually."; \
			exit 1; \
		fi \
	else \
		echo "Python is installed."; \
	fi

	@echo "Checking for FFmpeg..."
	@if ! command -v ffmpeg &> /dev/null; then \
		echo "FFmpeg is not installed. Installing FFmpeg..."; \
		if [ "$$(uname)" = "Linux" ]; then \
			sudo apt-get update && sudo apt-get install -y ffmpeg; \
		elif [ "$$(uname)" = "Darwin" ]; then \
			brew install ffmpeg; \
		else \
			echo "Please install FFmpeg manually."; \
			exit 1; \
		fi \
	else \
		echo "FFmpeg is installed."; \
	fi

	@echo "Creating virtual environment..."
	python3 -m venv $(VENV_NAME)

	@echo "Activating virtual environment..."
	@bash -c '$(ACTIVATE_CMD) && pip install --upgrade pip'

	@echo "Installing dependencies..."
	@bash -c '$(ACTIVATE_CMD) && pip install -r $(REQUIREMENTS_FILE)'

	@echo "make 'modconfig' executable..."
	@chmod +x  ./tools/modconfig
	@echo "Virtual environment setup and dependencies installed."
	
# Run the FastAPI server
run:
	@echo "Starting FastAPI server..."
	@bash -c '$(ACTIVATE_CMD) && uvicorn $(ENTRY_POINT) --host $(HOST) --port $(PORT) --reload'
