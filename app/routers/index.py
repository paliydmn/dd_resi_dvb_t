from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.utils import logger
from app.config.server_conf import adapters

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    logger.info("Get Root Request")
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/modulator", response_class=HTMLResponse)
async def modulator(request: Request):
    return templates.TemplateResponse("modulator.html", {"request": request})

@router.get("/adapters/", response_class=HTMLResponse)
async def adapters_page(request: Request):
    logger.info("Get Adapters page")
    return templates.TemplateResponse("adapters.html", {"request": request, "adapters": adapters})

@router.get("/get_adapters/")
def get_adapters():
    return adapters
