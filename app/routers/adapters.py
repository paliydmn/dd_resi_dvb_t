from fastapi import APIRouter, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi import HTTPException, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from app.utils import logger
from app.utils.logger import get_ffmpeg_logger
from app.config.server_conf import adapters, save_adapters_to_file
from app.utils.ffmpeg_utils import get_ffprobe_data, construct_programs_dict, construct_ffmpeg_command
from app.models.models import AdapterConfig, Program, Stream, AvailableResources, SaveSelection
from app.config.server_conf import CONFIG_LOG_FILE, CONFIG_FILE_PATH
import threading
import logging
import subprocess
import os
import signal

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

running_processes = {}


@router.get("/adapters/", response_class=HTMLResponse)
async def adapters_page(request: Request):
    logger.info("Get Adapters page")
    return templates.TemplateResponse("adapters.html", {"request": request, "adapters": adapters})


@router.get("/adapters/available", response_model=AvailableResources)
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


@router.post("/adapters/")
def create_adapter(adapterConf: AdapterConfig):
    adapter_id = len(adapters) + 1
    adapters[adapter_id] = adapterConf
    save_adapters_to_file()
    logger.info(f"Adapter created: {adapterConf}")
    return {"id": adapter_id, "message": "Adapter created successfully"}


@router.get("/adapters/{adapter_id}/scan")
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


@router.post("/adapters/{adapter_id}/start")
def start_ffmpeg(adapter_id: int):
    if adapter_id in running_processes:
        logger.warning(
            f"FFmpeg process is already running for adapter {adapter_id}.")
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

    # #ToDo: add logger for each ffmpeg adapter start
    # adapter_log_file = f"app/logs/{CONFIG_LOG_FILE}_a{adapter_id}.log"
    ffmpeg_cmd = construct_ffmpeg_command(
        adapter.udp_url, selected_programs, adapter.adapter_number, adapter.modulator_number)
    # logger.info(f"Starting FFmpeg for adapter {adapter_id} with command: {ffmpeg_cmd}")
    
    # ff_logger = get_ffmpeg_logger(adapter_id)
    # with open(adapter_log_file, 'w') as log_file:
    #     process = subprocess.Popen(
    #         ffmpeg_cmd, shell=True, stdout=log_file, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
    #     running_processes[adapter_id] = process
    #     adapter.running = process is not None
    # # process = subprocess.Popen(ffmpeg_cmd, shell=True, preexec_fn=os.setsid)
    # # running_processes[adapter_id] = process
    process = subprocess.Popen(
        ffmpeg_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=os.setsid)

    # Redirect FFmpeg stdout and stderr to the logger
    def log_output(pipe, level):
        for line in iter(pipe.readline, b''):
            logger.log(level, line.decode().strip())
        pipe.close()

    # Start logging in separate threads to avoid blocking
    threading.Thread(target=log_output, args=(process.stdout, logging.INFO)).start()
    threading.Thread(target=log_output, args=(process.stderr, logging.ERROR)).start()

    running_processes[adapter_id] = process
    # ToDo: check
    if process:
        adapter.running = True
    return {"message": "FFmpeg started"}


@router.post("/adapters/{adapter_id}/stop")
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


@router.delete("/adapters/{adapter_id}/")
def delete_adapter(adapter_id: int):
    if adapter_id in running_processes:
        logger.warning(f"Attempt to delete adapter {adapter_id} while FFmpeg is running.")
        raise HTTPException(
            status_code=400, detail="Stop FFmpeg process before deleting the adapter")
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")

    del adapters[adapter_id]
    logger.info(f"Deleted adapter {adapter_id}.")
    return {"message": "Adapter deleted"}


@router.post("/adapters/{adapter_id}/save")
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
