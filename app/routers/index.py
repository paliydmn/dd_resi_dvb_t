from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.utils import logger

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    logger.info("Get Root Request")
    return templates.TemplateResponse("index.html", {"request": request})



