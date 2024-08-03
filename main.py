# main.py
import os
import sys
import json
import subprocess
import signal
import atexit
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from utils import get_ffprobe_data, construct_programs_dict, construct_ffmpeg_command
from models import AdapterConfig, Program, Stream, AvailableResources, SaveSelection

CONFIG_LOG_FILE = "/var/log/ffmpeg_resi"
CONFIG_FILE_PATH = Path("adapters_config.json")

# Setup Jinja2Templates
templates = Jinja2Templates(directory="templates")

# In-memory storage for adapter configurations / running processes
# ToDo: (better to use database or file)
adapters: Dict[int, AdapterConfig] = {}
running_processes: Dict[int, subprocess.Popen] = {}

# Configure logging
log_path = "app.log"
log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
log_handler = RotatingFileHandler(log_path, maxBytes=5*1024*1024, backupCount=5)
log_handler.setFormatter(log_formatter)
log_handler.setLevel(logging.INFO)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(log_handler)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static/"), name="static")


def save_adapters_to_file():
    """Save the current state of adapters to a JSON file."""
    logger.info("Saving adapters configuration to file.")
    with CONFIG_FILE_PATH.open('w') as file:
        adapters_data = {k: v.dict() for k, v in adapters.items()}
        json.dump(adapters_data, file, indent=4)


def load_adapters_from_file():
    """Load the adapters configuration from a JSON file."""
    if CONFIG_FILE_PATH.exists():
        try:
            with CONFIG_FILE_PATH.open('r') as file:
                adapters_data = json.load(file)
                for adapter_id_str, adapter_data in adapters_data.items():
                    adapter_id = int(adapter_id_str)
                    programs = {int(prog_id): prog_data for prog_id, prog_data in adapter_data.get(
                        "programs", {}).items()}
                    adapters[adapter_id] = AdapterConfig(
                        adapter_number=adapter_data["adapter_number"],
                        modulator_number=adapter_data["modulator_number"],
                        udp_url=adapter_data["udp_url"],
                        programs=programs,
                        running=adapter_data.get("running", False)
                    )
            logger.info("Loaded adapters configuration from file.")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Error loading adapters from file: {e}")


@app.on_event("startup")
def on_startup():
    logger.info("Starting application.")
    load_adapters_from_file()


@app.on_event("shutdown")
def on_shutdown():
    logger.info("Shutting down application.")
    save_adapters_to_file()


