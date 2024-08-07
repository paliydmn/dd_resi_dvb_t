from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

import uvicorn
from app.utils import logger
from app.routers.index import router as index_router
from app.routers.adapters import router as adapter_router
from app.routers.modulator import router as modulator_router

from app.utils.signal_handler import register_signal_handlers, stop_ffmpeg_processes
from app.config.server_conf import ADAPTER_CONF_FILE, load_adapters_from_file, save_adapters_to_file

import os
import json

app = FastAPI()
app.include_router(index_router)
app.include_router(adapter_router)
app.include_router(modulator_router)
app.include_router(modulator_router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# Load adapters from file
if os.path.exists(ADAPTER_CONF_FILE):
    with open(ADAPTER_CONF_FILE, "r") as f:
        adapters = json.load(f)
        logger.info(f"Loaded adapters configuration from {ADAPTER_CONF_FILE}")


@app.on_event("startup")
def startup_event():
    logger.info("App startup event triggered.")
    load_adapters_from_file()


@app.on_event("shutdown")
def shutdown_event():
    logger.info("App shutdown event triggered.")
    stop_ffmpeg_processes()
    save_adapters_to_file()


if __name__ == "__main__":
    register_signal_handlers()
    uvicorn.run(app, host="0.0.0.0", port=8008)
