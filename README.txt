1. **Install Dependencies**
    
    Ensure you have Python installed on your system. You can install the required dependencies using the following command:
    
    
    `pip install -r requirements.txt`
    
2. **Run the Application**
    
    You can start the FastAPI application using Uvicorn. Add the following to `run.sh`:
    
    
    ```
	#!/bin/bash  
	# Set the environment variables (if any) export $(grep -v '^#' .env | xargs)  
	# Start the FastAPI application 
	uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
	```
    
    Make the script executable:
    
    `chmod +x run.sh`
    
    Run the script to start the application:
    
    
    `./run.sh`
    
    Alternatively, you can start the application directly using Uvicorn:
    
    
    `uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload`
    
3. **Access the Web Interface**
    
    Once the application is running, you can access the web interface by navigating to `http://localhost:8008` in your web browser.