@app.get("/adapters/available", response_model=AvailableResources)
def get_available_adapters():
    """Fetch available adapters and modulators from the system."""
    logger.info(f"Loading available adapters from {CONFIG_FILE_PATH} file.")
    try:
        output = subprocess.check_output(
            "find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
        if output:
            lines = output.strip().split('\n')
            adapters = {
                int(line.split('/')[3].replace("adapter", "")) for line in lines}
            modulators = {
                int(line.split('/')[4].replace("mod", "")) for line in lines}
            return {"adapters": sorted(adapters), "modulators": sorted(modulators)}
        return {"adapters": [], "modulators": []}
    except subprocess.CalledProcessError as e:
        logger.error(f"Error fetching available adapters: {e}")
        return {"adapters": [], "modulators": []}


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    logger.info("Get Root Request")
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/adapters/", response_class=HTMLResponse)
async def adapters_page(request: Request):
    logger.info("Get Adapters page")
    return templates.TemplateResponse("adapters.html", {"request": request, "adapters": adapters})

@app.get("/modulator", response_class=HTMLResponse)
async def modulator(request: Request):
    return templates.TemplateResponse("modulator.html", {"request": request})


@app.get("/get_adapters/")
def get_adapters():
    return adapters


@app.post("/adapters/")
def create_adapter(adapterConf: AdapterConfig):
    adapter_id = len(adapters) + 1
    adapters[adapter_id] = adapterConf
    save_adapters_to_file()
    logger.info(f"Adapter created: {adapterConf}")
    return {"id": adapter_id, "message": "Adapter created successfully"}


@app.get("/adapters/{adapter_id}/scan")
def scan_adapter(adapter_id: int):
    if adapter_id not in adapters:
        raise HTTPException(status_code=404, detail="Adapter not found")
    adapter = adapters[adapter_id]
    ffprobe_data = get_ffprobe_data(adapter.udp_url)

    # Check if ffprobe_data is an error message or valid data
    if isinstance(ffprobe_data, str):
        # Use the error message as the detail
        raise HTTPException(status_code=500, detail=ffprobe_data)

    programs = construct_programs_dict(ffprobe_data)
    adapters[adapter_id].programs = programs
    logger.info(f"Scanned adapter {adapter_id}: {len(programs)} programs found.")
    return {"programs": programs}


@app.post("/adapters/{adapter_id}/start")
def start_ffmpeg(adapter_id: int):
    if adapter_id in running_processes:
        logger.warning(f"FFmpeg process is already running for adapter {adapter_id}.")
        raise HTTPException(
            status_code=400, detail="FFmpeg process is already running for this adapter")
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")

    adapter = adapters[adapter_id]
    # Construct the selected programs dictionary based on the 'selected' field
    selected_programs = {
        program_id: program.dict() for program_id, program in adapter.programs.items() if program.selected
    }

    adapter_log_file = f"{CONFIG_LOG_FILE}{adapter_id}.log"
    ffmpeg_cmd = construct_ffmpeg_command(
        adapter.udp_url, selected_programs, adapter.adapter_number, adapter.modulator_number, adapter_log_file)
    logger.info(f"Starting FFmpeg for adapter {adapter_id} with command: {ffmpeg_cmd}")
    process = subprocess.Popen(ffmpeg_cmd, shell=True, preexec_fn=os.setsid)
    running_processes[adapter_id] = process
    # ToDo: check
    if process:
        adapter.running = True
    return {"message": "FFmpeg started"}


@app.post("/adapters/{adapter_id}/stop")
def stop_ffmpeg(adapter_id: int):
    if adapter_id not in running_processes:
        logger.warning(f"FFmpeg process not found for adapter {adapter_id}.")
        raise HTTPException(status_code=404, detail="FFmpeg process not found")

    if not adapters[adapter_id].running:
        logger.info(f"Adapter {adapter_id} is already stopped.")
        return {"message": "Adapter is already stopped"}

    process = running_processes[adapter_id]
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    del running_processes[adapter_id]
    adapters[adapter_id].running = False
    logger.info(f"Stopped FFmpeg for adapter {adapter_id}.")
    return {"message": "FFmpeg stopped"}


@app.delete("/adapters/{adapter_id}/")
def delete_adapter(adapter_id: int):
    if adapter_id in running_processes:
        logger.warning(f"Attempt to delete adapter {adapter_id} while FFmpeg is running.")
        raise HTTPException(status_code=400, detail="Stop FFmpeg process before deleting the adapter")
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")

    del adapters[adapter_id]
    logger.info(f"Deleted adapter {adapter_id}.")
    return {"message": "Adapter deleted"}


@app.post("/adapters/{adapter_id}/save")
def save_selection(adapter_id: int, selection: SaveSelection):
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")

    adapter = adapters[adapter_id]

    # Convert programs to Program instances if they are in dictionary form
    for program_id, program in adapter.programs.items():
        if not isinstance(program, Program):
            adapter.programs[program_id] = Program(**program)
        adapter.programs[program_id].selected = False
        for stream_type, streams in adapter.programs[program_id].streams.items():
            for i, stream in enumerate(streams):
                if not isinstance(stream, Stream):
                    adapter.programs[program_id].streams[stream_type][i] = Stream(
                        **stream)
                adapter.programs[program_id].streams[stream_type][i].selected = False

    # Update the adapter with selected channels and streams
    for program_id, streams in selection.channels.items():
        program_id = int(program_id)
        if program_id in adapter.programs:
            program = adapter.programs[program_id]
            program.selected = True  # Mark this program as selected
            for stream_type, stream_ids in streams.items():
                for stream in program.streams.get(stream_type, []):
                    if stream.id in stream_ids:
                        stream.selected = True

    save_adapters_to_file()
    logger.info(f"Saved selection for adapter {adapter_id}.")
    # Respond with success message
    return {"message": "Selection saved successfully"}


# Function to stop all ffmpeg processes
def stop_ffmpeg_processes():
    """Stop all running ffmpeg processes."""
    try:
        subprocess.run(['killall', 'ffmpeg'], check=True)
        for _, adapter in adapters.items():
            adapter.running = False
        logger.info("All ffmpeg processes have been stopped.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error stopping ffmpeg processes: {e}")


def signal_handler(sig, frame):
    """Handle termination signals."""
    logger.info(f"Received signal {sig}. Stopping all ffmpeg processes.")
    stop_ffmpeg_processes()
    sys.exit(0)


# Register signal handlers and atexit function
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)
atexit.register(stop_ffmpeg_processes)
