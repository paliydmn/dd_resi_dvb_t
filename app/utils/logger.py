import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIRECTORY = "app/logs/"
LOG_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
LOG_BACKUP_COUNT = 5  # Number of backup log files to keep

def setup_main_logger(log_file="app.log", level=logging.INFO):
    log_path = os.path.join(LOG_DIRECTORY, log_file)

    log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    log_handler = RotatingFileHandler(log_path, maxBytes=LOG_FILE_SIZE, backupCount=LOG_BACKUP_COUNT)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(level)

    logger = logging.getLogger()
    logger.setLevel(level)
    logger.addHandler(log_handler)
    return logger

def get_ffmpeg_logger(adapter_id: int):
    log_path = os.path.join(LOG_DIRECTORY, f"ffmpeg_a{adapter_id}.log")
    logger = logging.getLogger(f"ffmpeg_adapter_{adapter_id}")
    logger.setLevel(logging.DEBUG)

    # Create a rotating file handler
    handler = RotatingFileHandler(log_path, maxBytes=LOG_FILE_SIZE, backupCount=LOG_BACKUP_COUNT)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Avoid adding multiple handlers to the logger
    if not logger.handlers:
        logger.addHandler(handler)

    return logger