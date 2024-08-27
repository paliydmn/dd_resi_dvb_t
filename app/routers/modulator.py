
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
