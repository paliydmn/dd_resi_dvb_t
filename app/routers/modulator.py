from fastapi import APIRouter, Request
from fastapi import Form, Request
from fastapi.responses import RedirectResponse

from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from app.utils import logger
from app.config.server_conf import adapters

import subprocess
import json
import os

#Todo: move to configs
CONFIG_DIR = ""


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
output = '''
/dev/dvb/adapter0/mod13
/dev/dvb/adapter0/mod12
/dev/dvb/adapter0/mod11
/dev/dvb/adapter0/mod10
/dev/dvb/adapter0/mod9
/dev/dvb/adapter0/mod8
/dev/dvb/adapter0/mod7
/dev/dvb/adapter0/mod6
/dev/dvb/adapter0/mod5
/dev/dvb/adapter0/mod4
/dev/dvb/adapter0/mod3
/dev/dvb/adapter0/mod2
/dev/dvb/adapter0/mod1
/dev/dvb/adapter0/mod0
/dev/dvb/adapter1/mod7
/dev/dvb/adapter1/mod6
/dev/dvb/adapter1/mod5
/dev/dvb/adapter1/mod4
/dev/dvb/adapter1/mod3
/dev/dvb/adapter1/mod2
/dev/dvb/adapter1/mod1
/dev/dvb/adapter1/mod0
'''
@router.get("/modulator", response_class=HTMLResponse)
async def modulator(request: Request):
    return templates.TemplateResponse("modulator.html", {"request": request})

def get_adapters_and_modulators():
    try:
        # output = subprocess.check_output(
        #     "find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
        output = '''
/dev/dvb/adapter0/mod13
/dev/dvb/adapter0/mod12
/dev/dvb/adapter0/mod11
/dev/dvb/adapter0/mod10
/dev/dvb/adapter0/mod9
/dev/dvb/adapter0/mod8
/dev/dvb/adapter0/mod7
/dev/dvb/adapter0/mod6
/dev/dvb/adapter0/mod5
/dev/dvb/adapter0/mod4
/dev/dvb/adapter0/mod3
/dev/dvb/adapter0/mod2
/dev/dvb/adapter0/mod1
/dev/dvb/adapter0/mod0
/dev/dvb/adapter1/mod7
/dev/dvb/adapter1/mod6
/dev/dvb/adapter1/mod5
/dev/dvb/adapter1/mod4
/dev/dvb/adapter1/mod3
/dev/dvb/adapter1/mod2
/dev/dvb/adapter1/mod1
/dev/dvb/adapter1/mod0
'''
        if output:
            lines = output.strip().split('\n')
            adapter_mods = {}

            for line in lines:
                parts = line.split('/')
                adapter_id = int(parts[3].replace("adapter", ""))
                mod_id = int(parts[4].replace("mod", ""))

                if adapter_id not in adapter_mods:
                    adapter_mods[adapter_id] = []

                adapter_mods[adapter_id].append(mod_id)

            return adapter_mods
        return {}
    except subprocess.CalledProcessError as e:
        logger.error(f"Error fetching available adapters: {e}")
        return {}



@router.get("/api/modulator_config/{adapter_id}")
def get_modulator_config(adapter_id: int):
    config_path = os.path.join(CONFIG_DIR, f"mod_a_{adapter_id}.conf")
    if os.path.exists(config_path):
        with open(config_path, "r") as config_file:
            config = json.load(config_file)
        return config
    
    # Retrieve the number of mods for the given adapter
    adapter_data = get_adapters_and_modulators()
    num_mods = len(adapter_data.get(adapter_id, []))
    
    # Default configuration
    default_config = {
        "connector": "F",
        "channels": 16,
        "power": 90.0,
        "frequency": 114.0,
        "standard": "DVBT_8",
        "streams": [f"Stream {i+1}" for i in range(num_mods)]  # Generate default stream names
    }
    
    return default_config

