# app/utils/__init__.py
import logging
from logging.handlers import RotatingFileHandler


def setup_logger(log_path="app/logs/app.log", level=logging.INFO):
    log_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s')
    log_handler = RotatingFileHandler(
        log_path, maxBytes=5*1024*1024, backupCount=5)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(level)

    logger = logging.getLogger()
    logger.setLevel(level)
    logger.addHandler(log_handler)
    return logger


# Initialize the logger when utils is imported
logger = setup_logger()
