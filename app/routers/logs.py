import os
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.templating import Jinja2Templates

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
        log_files = [f for f in files if os.path.isfile(os.path.join(LOG_DIR, f))]
        return log_files
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Log directory not found")

@router.websocket("/ws/logs/{log_file}")
async def websocket_endpoint(websocket: WebSocket, log_file: str):
    await websocket.accept()
    file_path = os.path.join(LOG_DIR, log_file)

    if not os.path.exists(file_path):
        await websocket.close(code=1000)
        raise HTTPException(status_code=404, detail="Log file not found")

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
