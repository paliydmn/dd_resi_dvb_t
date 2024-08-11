
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.utils import logger
from app.utils.config_loader import (
    save_modulator_config,
    apply_modulator_config,
    parse_config,
    get_adapters_and_modulators,
)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/modulator", response_class=HTMLResponse)
async def modulator(request: Request):
    return templates.TemplateResponse("modulator.html", {"request": request})


@router.get("/modulator/data")
def modulators_data():
    try:
        return get_adapters_and_modulators()
    except Exception as e:
        logger.error(f"Error retrieving adapters and modulators data: {e}")
        return {"error": "Failed to retrieve adapters and modulators data"}


@router.get("/modulator_config/{adapter_id}")
def load_modulator_config(adapter_id: int):
    return parse_config(adapter_id)


@router.post("/apply_modulator_config/{adapter_id}")
async def apply_modulator(adapter_id: int):
    return apply_modulator_config(adapter_id)


@router.post("/save_modulator_config/{adapter_id}")
def save_modulator(adapter_id: int, config: dict):
    return save_modulator_config(adapter_id, config)


# from fastapi import APIRouter, Request
# from fastapi import Request

# from fastapi.responses import HTMLResponse
# from fastapi.templating import Jinja2Templates

# from app.config.settings import settings
# from app.utils import logger

# import subprocess
# import os

# # Todo: move to configs
# CONFIG_DIR = ""


# router = APIRouter()
# templates = Jinja2Templates(directory="app/templates")

# modulators_config = {}


# @router.get("/modulator", response_class=HTMLResponse)
# async def modulator(request: Request):
#     return templates.TemplateResponse("modulator.html", {"request": request})


# def get_adapters_and_modulators():
#     try:
#         # output = subprocess.check_output(
#         #     "find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
#         output = '''
# /dev/dvb/adapter0/mod6
# /dev/dvb/adapter0/mod5
# /dev/dvb/adapter0/mod4
# /dev/dvb/adapter0/mod3
# /dev/dvb/adapter0/mod2
# /dev/dvb/adapter0/mod1
# /dev/dvb/adapter0/mod0
# /dev/dvb/adapter1/mod2
# /dev/dvb/adapter1/mod1
# /dev/dvb/adapter1/mod0
# '''
#         if output:
#             lines = output.strip().split('\n')
#             adapter_mods = {}

#             for line in lines:
#                 parts = line.split('/')
#                 adapter_id = int(parts[3].replace("adapter", ""))
#                 mod_id = int(parts[4].replace("mod", ""))

#                 if adapter_id not in adapter_mods:
#                     adapter_mods[adapter_id] = []

#                 adapter_mods[adapter_id].append(mod_id)

#             return adapter_mods
#         return {}
#     except subprocess.CalledProcessError as e:
#         logger.error(f"Error fetching available adapters: {e}")
#         return {}


# @router.get("/modulator_config/{adapter_id}")
# def load_modulator_config(adapter_id: int):
#     try:
#         config_path = get_modulator_config_path(adapter_id)
#         if os.path.exists(config_path):
#             config = parse_config(config_path, adapter_id)
#             return config

#         # Retrieve the number of mods for the given adapter
#         adapter_data = get_adapters_and_modulators()
#         num_mods = len(adapter_data.get(adapter_id, []))

#         # Default configuration
#         default_config = {
#             "connector": "F",
#             "channels": 16,
#             "power": 90.0,
#             "frequency": 474.0,
#             "standard": "DVBT_8",
#             # Generate default stream mappings
#             "streams": [{"channel": i, "stream": i} for i in range(num_mods)]
#         }

#         return default_config
#     except Exception as e:
#         logger.error(f"Error in get_modulator_config for adapter_id {adapter_id}: {e}")
#         return {"error": "Failed to retrieve modulator configuration"}


# @router.post("/apply_modulator_config/{adapter_id}")
# async def apply_modulator_config(adapter_id: int):
#     try:
#         return apply_m_config(adapter_id)
#     except Exception as e:
#         logger.error(f"Error applying modulator config for adapter_id {adapter_id}: {e}")
#         return {"error": "Failed to apply modulator configuration"}


# def apply_m_config(adapter_id: int):
#     try:
#         config_path = get_modulator_config_path(adapter_id)

#         # Ensure the config_path is valid and file exists (add your own validation if needed)
#         if not os.path.isfile(config_path):
#             return {"status": "Configuration file not found"}

