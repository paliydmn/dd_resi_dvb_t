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

# Run the FastAPI server in development mode
run_dev:
	@echo "Starting FastAPI server in development mode..."
	@bash -c '$(ACTIVATE_CMD) && uvicorn $(ENTRY_POINT) --host $(HOST) --port $${p:-$(PORT)} --reload'

# Initialize and create a systemd service for ResiCast
init:
	@echo "Initializing ResiCast as a systemd service..."
	@echo "[Unit]" | sudo tee /etc/systemd/system/resicast.service > /dev/null
	@echo "Description=ResiCast FastAPI Service" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "[Service]" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "User=$$(whoami)" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "WorkingDirectory=$$(pwd)" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "ExecStart=$$(pwd)/$(VENV_NAME)/bin/uvicorn $(ENTRY_POINT) --host $(HOST) --port $${p:-$(PORT)}" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "Restart=always" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "RestartSec=3" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "Environment=PATH=$$(pwd)/$(VENV_NAME)/bin" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "[Install]" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null
	@echo "WantedBy=multi-user.target" | sudo tee -a /etc/systemd/system/resicast.service > /dev/null

	@echo "Reloading systemd daemon..."
	@sudo systemctl daemon-reload

	@echo "Enabling and starting ResiCast service..."
	@sudo systemctl enable --now resicast.service

	@echo "ResiCast service initialized and started on port $${p:-$(PORT)}."
