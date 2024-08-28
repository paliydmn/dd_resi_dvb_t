import logging
import os
from logging.handlers import RotatingFileHandler
from settings import settings

def setup_main_logger(log_file=settings.log_main_file, level=logging.INFO):
    log_path = os.path.join(settings.log_directory, log_file)
    # Ensure the directory exists
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    log_handler = RotatingFileHandler(log_path, maxBytes=settings.log_file_size, backupCount=settings.log_backup_count)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(level)

    logger = logging.getLogger()
    logger.setLevel(level)
    
    # Avoid adding multiple handlers to the logger
    if not logger.handlers:
        logger.addHandler(log_handler)

    return logger

def get_ffmpeg_logger(name: str, id: str):
    log_path = os.path.join(settings.log_directory, f"ff_{name}_{id}.log")
    logger = logging.getLogger(f"adapter_{id}")
    logger.setLevel(logging.DEBUG)

    # Create a rotating file handler
    handler = RotatingFileHandler(log_path, maxBytes=settings.log_file_size, backupCount=settings.log_backup_count)
    log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(log_formatter)

    # Avoid adding multiple handlers to the logger
    if not logger.handlers:
        logger.addHandler(handler)

    # Prevent logs from propagating to the root logger
    logger.propagate = False

    return logger


def delete_log_file(name: str, id: str):
    log_filename = f"ff_{name}_{id}.log"
    log_file_path = os.path.join(settings.log_directory, log_filename)

    try:
        os.remove(log_file_path)
        return(f"Deleted logfile: {log_file_path}")
    except FileNotFoundError:
        return(f"Log file not found: {log_file_path}")
    except Exception as e:
        return(f"Error deleting log file {log_file_path}: {e}")