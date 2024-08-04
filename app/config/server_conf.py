from pathlib import Path
from app.utils import logger
from app.models.models import AdapterConfig
import json

# Server configuration paths
CONFIG_LOG_FILE = "/var/log/ffmpeg_resi"
CONFIG_FILE_PATH = Path("app/config/adapters_config.json")

adapters = {}


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
