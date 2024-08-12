from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI

import uvicorn
from app.routers.index import router as index_router
from app.routers.adapters import router as adapter_router
from app.routers.modulator import router as modulator_router

from app.utils.signal_handler import register_signal_handlers, stop_ffmpeg_processes

from app.utils.config_loader import adapters, save_adapters_to_file, load_adapters_from_file, apply_modulator_config
from settings import settings

from app.utils import logger

ADAPTER_CONF_FILE = settings.adapter_conf_file

app = FastAPI()
app.include_router(index_router)
app.include_router(adapter_router)
app.include_router(modulator_router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# # Load adapters from file
# if os.path.exists(ADAPTER_CONF_FILE):
#     with open(ADAPTER_CONF_FILE, "r") as f:
#         adapters = json.load(f)
#         logger.info(f"Loaded adapters configuration from {ADAPTER_CONF_FILE}")


@app.on_event("startup")
def startup_event():
    logger.info("App startup event triggered.")
    load_adapters_from_file()
    apply_mod_config_for_all()


@app.on_event("shutdown")
def shutdown_event():
    logger.info("App shutdown event triggered.")
    stop_ffmpeg_processes()
    save_adapters_to_file()


def apply_mod_config_for_all():
    modulators = {entry["adapter_number"] for entry in adapters.values()}
    logger.info(f"Applying modulator configs to adapters: {modulators}")
    for adapter_number in modulators:
        logger.info(apply_modulator_config(adapter_number))


if __name__ == "__main__":
    register_signal_handlers()
    uvicorn.run(app, host="0.0.0.0", port=8008)
