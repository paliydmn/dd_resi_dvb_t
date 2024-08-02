# main.py
from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from utils import get_ffprobe_data, construct_programs_dict, construct_ffmpeg_command
from typing import Dict, List
import subprocess
import os
import sys
import atexit
import signal
import json
from pathlib import Path

from models import AdapterConfig, Program, Stream, AvailableResources, SaveSelection

CONFIG_LOG_FILE = "/var/log/ffmpeg_resi"
CONFIG_FILE_PATH = Path("adapters_config.json")

# Setup Jinja2Templates
templates = Jinja2Templates(directory="templates")

# In-memory storage for adapter configurations (in a real application, use a database)
adapters: Dict[int, AdapterConfig] = {}

def save_adapters_to_file():
    """Save the current state of adapters to a JSON file."""
    with open(CONFIG_FILE_PATH, 'w') as file:
        adapters_data = {k: v.dict() for k, v in adapters.items()}
        json.dump(adapters_data, file, indent=4)

def load_adapters_from_file():
    # Load the JSON data from the file
    try:
        if CONFIG_FILE_PATH.exists():
            with open(CONFIG_FILE_PATH, 'r') as file:
                adapters_data = json.load(file)
                print("Loaded adapters data from JSON:",adapters_data)  # Debug print
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading adapters from file: {e}")

    # Convert the loaded JSON data into a dictionary of AdapterConfig objects
    for adapter_id_str, adapter_data in adapters_data.items():
        try:
            adapter_id = int(adapter_id_str)  # Convert the adapter ID to an integer
            
            # Directly use the JSON data for programs and streams as dictionaries
            programs = {}
            for program_id_str, program_data in adapter_data.get("programs", {}).items():
                program_id = int(program_id_str)
                programs[program_id] = program_data
            
            # Create AdapterConfig object
            adapter_config = AdapterConfig(
                adapter_number=adapter_data["adapter_number"],
                modulator_number=adapter_data["modulator_number"],
                udp_url=adapter_data["udp_url"],
                programs=programs,
                running=adapter_data.get("running", False)
            )
            adapters[adapter_id] = adapter_config
            print("Loaded adapters:\n\n", adapters[adapter_id])  # Debug print

        except Exception as e:
            print(f"Error parsing adapter data for adapter ID {adapter_id}: {e}")

###
#    selected_programs: Optional[Dict[int, Dict[str, List[str]]]] = None  # Store selected programs and streams


app = FastAPI()