#         # ToDo: move to config
#         # Run the command line tool `./modconfig`
#         result = subprocess.run(
#             ["./modconfig", "-c", config_path],
#             capture_output=True,
#             text=True,
#             check=True
#         )
#         # If successful, return the command output
#         # print(f"\n\nstdout: {result.stdout},\n stderr : {result.stderr}")
#         return {"stdout": result.stdout, "stderr": result.stderr}
#     except subprocess.CalledProcessError as e:
#         logger.error(f"Error running modconfig for adapter_id {adapter_id}: {e.stderr}")
#         return {"status": f"Error running modconfig: {e.stderr}"}
#     except Exception as e:
#         logger.error(f"Unexpected error in apply_m_config for adapter_id {adapter_id}: {e}")
#         return {"status": "Unexpected error occurred"}


# @router.post("/save_modulator_config/{adapter_id}")
# def save_modulator_config(adapter_id: int, config: dict):
#     try:
#         config_path = get_modulator_config_path(adapter_id)
#         print(f"Modulator configuration: {config}")
#         # Create the configuration content
#         output_section = f"""[output]
# connector = {config['connector']}
# channels = {config['channels']}
# unit = DBUV
# power = {config['power']}
# #
# """

#         channels_section = f"""[channels]
# frequency = {config['frequency']}
# standard = {config['standard']}
# channels = {config['channels']}
# #
# """

#         streams_section = """[streams]
# stream_format = TS
# standard = DVBT_8
# guard_interval = 0
# fft_size = 1
# puncture_rate = 7/8
# constellation = qam64
# cell_identifier = 0
# #
# """

#         # Add channel and stream assignments
#         stream_assignments = ""
#         saved_streams = config['streamAssignments']
#         for i in range(int(config['channels'])):
#             if f"channel{i}" in saved_streams and f"stream{i}" in saved_streams:
#                 channel = saved_streams[f"channel{i}"]
#                 stream = saved_streams[f"stream{i}"]
#                 if stream == '':
#                     continue
#                 stream_assignments += f"channel = {channel}\nstream = {stream}\n#\n"

#         # Combine all sections into final configuration content
#         config_content = output_section + channels_section + \
#             streams_section + stream_assignments

#         # Write the configuration to the file
#         with open(config_path, "w") as config_file:
#             config_file.write(config_content)

#         return {"status": "success"}
#     except Exception as e:
#         logger.error(f"Error saving modulator config for adapter_id {adapter_id}: {e}")
#         return {"error": "Failed to save modulator configuration"}


# @router.get("/modulator/data")
# def modulators_data():
#     try:
#         return get_adapters_and_modulators()
#     except Exception as e:
#         logger.error(f"Error retrieving adapters and modulators data: {e}")
#         return {"error": "Failed to retrieve adapters and modulators data"}


# def parse_config(config_path, id):
#     try:
#         modulator_config = {
#             "connector": "F",
#             "channels": 16,
#             "power": 90.0,
#             "frequency": 474.0,
#             "standard": "DVBT_8",
#             "streams": []
#         }
#         with open(config_path, "r") as config_file:
#             section = None
#             for line in config_file:
#                 line = line.strip()
#                 if line.startswith("#") or not line:
#                     continue
#                 if line.startswith("["):
#                     section = line[1:-1]
#                 else:
#                     if section == "output":
#                         key, value = line.split("=")
#                         key = key.strip()
#                         value = value.strip()
#                         modulator_config[key] = value
#                     elif section == "channels":
#                         key, value = line.split("=")
#                         key = key.strip()
#                         value = value.strip()
#                         modulator_config[key] = value
#                     elif section == "streams":
#                         if line.startswith("channel"):
#                             channel = line.split("=")[1].strip()
#                             stream = next(config_file).split("=")[1].strip()
#                             modulator_config["streams"].append(
#                                 {"channel": int(channel), "stream": int(stream)})
#                         else:
#                             key, value = line.split("=")
#                             key = key.strip()
#                             value = value.strip()
#                             modulator_config[key] = value
#         print(modulator_config["streams"])
#         modulators_config[id] = modulator_config
#         return modulator_config
#     except Exception as e:
#         logger.error(f"Error parsing config for id {id}: {e}")
#         return {"error": "Failed to parse configuration"}


# def get_modulators_config(id=0):
#     try:
#         config_path = get_modulator_config_path(id)
#         parse_config(config_path, id)
#         return modulators_config
#     except Exception as e:
#         logger.error(f"Error retrieving modulators config for id {id}: {e}")
#         return {"error": "Failed to retrieve modulators configuration"}


# def get_modulator_config_path(adapter_id):
#     return os.path.join(settings.modulator_conf_dir, f"mod_a_{adapter_id}.conf")
