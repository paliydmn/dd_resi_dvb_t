import os
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.templating import Jinja2Templates
import re
from datetime import datetime

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")
LOG_DIR = "logs"  # Adjust this path as needed

@router.get("/logs/")
def show_logs_page(request: Request):
    return templates.TemplateResponse("logs.html", {"request": request})

@router.get("/logs/list/")
def list_log_files():
    try:
        files = os.listdir(LOG_DIR)
        log_files = [
            {
                "name": f,
                "last_modified": datetime.fromtimestamp(os.path.getmtime(os.path.join(LOG_DIR, f))).strftime('%Y-%m-%d %H:%M:%S')
            }
            for f in files if os.path.isfile(os.path.join(LOG_DIR, f)) and f.endswith(".log")
        ]
        return log_files
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Log directory not found")

@router.websocket("/ws/logs/{log_file}")
async def websocket_endpoint(websocket: WebSocket, log_file: str):
    # Basic validation to prevent path traversal
    if not re.match(r'^[\w\-. ]+\.log$', log_file):
        await websocket.close(code=1000)
        raise HTTPException(status_code=400, detail="Invalid log file name")

    file_path = os.path.join(LOG_DIR, log_file)

    if not os.path.exists(file_path):
        await websocket.close(code=1000)
        raise HTTPException(status_code=404, detail="Log file not found")

    await websocket.accept()

    # Open the log file and start streaming lines
    with open(file_path, 'r') as file:
        # Move to the end of the file
        file.seek(0, os.SEEK_END)
        
        try:
            while True:
                line = file.readline()
                if line:
                    await websocket.send_text(line)
                else:
                    await asyncio.sleep(1)  # Wait for new lines
        except WebSocketDisconnect:
            print(f"WebSocket disconnected for {log_file}")