@app.get("/adapters/available", response_model=AvailableResources)
def get_available_adapters():
    print("Get available adapters") #
    try:
        # Run find command to list all modulators
        output = subprocess.check_output("find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
        if output:
            lines = output.strip().split('\n')
            adapters = set()
            modulators = set()

            for line in lines:
                parts = line.split('/')
                if len(parts) >= 5:
                    adapter = int(parts[3].replace("adapter", ""))
                    modulator = int(parts[4].replace("mod", ""))

                    adapters.add(adapter)
                    modulators.add(modulator)

            return {"adapters": sorted(adapters), "modulators": sorted(modulators)}
        else:
            return {"adapters": [], "modulators": []}
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        return {"adapters": [], "modulators": []}


# Todo:
@app.on_event("startup")
def on_startup():
    load_adapters_from_file()

@app.on_event("shutdown")
def on_shutdown():
    save_adapters_to_file()

app.mount("/static", StaticFiles(directory="static/"), name="static")
# In-memory storage for running processes
running_processes: Dict[int, subprocess.Popen] = {}


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/adapters/", response_class=HTMLResponse)
async def adapters_page(request: Request):
    print(f"Adapters: {adapters}")
    return templates.TemplateResponse("adapters.html", {"request": request, "adapters": adapters})


@app.get("/get_adapters/")
def get_adapters():
    print(f"GET Adapters: \n\n{adapters}")
    return adapters


@app.post("/adapters/")
def create_adapter(adapterConf: AdapterConfig):
    print("CREATE ADAPTER =================================\n")
    print(f"AdapterConfig: \n{adapterConf}")
    adapter_id = len(adapters) + 1
    adapters[adapter_id] = adapterConf
    save_adapters_to_file()
    
    print(f"CREATED NEW ADAPTER: {adapters[adapter_id]}")
    return {"id": adapter_id, "message": "Adapter created successfully"}


@app.get("/adapters/{adapter_id}/scan")
def scan_adapter(adapter_id: int):
    print("SCAN =================================\n")
    if adapter_id not in adapters:
        raise HTTPException(status_code=404, detail="Adapter not found")
    adapter = adapters[adapter_id]
    print(f"SCAN Adapter: \n\n {adapter}")
    ffprobe_data = get_ffprobe_data(adapter.udp_url)

    # Check if ffprobe_data is an error message or valid data
    if isinstance(ffprobe_data, str):
        # Use the error message as the detail
        raise HTTPException(status_code=500, detail=ffprobe_data)

    programs = construct_programs_dict(ffprobe_data)
    adapters[adapter_id].programs = programs
    return {"programs": programs}


@app.post("/adapters/{adapter_id}/start")
def start_ffmpeg(adapter_id: int):
    print("START =================================\n")
    if adapter_id in running_processes:
        raise HTTPException(
            status_code=400, detail="FFmpeg process is already running for this adapter")
    if adapter_id not in adapters:
        raise HTTPException(status_code=404, detail="Adapter not found")

    adapter = adapters[adapter_id]
    print(f"adapter: \n\n{adapter}\n\n")

    # Construct the selected programs dictionary based on the 'selected' field
    selected_programs = {
        program_id: program.dict() for program_id, program in adapter.programs.items() if program.selected
    }

    # Display the result
    print(selected_programs)


    print(f"selected_programs: \n\n{selected_programs}\n\n")
    adapter_log_file = f"{CONFIG_LOG_FILE}{adapter_id}.log"
    ffmpeg_cmd = construct_ffmpeg_command(
        adapter.udp_url, selected_programs, adapter.adapter_number, adapter.modulator_number, adapter_log_file)
    print(f"FFmpeg command: {ffmpeg_cmd}")
    process = subprocess.Popen(ffmpeg_cmd, shell=True, preexec_fn=os.setsid)
    running_processes[adapter_id] = process
    # ToDo: check
    if process:
        adapter.running = True

    return {"message": "FFmpeg started"}


@app.post("/adapters/{adapter_id}/stop")
def stop_ffmpeg(adapter_id: int):
    print("STOP =================================\n")
    if adapter_id not in running_processes:
        raise HTTPException(status_code=404, detail="FFmpeg process not found")

    if not adapters[adapter_id].running:
        return {"message": "Adapter is already stopped"}

    process = running_processes[adapter_id]
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    del running_processes[adapter_id]
    adapters[adapter_id].running = False
    return {"message": "FFmpeg stopped"}


@app.delete("/adapters/{adapter_id}/")
def delete_adapter(adapter_id: int):
    print("DELETE =================================\n")
    if adapter_id in running_processes:
        raise HTTPException(
            status_code=400, detail="Stop FFmpeg process before deleting the adapter")
    if adapter_id not in adapters:
        raise HTTPException(status_code=404, detail="Adapter not found")

    del adapters[adapter_id]
    return {"message": "Adapter deleted"}


@app.post("/adapters/{adapter_id}/save")
def save_selection(adapter_id: int, selection: SaveSelection):
    if adapter_id not in adapters:
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
                    adapter.programs[program_id].streams[stream_type][i] = Stream(**stream)
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
    # Respond with success message
    return {"message": "Selection saved successfully"}


# Function to stop all ffmpeg processes
def stop_ffmpeg_processes():
    try:
        subprocess.run(['killall', 'ffmpeg'], check=True)
        print("All ffmpeg processes have been stopped.")
    except subprocess.CalledProcessError as e:
        print(f"Error stopping ffmpeg processes: {e}")

# Register the function to be called on application exit
atexit.register(stop_ffmpeg_processes)

# Signal handler to stop ffmpeg processes on termination
def signal_handler(sig, frame):
    print(f"Received signal {sig}. Stopping all ffmpeg processes.")
    stop_ffmpeg_processes()
    sys.exit(0)

# Register signal handlers for SIGTERM and SIGINT
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)
