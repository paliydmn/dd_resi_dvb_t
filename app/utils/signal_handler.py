import os
import signal
import subprocess
import sys
import atexit
from app.config.server_conf import adapters
from app.utils import logger

def stop_ffmpeg_processes():
    """Stop all running ffmpeg processes."""
    try:
        subprocess.run(['killall', 'ffmpeg'], check=True)
        for _, adapter in adapters.items():
            adapter.running = False
        logger.info("All ffmpeg processes have been stopped.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error stopping ffmpeg processes: {e}")

def signal_handler(sig, frame):
    """Handle termination signals."""
    logger.info(f"Received signal {sig}. Stopping all ffmpeg processes.")
    stop_ffmpeg_processes()
    sys.exit(0)

def register_signal_handlers():
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    atexit.register(stop_ffmpeg_processes)
