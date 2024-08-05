# app/utils/__init__.py
from app.utils.logger import setup_main_logger

# Initialize the logger when utils is imported
logger = setup_main_logger()
