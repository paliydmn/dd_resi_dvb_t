from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI

import uvicorn
import argparse

from app.routers.index import router as index_router
from app.routers.adapters import router as adapter_router
from app.routers.modulator import router as modulator_router
from app.routers.logs import router as logs_router
from app.routers.info import router as info_router

from app.utils.signal_handler import register_signal_handlers, stop_ffmpeg_processes

from app.utils.config_loader import adapters, save_adapters_to_file, load_adapters_from_file, apply_modulator_config
from settings import settings

from app.utils import logger

import mimetypes
mimetypes.add_type("application/javascript", ".js", True)

ADAPTER_CONF_FILE = settings.adapter_conf_file

app = FastAPI()
app.include_router(index_router)
app.include_router(adapter_router)
app.include_router(modulator_router)
app.include_router(logs_router)
app.include_router(info_router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


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
    modulators = {entry.adapter_number for entry in adapters.values()}
    logger.info(f"Applying modulator configs to adapters: {modulators}")
    for adapter_number in modulators:
        logger.info(apply_modulator_config(adapter_number))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ResiCast FastAPI application.")
    parser.add_argument("-p", "--port", type=int, default=settings.default_port, help="Port to run the server on")
    args = parser.parse_args()

    register_signal_handlers()
    uvicorn.run("app.main:app", host="0.0.0.0", port=args.port)
