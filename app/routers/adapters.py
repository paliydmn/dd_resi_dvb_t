from fastapi import APIRouter, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi import HTTPException, Request
from fastapi.responses import HTMLResponse
from app.utils import logger
from app.utils.logger import get_ffmpeg_logger, delete_log_file
from app.utils.config_loader import adapters, save_adapters_to_file, get_modulators_config
from app.utils.ffmpeg_utils import get_ffprobe_data, construct_programs_dict, construct_ffmpeg_command
from app.utils.signal_handler import stop_ffmpeg_processes
from app.models.models import AdapterConfig, Program, Stream, AvailableResources, SaveSelection
from settings import settings
import threading
import logging
import subprocess
import os
import time
import signal
import uuid


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

running_processes = {}


@router.get("/adapters/", response_class=HTMLResponse)
async def adapters_page(request: Request):
    logger.info("Get Adapters page")
    return templates.TemplateResponse("adapters.html", {"request": request, "adapters": adapters})


@router.get("/get_adapter/{adapter_id}")
def get_adapter_by_id(adapter_id: str):
    # Ensure descriptions are up-to-date
    set_description()

    # Retrieve the adapter by ID
    adapter = adapters.get(adapter_id)

    if adapter is None:
        raise HTTPException(status_code=404, detail="Adapter not found")

    return adapter


def set_description():
    # Update AdapterConfig with description
    for adapter_key, adapter_config in adapters.items():
        adapter_number = adapter_config.adapter_number
        modulator_number = adapter_config.modulator_number
        modulators = get_modulators_config(id=adapter_number)
        # Check if adapter_number matches a key in modulator_data
        if adapter_number in modulators:
            modulator_settings = modulators[adapter_number]
            frequency = float(modulator_settings['frequency'])

            # Find the stream in modulator_data where stream value matches modulator_number
            for stream in modulator_settings['streams']:
                if stream['stream'] == modulator_number:
                    channel_value = stream['channel']
                    description = frequency + (channel_value * 8)
                    adapter_config.description = f"{description:.1f} MHz."  # Format to 2 decimal places
                    logger.info(f"Set description = {adapter_config.description} for stream = {modulator_number}.")
                    break
    save_adapters_to_file()


@router.get("/get_adapters/")
def get_adapters():
    set_description()
    return adapters


@router.get("/adapters/stop_all")
def stop_all_adapters():
    try:
        if stop_ffmpeg_processes():
            running_processes.clear()
            for a in adapters.values():
                a.running = False
    except Exception as e:
        return {"status": "error", "msg": f"FFmpeg process failed to stop. Error: {e}"}
    
    save_adapters_to_file()
    return {"status": "success", "msg": "All FFmpeg processes are stopped!"}


@router.get("/adapters/available", response_model=AvailableResources)
def get_available_adapters():
    """Fetch available adapters and modulators from the system."""
    logger.info(f"Loading available adapters from {settings.adapter_conf_file} file.")

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

def generate_uid():
    uid = str(uuid.uuid4()).replace('-', '')[:4].upper()
    return uid


@router.post("/adapters/createMA")
def create_MPTS_adapter(adapterConf: AdapterConfig):
    # Validate that the type is MPTS
    if adapterConf.type != "MPTS":
        raise HTTPException(
            status_code=400, detail="Invalid adapter type for this route. Expected MPTS.")

    # Validate that only one URL is provided for MPTS
    if len(adapterConf.udp_urls) != 1:
        raise HTTPException(
            status_code=400, detail="MPTS adapter should have exactly one UDP URL.")

    adapter_id = generate_uid()
    adapters[adapter_id] = adapterConf
    save_adapters_to_file()
    logger.info(f"MPTS Adapter created: {adapterConf}")
    return {"status": "success", "msg": f"Adapter '{adapterConf.adapter_name}' created successfully"}


@router.post("/adapters/createSA")
def create_SPTS_adapter(adapterConf: AdapterConfig):
    # Validate that the type is SPTS
    if adapterConf.type != "SPTS":
        raise HTTPException(
            status_code=400, detail="Invalid adapter type for this route. Expected SPTS.")

    # Validate that at least one URL is provided for SPTS
    if not adapterConf.udp_urls or len(adapterConf.udp_urls) == 0:
        raise HTTPException(
            status_code=400, detail="SPTS adapter must have at least one UDP URL.")

    adapter_id = generate_uid()
    adapters[adapter_id] = adapterConf
    save_adapters_to_file()
    logger.info(f"SPTS Adapter created: {adapterConf}")
    return {"status": "success", "msg": f"Adapter '{adapterConf.adapter_name}' created successfully"}