@router.post("/api/save_modulator_config/{adapter_id}")
def save_modulator_config(adapter_id: int, config: dict):
    config_path = os.path.join(CONFIG_DIR, f"mod_a_{adapter_id}.conf")
    print(f"Modulator configuration: {config}")
    # Create the configuration content
    output_section = f"""[output]
connector = {config['connector']}
channels = {config['channels']}
unit = DBUV
power = {config['power']}
#
"""
    
    channels_section = f"""[channels]
frequency = {config['frequency']}
standard = {config['standard']}
channels = {config['channels']}
#
"""
    
    streams_section = """[streams]
stream_format = TS
standard = DVBT_8
guard_interval = 0
fft_size = 1
puncture_rate = 7/8
constellation = qam64
cell_identifier = 0
#
"""
    
    # Add channel and stream assignments
    stream_assignments = ""
    saved_streams = config['streamAssignments']
    for i in range(int(config['channels'])):
        if f"channel{i}" in saved_streams and f"stream{i}" in saved_streams:
            channel = saved_streams[f"channel{i}"]
            stream = saved_streams[f"stream{i}"]
            if stream == '':
                continue  
            stream_assignments += f"channel = {channel}\nstream = {stream}\n#\n"
    
    # Combine all sections into final configuration content
    config_content = output_section + channels_section + streams_section + stream_assignments
    
    # Write the configuration to the file
    with open(config_path, "w") as config_file:
        config_file.write(config_content)
    
    return {"status": "success"}



@router.get("/modulator/data")
def adapters_and_modulators():
    return get_adapters_and_modulators()

# @router.post("/modulator/configure")
# async def configure_modulator(connector: str = Form(...),
#                               channels: int = Form(...),
#                               power: float = Form(...),
#                               frequency: float = Form(...),
#                               standard: str = Form(...),
#                               stream: dict = Form(...)):
#     modulator_config = f"""
#     [output]
#     connector = {connector}
#     channels = {channels}
#     unit = DBUV
#     power = {power}

#     [channels]
#     frequency = {frequency}
#     standard = {standard}
#     channels = {channels}
    
#     [streams]
#     stream_format = TS
#     standard = {standard}
#     guard_interval = 0
#     fft_size = 1
#     puncture_rate = 7/8
#     constellation = qam64
#     cell_identifier = 0
#     """

#     for slot, stream_value in stream.items():
#         if stream_value:
#             modulator_config += f"\nchannel = {slot}\nstream = {stream_value[-1]}"

#     with open("modulator.conf", "w") as f:
#         f.write(modulator_config)

#     return RedirectResponse(url="/modulator", status_code=303)

# class AdapterModulatorResponse(BaseModel):
#     adapters: list[int]
#     modulators: list[int]

# def get_adapters_and_modulators() -> AdapterModulatorResponse:
#     try:
#         # output = subprocess.check_output(
#         #     "find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
#         output = '''
# /dev/dvb/adapter0/mod13
# /dev/dvb/adapter0/mod12
# /dev/dvb/adapter0/mod11
# /dev/dvb/adapter0/mod10
# /dev/dvb/adapter0/mod9
# /dev/dvb/adapter0/mod8
# /dev/dvb/adapter0/mod7
# /dev/dvb/adapter0/mod6
# /dev/dvb/adapter0/mod5
# /dev/dvb/adapter0/mod4
# /dev/dvb/adapter0/mod3
# /dev/dvb/adapter0/mod2
# /dev/dvb/adapter0/mod1
# /dev/dvb/adapter0/mod0
# '''
#         if output:
#             lines = output.strip().split('\n')
#             adapters = {int(line.split('/')[3].replace("adapter", "")) for line in lines}
#             modulators = {int(line.split('/')[4].replace("mod", "")) for line in lines}
#             return AdapterModulatorResponse(adapters=sorted(adapters), modulators=sorted(modulators))
#         return AdapterModulatorResponse(adapters=[], modulators=[])
#     except subprocess.CalledProcessError as e:
#         logger.error(f"Error fetching available adapters: {e}")
#         return AdapterModulatorResponse(adapters=[], modulators=[])

# @router.get("/api/number_of_streams")
# def get_number_of_streams():
#     try:
#         output = "14"
#         #subprocess.check_output("find /dev/dvb/ -type c -name 'mod*' | wc -l", shell=True).decode('utf-8')
#         return {"number_of_streams": int(output.strip())}
#     except subprocess.CalledProcessError as e:
#         logger.error(f"Error fetching number of streams: {e}")
#         return {"number_of_streams": 0}
