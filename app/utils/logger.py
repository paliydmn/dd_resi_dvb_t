import logging
import os
from logging.handlers import RotatingFileHandler
from settings import settings

def setup_main_logger(log_file="app.log", level=logging.INFO):
    log_path = os.path.join(settings.log_directory, log_file)
    # Ensure the directory exists
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    log_handler = RotatingFileHandler(log_path, maxBytes=settings.log_file_size, backupCount=settings.log_backup_count)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(level)

    logger = logging.getLogger()
    logger.setLevel(level)
    logger.addHandler(log_handler)
    return logger

def get_ffmpeg_logger(adapter_id: int):
    log_path = os.path.join(settings.log_directory, f"ffmpeg_a{adapter_id}.log")
    logger = logging.getLogger(f"ffmpeg_adapter_{adapter_id}")
    logger.setLevel(logging.DEBUG)

    # Create a rotating file handler
    handler = RotatingFileHandler(log_path, maxBytes=settings.log_file_size, backupCount=settings.log_backup_count)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Avoid adding multiple handlers to the logger
    if not logger.handlers:
        logger.addHandler(handler)

    return logger