@router.get("/adapters/{adapter_id}/scan")
def scan_adapter(adapter_id: str):
    if adapter_id not in adapters:
        raise HTTPException(status_code=404, detail="Adapter not found")
    adapter = adapters[adapter_id]

    ffprobe_data = get_ffprobe_data(adapter.type, adapter.udp_urls)

    # Check if ffprobe_data is an error message or valid data
    if isinstance(ffprobe_data, str):
        return {"status": "error", "msg": f"{ffprobe_data}"}
        #raise HTTPException(status_code=500, detail=ffprobe_data)

    programs = construct_programs_dict(ffprobe_data)
    adapters[adapter_id].programs = programs
    logger.info(f"Scanned adapter {adapter_id}: {len(programs)} programs found.")
    return {"programs": programs}


@router.post("/adapters/{adapter_id}/start")
def start_ffmpeg(adapter_id: str):
    if adapter_id in running_processes:
        logger.warning(
            f"FFmpeg process is already running for adapter {adapter_id}.")
        raise HTTPException(
            status_code=400, detail="FFmpeg process is already running for this adapter")
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")

    adapter = adapters[adapter_id]
    # #ToDo: add logger for each ffmpeg adapter start
    ffmpeg_cmd = construct_ffmpeg_command(adapter)

    logger.info(f"Starting FFmpeg for adapter {adapter_id} with command: {ffmpeg_cmd}")

    ff_logger = get_ffmpeg_logger(adapter.adapter_name, adapter_id)
    process = subprocess.Popen(ffmpeg_cmd, shell=True, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, text=True, preexec_fn=os.setsid)

    def log_output(pipe, level):
        while True:
            line = pipe.readline()
            if not line:
                break
            ff_logger.log(level, line.strip())

    # Start logging in separate threads to avoid blocking
    threading.Thread(target=log_output, args=(
        process.stdout, logging.INFO)).start()
    threading.Thread(target=log_output, args=(
        process.stderr, logging.INFO)).start()

    # Wait a bit to check for immediate FFmpeg errors
    time.sleep(3)
    return_code = process.poll()

    if return_code is not None and return_code != 0:
        logger.error(f"FFmpeg failed to start for adapter {adapter_id}.")
        return {"status": "error", "msg": f"FFmpeg process failed to start. See log file for details."}

    # Process is running, register it
    running_processes[adapter_id] = process
    adapter.running = True
    save_adapters_to_file()

    # Optional: Increase sleep time if you need to ensure process stability
    time.sleep(len(adapter.udp_urls) * 5)

    return {"status": "success", "msg": f"Adapter {adapter.adapter_name} successfully started."}


@router.post("/adapters/{adapter_id}/stop")
def stop_ffmpeg(adapter_id: str):
    if adapter_id not in running_processes:
        logger.warning(f"FFmpeg process not found for adapter {adapter_id}.")
        raise HTTPException(status_code=404, detail="FFmpeg process not found")

    if not adapters[adapter_id].running:
        logger.info(f"Adapter {adapter_id} is already stopped.")
        return {"status": "success", "msg": "Adapter is already stopped"}

    process = running_processes[adapter_id]
    try:
        logger.info(f"Process PID: {process.pid}")
        # Send SIGTERM to the process group
        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        # Wait for the process to terminate gracefully
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        logger.warning(f"FFmpeg process {adapter_id} did not terminate, sending SIGKILL")
        # Forcefully kill the process if it doesn't stop
        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        process.wait()  # Wait for the process to terminate

    # Confirm the process is terminated
    if process.poll() is None:
        logger.error(f"FFmpeg process {adapter_id} could not be stopped.")
        raise HTTPException(status_code=500, detail="FFmpeg process could not be stopped")

    # Cleanup
    del running_processes[adapter_id]
    adapters[adapter_id].running = False
    logger.info(f"Stopped FFmpeg for adapter {adapter_id}.")
    save_adapters_to_file()
    #sleep 2 seconds to be sure the process is stopped
    time.sleep(2)
    return  {"status": "success", "msg" : f"Adapter {adapters[adapter_id].adapter_name} successfully stopped."}


@router.delete("/adapters/{adapter_id}/")
def delete_adapter(adapter_id: str):
    if adapter_id in running_processes:
        logger.warning(f"Attempt to delete adapter {adapter_id} while FFmpeg is running.")
        raise HTTPException(
            status_code=400, detail="Stop FFmpeg process before deleting the adapter")
    if adapter_id not in adapters:
        logger.warning(f"Adapter {adapter_id} not found.")
        raise HTTPException(status_code=404, detail="Adapter not found")
    name = adapters[adapter_id].adapter_name
    del adapters[adapter_id]
    del_res = delete_log_file(name=name, id=adapter_id)
    logger.info(del_res)
    save_adapters_to_file()
    return  {"status": "success", "msg" : f"Adapter {name} successfully deleted."}


@router.post("/adapters/{adapter_id}/save")
def save_selection(adapter_id: str, selection: SaveSelection):
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
    return  {"status": "success", "msg" : f"Adapter {adapter.adapter_name} successfully saved."}
