import os
import re
import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.templating import Jinja2Templates
from settings import settings
from app.utils import logger

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

MODULATOR_DEVID = settings.mod_devid


@router.get("/info/")
def show_info_page(request: Request):
    logger.info("Get Logs page")
    return templates.TemplateResponse("info.html", {"request": request})


def find_modulator_cards() -> List[str]:
    modulator_cards = []
    ddbridge_path = settings.mod_card_path
    if not os.path.exists(ddbridge_path):
        logger.warning(f"{ddbridge_path} does not exist.")
        return modulator_cards

    for entry in os.listdir(ddbridge_path):
        entry_path = os.path.join(ddbridge_path, entry)
        if os.path.isdir(entry_path):
            devid0_path = os.path.join(entry_path, "devid0")
            if os.path.exists(devid0_path):
                try:
                    with open(devid0_path, "r") as f:
                        devid0 = f.read().strip()
                        if devid0.lower() == MODULATOR_DEVID.lower():
                            modulator_cards.append(entry)
                except Exception as e:
                    logger.error(f"Error reading {devid0_path}: {e}")
    return modulator_cards

def read_temperatures(card: str) -> List[float]:
    temp_path = f"/sys/class/ddbridge/{card}/temp"
    temperatures = []
    if not os.path.exists(temp_path):
        logger.warning(f"Temperature file {temp_path} does not exist.")
        return temperatures
    try:
        with open(temp_path, "r") as f:
            temp_values = f.read().strip().split()
            for temp_str in temp_values:
                if re.match(r'^\d+$', temp_str):
                    temp_c = int(temp_str) / 1000.0
                    temperatures.append(temp_c)
                else:
                    logger.warning(f"Invalid temperature value: {temp_str} in {temp_path}")
    except Exception as e:
        logger.error(f"Error reading {temp_path}: {e}")
    return temperatures

@router.get("/modulators/temperatures")
def get_modulator_temperatures():
    modulator_cards = find_modulator_cards()
    if not modulator_cards:
        logger.warning("No modulator cards found.")
        raise HTTPException(status_code=404, detail="No modulator cards found")

    modulators = {}
    for card in modulator_cards:
        temps = read_temperatures(card)
        if temps:
            modulators[card] = temps
    
    if not modulators:
        raise HTTPException(status_code=404, detail="No temperatures available for modulator cards")
    
    return modulators
