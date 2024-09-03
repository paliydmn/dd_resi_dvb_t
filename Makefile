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
	@echo "Creating systemd service for ResiCast..."
	@bash -c 'cat > /etc/systemd/system/resicast.service << EOL \
[Unit] \
Description=ResiCast FastAPI Service \
After=network.target \
\
[Service] \
User=$$(whoami) \
WorkingDirectory=$$(pwd) \
ExecStart=$$(pwd)/$(VENV_NAME)/bin/uvicorn $(ENTRY_POINT) --host $(HOST) --port $${p:-$(PORT)} \
Restart=always \
RestartSec=3 \
Environment="PATH=$$(pwd)/$(VENV_NAME)/bin" \
\
[Install] \
WantedBy=multi-user.target \
EOL'

	@echo "Reloading systemd daemon..."
	@systemctl daemon-reload

	@echo "Enabling and starting ResiCast service..."
	@systemctl enable resicast.service
	@systemctl start resicast.service

	@echo "ResiCast service initialized successfully."
