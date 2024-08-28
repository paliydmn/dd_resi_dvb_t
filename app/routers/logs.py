import os
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.templating import Jinja2Templates
from settings import settings
from app.utils import logger

import re
from datetime import datetime

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")
LOG_DIR = settings.log_directory


@router.get("/logs/")
def show_logs_page(request: Request):
    logger.info("Get Logs page")
    return templates.TemplateResponse("logs.html", {"request": request})


@router.get("/logs/list/")
def list_log_files():
    logger.info("Get list of log files")
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
        logger.error(f"Log directory not found")
        raise HTTPException(status_code=404, detail="Log directory not found")


@router.get("/logs/last_lines/{log_file}")
def get_last_lines(log_file: str, lines: int = 10):
    logger.info(f"Get last {lines} lines from log file: {log_file}")
    file_path = os.path.join(LOG_DIR, log_file)
    if not os.path.exists(file_path):
        logger.error(f"Log file: {log_file} not found")
        raise HTTPException(status_code=404, detail="Log file not found")

    with open(file_path, 'rb') as file:
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        block_size = 1024
        data = []
        while len(data) < lines and file_size > 0:
            file_size = max(0, file_size - block_size)
            file.seek(file_size)
            data = (file.read(block_size) + b'\n'.join(data)).splitlines()

    # Decode each line and join them with newline characters
    return '\n'.join(line.decode('utf-8') for line in data[-lines:])


@router.websocket("/ws/logs/{log_file}")
async def websocket_endpoint(websocket: WebSocket, log_file: str):
    logger.info(f"Open websocket_endpoint for log file: {log_file}")
    # Basic validation to prevent path traversal
    if not re.match(r'^[\w\-. ]+\.log$', log_file):
        await websocket.close(code=1000)
        logger.error(f"Invalid log file name: {log_file}")
        raise HTTPException(status_code=400, detail="Invalid log file name")

    file_path = os.path.join(LOG_DIR, log_file)

    if not os.path.exists(file_path):
        await websocket.close(code=1000)
        logger.error(f"Log file: {log_file} not found")
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
            logger.info(f"WebSocket disconnected for {log_file}")
