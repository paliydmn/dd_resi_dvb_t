import os
import json
import subprocess
from pathlib import Path
from app.utils import logger
from app.models.models import AdapterConfig
from settings import settings

adapters = {}
modulators_config = {}

def save_adapters_to_file():
    """Save the current state of adapters to a JSON file."""
    logger.info("Saving adapters configuration to file.")
    try:
        with settings.adapter_conf_file.open('w') as file:
            adapters_data = {k: v.dict() for k, v in adapters.items()}
            json.dump(adapters_data, file, indent=4)
    except Exception as e:
        logger.error(f"Error saving adapters to file: {e}")


def load_adapters_from_file():
    """Load the adapters configuration from a JSON file."""
    logger.info("Loading adapters configuration from file.")
    settings.adapter_conf_file = Path(settings.adapter_conf_file)  # Ensure it's a Path object

    # Clear existing adapters
    adapters.clear()
    if settings.adapter_conf_file.exists():
        try:
            with settings.adapter_conf_file.open('r') as file:
                adapters_data = json.load(file)
                for adapter_id_str, adapter_data in adapters_data.items():
                    adapter_id = adapter_id_str
                    programs = {int(prog_id): prog_data for prog_id, prog_data in adapter_data.get("programs", {}).items()}

                    # Load adapter configuration with the updated model
                    adapters[adapter_id] = AdapterConfig(
                        adapter_number=adapter_data["adapter_number"],
                        modulator_number=adapter_data["modulator_number"],
                        type=adapter_data["type"],  # New field for adapter type
                        adapter_name = adapter_data["adapter_name"],
                        udp_urls=adapter_data["udp_urls"],  # Updated to use the list of URLs
                        programs=programs,
                        running=adapter_data.get("running", False),
                        description=adapter_data.get("description", None),
                    )
            logger.info("Loaded adapters configuration from file.")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Error loading adapters from file: {e}")
    else:
        logger.warning("Adapters configuration file does not exist.")


def get_modulator_config_path(adapter_id):
    return os.path.join(settings.modulator_conf_dir, f"mod_a_{adapter_id}.conf")

def save_modulator_config(adapter_id: int, config: dict):
    try:
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

        stream_assignments = ""
        saved_streams = config['streamAssignments']
        for i in range(int(config['channels'])):
            if f"channel{i}" in saved_streams and f"stream{i}" in saved_streams:
                channel = saved_streams[f"channel{i}"]
                stream = saved_streams[f"stream{i}"]
                if stream == '':
                    continue
                stream_assignments += f"channel = {channel}\nstream = {stream}\n#\n"

        config_content = output_section + channels_section + streams_section + stream_assignments

        with open(get_modulator_config_path(adapter_id), "w") as config_file:
            config_file.write(config_content)

        return {"status": "success", "msg" : f"Config for adapter_id {adapter_id} saved successfully"}
    except Exception as e:
        logger.error(f"Error saving modulator config for adapter_id {adapter_id}: {e}")
        return {"status": "error", "msg" : "Failed to save modulator configuration"}

def apply_modulator_config(adapter_id: int):
    try:
        config_path = get_modulator_config_path(adapter_id)
        if not os.path.isfile(config_path):
            return {"status": "Configuration file not found"}

        modconfig_app = settings.modconfig_app 
        result = subprocess.run(
            [modconfig_app, "-c", config_path],
            capture_output=True,
            text=True,
            check=True
        )
        return {"status": "success", "msg" : f"modulator configuration applied successfully for adapter: {adapter_id}"}
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running modconfig for adapter_id {adapter_id}: {e.stderr}")
        return {"status": "error", "msg" :  f"Error running 'modconfig': {e.stderr}"}
    except Exception as e:
        logger.error(f"Unexpected error in apply_m_config for adapter_id {adapter_id}: {e}")
        return {"status": "error", "msg" : f"Unexpected error occurred: {e}"}

def parse_config(adapter_id):
    logger.info(f"Parsing config for adapter_id {adapter_id}")
    try:
        modulator_config = {
            "connector": "F",
            "channels": 16,
            "power": 90.0,
            "frequency": 474.0,
            "standard": "DVBT_8",
            "streams": []
        }
        with open(get_modulator_config_path(adapter_id), "r") as config_file:
            section = None
            for line in config_file:
                line = line.strip()
                if line.startswith("#") or not line:
                    continue
                if line.startswith("["):
                    section = line[1:-1]
                else:
                    if section == "output":
                        key, value = line.split("=")
                        key = key.strip()
                        value = value.strip()
                        modulator_config[key] = value
                    elif section == "channels":
                        key, value = line.split("=")
                        key = key.strip()
                        value = value.strip()
                        modulator_config[key] = value
                    elif section == "streams":
                        if line.startswith("channel"):
                            channel = line.split("=")[1].strip()
                            stream = next(config_file).split("=")[1].strip()
                            modulator_config["streams"].append(
                                {"channel": int(channel), "stream": int(stream)})
                        else:
                            key, value = line.split("=")
                            key = key.strip()
                            value = value.strip()
                            modulator_config[key] = value
        modulators_config[adapter_id] = modulator_config
        return modulator_config
    except Exception as e:
        logger.error(f"Error parsing config for id {adapter_id}: {e}")
        logger.info(f"Default config is loaded for id {adapter_id}")
        return modulator_config


def get_modulators_config(id=0):
    try:
        parse_config(id) #ToDo: check if we can remove parse_config before return
        return modulators_config
    except Exception as e:
        logger.error(f"Error retrieving modulators config for id {id}: {e}")
        return {"status": "error", "msg" : "Failed to retrieve modulators configuration"}


def get_adapters_and_modulators():
    logger.info(f"Get Modulator adapters list: find /dev/dvb/ -type c -name 'mod*'")
    try:
        output = subprocess.check_output(
            "find /dev/dvb/ -type c -name 'mod*'", shell=True).decode('utf-8')
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
